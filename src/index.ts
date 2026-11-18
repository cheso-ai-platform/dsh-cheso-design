/**
 * Cheso × DeepSeek Harness 宿主端。
 *
 * 向模型提供 Cheso 任务工具，并向浏览器提供签发只读预览地址的接口。
 * 预览页与 ChatGPT 插件共用 `/embed/preview`，消息协议一致。
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { defineTool, type ToolDispatchExecution, type ToolExecutionResult } from '@deepseek-ai/dsh-tools';
import z from '@deepseek-ai/schemastery';
import { ChesoApi, ChesoApiError, chesoId, type ChesoFile } from './api';
import { CHESO_CALLBACK_PATH, ChesoAuthorization, LoginAttemptError, LoginRequired, type CredentialStore } from './auth';
import { isEmbedFormat } from './embed-format';
import { uploadAttachment } from './files';
import { askWhileQuestionIsOpen, replyToTask, stopTask, waitForTask, type QuestionPreview, type QuestionReceipt } from './tasks';
import { CHESO_SITE_OPTIONS, CHESO_SITES, type ChesoSite, type SiteOptions } from './sites';

export const name = 'cheso';

export const inject = ['tools', 'workingDirectory', 'credentials'];

export const Config = z.object({
  /** DSH 以可实时读取的配置项提供站点，切换后新请求立即使用新站点。 */
  site: z.union([...CHESO_SITE_OPTIONS]).default('configured').volatile(),
  /** Cheso 站点，例如 https://cheso.ai。 */
  baseUrl: z.string().default(CHESO_SITES.global),
  /** 只读预览页所在站点；留空跟随 baseUrl，本地开发时可指向 Vite。 */
  embedBaseUrl: z.string().default(''),
  /** 可选的 Manager 分流标识，传给预览路由发起的文件查询。 */
  devSet: z.string().default(''),
  /** 每段任务轮询的默认上限（秒），不含用户回答时间。 */
  timeoutSec: z.number().default(540),
  /** 可选的 API 令牌。留空时使用 DSH 保存的登录授权。 */
  token: z.string().default(''),
});

type PluginConfig = {
  site: { get(): ChesoSite };
  baseUrl: string;
  embedBaseUrl: string;
  devSet?: string;
  timeoutSec: number;
  token: string;
};

type ChesoConfig = Omit<PluginConfig, 'site'> & {
  api: ChesoApi;
  legacyEmbedBaseUrl?: string;
};

type PlanSubmission = {
  plan_id?: string;
  project_id?: string;
  plan_status?: string;
  queued?: boolean;
  message?: { message_id?: string };
};

const STOP_SUMMARY = 'Cheso 任务已停止。请用一两句话告知用户，按需提及任务结果列出的成品和项目链接。不要再查询项目文件、继续等待或重新提交任务。';
const DSH_LOGIN_REQUIRED = 'Cheso 未登录。请用户从 DSH 登录卡获取授权链接并完成浏览器授权，然后再继续。';

interface StartupPatch {
  id?: string;
  name?: string;
  config?: unknown;
  insert?: readonly StartupEntry[];
}

interface StartupEntry {
  id?: string;
  group?: boolean;
  config?: unknown;
}

/** 在启动配置条目及嵌套分组中递归查找指定 ID。 */
function includesStartupEntry(entries: readonly StartupEntry[], id: string): boolean {
  return entries.some(entry => entry.id === id || (
    entry.group === true && Array.isArray(entry.config) && includesStartupEntry(entry.config, id)
  ));
}

interface Artifact {
  file_id?: string;
  version?: number;
  name: string;
  format: string;
  category?: string;
  created_at?: string;
}

/** 从文件名推断预览格式，兼容 Dockerfile 等无普通扩展名的文件。 */
function formatOf(nameOrPath: string): string {
  const name = (nameOrPath.split(/[\\/]/).pop() ?? '').toLowerCase();
  return path.extname(name).slice(1) || (isEmbedFormat(name.replace(/^\./, '')) ? name.replace(/^\./, '') : '');
}

/** 去除站点配置值两端的空白及末尾斜杠，供路由拼接和站点比较使用。 */
function trimBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

/** 为站点选项解析 API 地址、预览地址和凭据，并创建该站点的 API 客户端。 */
function resolveSiteConfig({ site: _site, ...config }: PluginConfig, site: ChesoSite, credentials: CredentialStore): ChesoConfig {
  const configuredBase = trimBaseUrl(config.baseUrl);
  const baseUrl = site === 'configured' ? configuredBase : CHESO_SITES[site];
  const embedOverride = site === 'configured' ? trimBaseUrl(config.embedBaseUrl) : '';
  // 固定令牌属于配置的 API 地址，切到另一个站点后改用该站点的独立授权。
  const inheritToken = baseUrl === configuredBase;
  return {
    ...config,
    baseUrl,
    embedBaseUrl: embedOverride || baseUrl,
    legacyEmbedBaseUrl: site === 'configured' && !embedOverride ? CHESO_SITES.global : undefined,
    devSet: config.devSet?.trim() || undefined,
    token: inheritToken ? config.token : '',
    api: new ChesoApi(baseUrl, new ChesoAuthorization(credentials, baseUrl), () =>
      inheritToken ? config.token?.trim() || process.env.CHESO_API_TOKEN?.trim() : undefined),
  };
}

/** 将缺少授权转换为登录卡数据，为项目并发冲突提供可读提示，其余错误直接抛出。 */
function toolFailure(error: unknown, config: ChesoConfig, taskId?: string) {
  const common = { ...(taskId ? { task_id: taskId } : {}), embed_base_url: config.embedBaseUrl };
  if (error instanceof LoginRequired) return { ...common, status: 'login_required', message: error.message, base_url: config.baseUrl };
  if (error instanceof ChesoApiError && error.code === 2614) {
    throw new Error('该项目已有任务在运行，请等待任务完成后再试。');
  }
  throw error;
}

/** 工具输出模式都设置了 `additionalProperties: false`。显式传入 `undefined` 会导致
 *  无损 JSON 校验失败，工具结果会被判定为无效输出，因此返回前先去掉值为 `undefined` 的字段。 */
function definedOnly<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** 将文件创建时间转换为排序键。缺失或无效的时间按最早处理。 */
function creationTime(artifact: Artifact): number {
  const timestamp = Date.parse(artifact.created_at ?? '');
  return Number.isFinite(timestamp) ? timestamp : Number.MIN_SAFE_INTEGER;
}

/** 将文件列表转换为卡片条目，提取格式并按成品和创建时间排序。 */
function artifactsOf(view: Record<string, unknown>): Artifact[] {
  const files = Array.isArray(view.files) ? view.files : [];
  const artifacts: Artifact[] = [];
  for (const item of files) {
    if (!item || typeof item !== 'object' || item.kind === 'folder') continue;
    const name = String(item.name ?? item.path ?? item.file_id ?? 'artifact');
    artifacts.push({
      name,
      format: formatOf(name),
      ...(typeof item.file_id === 'string' ? { file_id: item.file_id } : {}),
      ...(typeof item.version === 'number' ? { version: item.version } : {}),
      ...(typeof item.category === 'string' ? { category: item.category } : {}),
      ...(typeof item.created_at === 'string' ? { created_at: item.created_at } : {}),
    });
  }
  // 成品置顶并保留 Cheso 给出的顺序，其余文件按创建时间从新到旧排列。
  return artifacts.sort((a, b) => {
    const priority = Number(b.category === 'result') - Number(a.category === 'result');
    if (priority !== 0 || a.category === 'result') return priority;
    return creationTime(b) - creationTime(a);
  });
}

const artifactCardSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    task_id: { type: 'string' },
    status: { type: 'string' },
    project_id: { type: 'string' },
    project_url: { type: 'string' },
    artifacts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          file_id: { type: 'string' },
          version: { type: 'number' },
          name: { type: 'string' },
          format: { type: 'string' },
          category: { type: 'string' },
          created_at: { type: 'string' },
        },
      },
    },
    embed_base_url: { type: 'string' },
    base_url: { type: 'string' },
    message: { type: 'string' },
    answer: { type: 'string' },
  },
} as const;

const waitCardSchema = {
  ...artifactCardSchema,
  properties: {
    ...artifactCardSchema.properties,
    question_receipts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          answers: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                label: { type: 'string', required: true },
                question: { type: 'string' },
                values: { type: 'array', required: true, items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  },
} as const;

/** 整理工具输出中的卡片字段，并将答复摘要限制在 1200 个字符以内。 */
function cardPayload(view: Record<string, unknown>, config: ChesoConfig, extra: Record<string, unknown> = {}) {
  return definedOnly({
    task_id: typeof view.task_id === 'string' ? view.task_id : undefined,
    status: typeof view.status === 'string' ? view.status : 'unknown',
    project_id: typeof view.project_id === 'string' ? view.project_id : undefined,
    project_url: typeof view.project_url === 'string' ? view.project_url : undefined,
    message: typeof view.message === 'string' ? view.message : undefined,
    answer: typeof view.answer === 'string' ? view.answer.slice(0, 1200) : undefined,
    artifacts: artifactsOf(view),
    embed_base_url: trimBaseUrl(config.embedBaseUrl),
    ...extra,
  });
}

/** 用任务快照展示已确认的成品，按需补齐项目链接。 */
async function stoppedCard(
  result: { task_id: string; project_id?: string; files?: ChesoFile[]; message?: string; answer?: string },
  config: ChesoConfig, signal?: AbortSignal, extra?: Record<string, unknown>,
) {
  let projectId: string | undefined;
  try {
    let id = result.project_id;
    if (!id) {
      const deadline = AbortSignal.timeout(5000);
      const plan = await config.api.request<{ project_id?: string }>(`/api/v1/plans/${chesoId(result.task_id)}`, {
        signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
      });
      id = plan.project_id;
    }
    if (id) projectId = chesoId(id);
  } catch {
    // 获取项目链接失败时，仍返回已确认的停止状态和成品。
    signal?.throwIfAborted();
  }
  return cardPayload({
    ...result, status: 'terminated', project_id: projectId,
    project_url: projectId ? config.api.projectUrl(projectId) : undefined,
  }, config, extra);
}

/** 接受项目 ID 或完整项目链接，并校验链接与当前 Cheso 站点同源。 */
function projectIdFromReference(reference: string, baseUrl: string): string {
  const input = reference.trim();
  if (/^project_[a-z0-9]+$/i.test(input)) return input;

  const url = URL.canParse(input) ? new URL(input) : undefined;
  const projectId = url?.pathname.match(/^\/agent\/(project_[a-z0-9]+)(?:\/|$)/i)?.[1];
  if (!url || !projectId || url.username || url.password) {
    throw new Error('请输入 project_id 或完整的 Cheso 项目链接。');
  }
  if (url.origin !== new URL(baseUrl).origin) {
    throw new Error('项目链接与插件配置的 Cheso 站点不一致。');
  }
  return projectId;
}

// 文字摘要供模型读取，最后一行的 JSON 供客户端渲染和重放历史卡片。
function renderCard(payload: Record<string, unknown>, headline: string): { type: 'text'; text: string }[] {
  const lines: string[] = [headline];
  if (payload.project_url) lines.push(`项目：${String(payload.project_url)}`);
  const artifacts = (payload.artifacts ?? []) as Artifact[];
  if (artifacts.length > 0) {
    lines.push('文件：');
    for (const item of artifacts) {
      const tag = item.file_id ? ` [${item.file_id}${item.version ? ` v${item.version}` : ''}]` : '';
      lines.push(`- ${item.name} (${item.format})${tag}`);
    }
  }
  if (payload.message) lines.push(String(payload.message));
  if (payload.answer) {
    lines.push('', String(payload.answer));
  }
  lines.push(`[cheso-card]${JSON.stringify(payload)}`);
  return [{ type: 'text', text: lines.join('\n') }];
}

/** 按项目来源选择预览所用站点。旧卡仅有预览地址时，要求它唯一对应一个 API 站点。 */
function previewSite(configs: ChesoConfig[], projectUrl: string | null, embedBaseUrl: string | null): ChesoConfig | undefined {
  if (projectUrl) {
    const project = URL.canParse(projectUrl) ? new URL(projectUrl) : undefined;
    if (!project || project.username || project.password || !/^\/agent\/project_[a-z0-9]+(?:\/|$)/i.test(project.pathname)) {
      return undefined;
    }
    // 项目来源决定用哪个站点的凭据。预览地址只用于在同一来源下选配置。
    const matchingSites = configs.filter(config => URL.canParse(config.baseUrl) && new URL(config.baseUrl).origin === project.origin);
    return matchingSites.find(config => config.embedBaseUrl === embedBaseUrl) ?? matchingSites[0];
  }

  // 将旧版默认预览地址纳入匹配，避免缺少项目链接的历史卡片被错误路由到其他站点。
  const matchingSites = configs.filter(config =>
    config.embedBaseUrl === embedBaseUrl || config.legacyEmbedBaseUrl === embedBaseUrl);
  return new Set(matchingSites.map(config => config.baseUrl)).size === 1 ? matchingSites[0] : undefined;
}

/** 创建 UTF-8 JSON 响应，并禁止缓存接口结果。 */
function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/** 为可接收 OAuth 回调的 DSH 地址生成回调链接，允许 HTTPS 和本机回环 HTTP。 */
function browserLoginCallback(root: string | undefined): string | undefined {
  if (!root || !URL.canParse(root)) return;
  const url = new URL(root);
  if (!url.hostname || url.username || url.password || ['0.0.0.0', '[::]'].includes(url.hostname)) return;

  // Cheso 允许回环地址使用 HTTP，其余地址必须使用 HTTPS。
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol === 'https:' || (url.protocol === 'http:' && loopback)) {
    return new URL(CHESO_CALLBACK_PATH, url).href;
  }
}

/** 注册 Cheso 工具、OAuth 回调以及客户端使用的账号、配置和预览路由。 */
export function apply(ctx: any, pluginConfig: PluginConfig): void {
  const configs = {
    configured: resolveSiteConfig(pluginConfig, 'configured', ctx.credentials),
    global: resolveSiteConfig(pluginConfig, 'global', ctx.credentials),
  };
  /** 在每次调用时读取当前站点配置，使站点切换即时生效。 */
  const currentConfig = () => configs[pluginConfig.site.get()];
  const previewConfigs = Object.values(configs);
  // 绑定运行中的任务与创建时的站点。该记录随宿主端重启清空。
  const pendingTasks = new Map<string, {
    config: ChesoConfig;
    projectId?: string;
    agentType?: string;
    previousTaskId?: string;
    asking?: boolean;
    repliedQuestion?: string;
  }>();
  type QuestionActivity = { previews: QuestionPreview[] | null; receipts: QuestionReceipt[] };
  const waitQuestionActivity = new Map<string, QuestionActivity>();
  const receiptsByExecution = new WeakMap<ToolDispatchExecution, QuestionReceipt[]>();
  ctx.on('tools/execute', async (exec: ToolDispatchExecution, next: () => Promise<ToolExecutionResult>) => {
    if (exec.name !== 'cheso_wait') return next();
    const result = await next();
    const receipts = receiptsByExecution.get(exec);
    if (!result.isError || !receipts?.length) return result;
    // 工具取消或后续出错时，仍保留 Cheso 已接受的答复。
    const meta = result.meta;
    return {
      ...result,
      meta: {
        ...(meta && typeof meta === 'object' && !Array.isArray(meta) ? meta : {}),
        cheso_question_receipts: receipts,
      },
    };
  }, { global: true });
  /** 根据 DSH 对外地址选择浏览器授权或设备码授权，并返回当前挑战。 */
  const login = async (config: ChesoConfig, signal: AbortSignal) => {
    const webServer = ctx.get('webServer');
    let root: string | undefined;
    if (webServer) {
      try {
        root = ctx.get('webApp')?.getAdvertisedUrl() ?? webServer.getOrigin();
      } catch {
        // DSH 尚未绑定监听地址，或监听地址无法表示为 URL 时，无法取得服务器来源。
      }
    }
    const redirectUri = browserLoginCallback(root);
    return { status: 'login_pending', base_url: config.baseUrl, ...await config.api.auth.start(signal, redirectUri) };
  };
  /** 短暂检查站点授权，将结果归纳为已登录、等待中或需要登录。 */
  const checkLogin = async (config: ChesoConfig, signal: AbortSignal) => {
    try {
      const signedIn = await config.api.auth.wait(4000, signal);
      return { status: signedIn ? 'signed_in' : 'waiting', base_url: config.baseUrl };
    } catch (error) {
      if (!(error instanceof LoginRequired)) throw error;
      return { status: 'login_required', base_url: config.baseUrl };
    }
  };

  ctx.inject(['systemPrompt'], (promptCtx: any) => {
    promptCtx.effect(() => promptCtx.systemPrompt.section({
      name: 'cheso:plugin-routing',
      order: promptCtx.systemPrompt.getSectionOrder('TOOLS_SDK'),
      text:
        'For Cheso requests in DSH, use only the native dsh-cheso-design cheso_* tools. The catalog entry named cheso is a separate CLI workflow: do not load it or run Cheso shell commands, even if that skill was loaded earlier. The two integrations have separate sign-ins. ' +
        'Start deliverable requests with cheso_create, without a login preflight. If a tool returns login_required, direct the user to its DSH login card. Use cheso_login for an explicit sign-in request, cheso_login_wait after the user authorizes, and cheso_whoami when asked about the account. If the plugin does not support an action, direct the user to Cheso. ' +
        'When creating or revising a deliverable in a named project, call cheso_create directly with project_id. ' +
        'Copy the user’s original task wording into cheso_create.prompt verbatim, including their priorities. ' +
        'Include earlier user-provided or user-approved text only when the user explicitly refers to it. ' +
        'Do not rewrite, expand, or add an audience, language, style, outline, output format, or other requirements. Leave unspecified choices to Cheso. ' +
        'Use cheso_project_files with show_card: true when the user asks to see the project files or artifacts. ' +
        'Leave show_card unset when checking project files for your own context. ' +
        'After creation, use one cheso_wait call at a time and continue with the existing task if it is still running. ' +
        'Treat terminated (including hard_stopped) as final. Briefly report the stop and any artifacts confirmed by the task result. Do not list project files, wait again, or resubmit the stopped task. ' +
        'If the user asks to stop a Cheso task, call cheso_stop with the task ID from this conversation. When cheso_wait yields to a stop request, handle it with cheso_stop and report the returned status. ' +
        'When cheso_wait yields to a new user message, address that message first. To pass a correction or extra instructions for the active Cheso task, call cheso_create with follow_up_task_id set to that task ID and prompt set to the user’s exact message. Wait on the returned task ID. If no task ID is returned for the follow-up, tell the user the result and link to the Cheso project without resubmitting. ' +
        'Use cheso_wait to handle every Cheso question, including follow-ups and confirmations of a revised outline. The plugin shows the original questions and submits the user’s answers or explicit skips directly. If Cheso closes the question itself, the plugin resumes waiting. ' +
        'Do not recreate Cheso questions with another tool, answer or skip on the user’s behalf, or treat a previous answer as approval of a later question. ' +
        'If cheso_wait returns interact, end the turn and direct the user to the Cheso project to answer. Do not retry until the user says they have answered or skipped there. ' +
        'When cheso_wait returns completed with artifacts, deliver the online result through its card and the Open in Cheso link. ' +
        'Do not query the same project again for delivery, download artifacts to the workspace, or look for local copies. ' +
        'Let DSH Host handle Cheso credentials. Do not read credential files or extract tokens. ' +
        'Only perform format conversion when the user explicitly asks to convert or export. A request to make a PPT alone does not authorize a separate export.',
    }), 'cheso: plugin routing');
  });

  ctx.inject(['webServer'], (webCtx: any) => {
    webCtx.effect(() => webCtx.webServer.register({
      kind: 'exact',
      path: `/${CHESO_CALLBACK_PATH}`,
      /** 使用 DSH 0.2.1 支持的 HTTP handler 接收浏览器授权回调。 */
      async handler(request: IncomingMessage, response: ServerResponse) {
        const headers = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' };
        if (request.method !== 'GET') {
          response.writeHead(405, headers).end();
          return;
        }
        const query = new URL(request.url ?? '/', 'http://localhost').searchParams;
        if (!['code', 'error', 'state'].some(key => query.has(key))) {
          response.writeHead(404, headers).end();
          return;
        }
        const issuers = query.getAll('iss');
        const issuer = issuers.length === 1 ? issuers[0].replace(/\/+$/, '') : undefined;
        const config = previewConfigs.find(config => config.baseUrl === issuer);
        const base = `${(config ?? currentConfig()).baseUrl}/`;
        const resultPath = 'oauth/callback-result';
        if (!URL.canParse(resultPath, base)) {
          response.writeHead(400, headers).end();
          return;
        }
        const location = new URL(resultPath, base);
        if (!['http:', 'https:'].includes(location.protocol) || location.username || location.password) {
          response.writeHead(400, headers).end();
          return;
        }

        // OAuth 回调是公开的，令牌交换由已保存的一次性 `state`、签发者校验和 PKCE 保护。
        const result = config ? await config.api.auth.completeBrowser(query).catch(() => 'callback_error') : 'issuer_mismatch';
        location.searchParams.set('status', result === 'success' ? 'success' : 'failed');
        location.searchParams.set('client', 'dsh_cheso');
        if (result !== 'success') location.searchParams.set('reason', result);
        response.writeHead(303, { ...headers, location: location.href }).end();
      },
    }), 'cheso: OAuth callback');
  });
  // ---- 工具 ----

  ctx.tools.register(
    defineTool({
      name: 'cheso_create',
      description:
        '用 dsh-cheso-design 创建或修改成品：PPT/演示文稿、海报/图片、动效视频、网页、报告等。' +
        '直接调用本工具开始任务，由 DSH 检查授权；不需要先检查登录。' +
        '用户指定已有项目继续做时，将项目 ID 或完整链接填入 project_id，直接调用此工具。' +
        '用户更正或补充当前 Cheso 任务的需求时，传入 follow_up_task_id，把消息发到该任务的 Cheso 对话。' +
        '只有用户要求查看项目文件或任务确实需要选取某个文件时，才调用 cheso_project_files。' +
        '创建成功后用返回的 task_id 调用一次 cheso_wait 等待结果。任务按用户的 Cheso 账号与积分执行。',
      parameters: {
        prompt: {
          type: 'string',
          required: true,
          description: '逐字传入用户的任务原话。只在用户明确引用前文时附上用户提供或确认的相关原文。不要改写，也不要补充受众、语言、风格、大纲、输出格式或其他未指定的信息。',
        },
        files: { type: 'array', items: { type: 'string' }, description: '要作为参考的本地文件路径。' },
        project_id: { type: 'string', description: '继续在已有 Cheso 项目中创建或修改产物时，传入用户提供的项目 ID 或完整项目链接。' },
        follow_up_task_id: { type: 'string', description: '给 Cheso 对话发送更正或补充消息时，传入 cheso_create 或 cheso_wait 返回的当前任务 ID。' },
        agent_type: { type: 'string', description: 'cheso（默认）或 image_edit。' },
      },
      output: {
        schema: artifactCardSchema,
        render: (_args: unknown, value: any) =>
          renderCard(
            value,
            value.status === 'login_required'
              ? DSH_LOGIN_REQUIRED
              : value.status === 'insufficient_credits'
                ? 'Cheso 积分不足'
                : `Cheso 任务 ${value.task_id ?? ''}：${value.status ?? ''}`,
          ),
      },
      /** 检查积分、上传参考附件并创建任务，同时记住任务所属站点。 */
      async execute({ prompt, files, project_id, follow_up_task_id, agent_type }, exec) {
        const followedTask = follow_up_task_id ? pendingTasks.get(follow_up_task_id) : undefined;
        const config = followedTask?.config ?? currentConfig();
        const agentType = followedTask?.agentType || agent_type || undefined;
        const signal = exec.signal;
        try {
          if (!prompt.trim()) throw new Error('请提供任务需求。');
          let projectId = project_id ? projectIdFromReference(project_id, config.baseUrl) : undefined;
          let sessionId: string | undefined;
          if (follow_up_task_id) {
            const task = await config.api.request<{ project_id?: string; session_id?: string }>(
              `/api/v1/plans/${chesoId(follow_up_task_id)}`, { signal },
            );
            if (!task.project_id || !task.session_id) throw new Error('Cheso 未返回原任务的项目或对话 ID。');
            if (projectId && task.project_id !== projectId) {
              throw new Error('补充消息必须发到原任务所属的 Cheso 项目。');
            }
            projectId = task.project_id;
            sessionId = task.session_id;
          } else {
            // 积分查询是创建任务的前置提示。对话补充由 Cheso 按当前任务状态处理。
            const balance = await config.api.credits(signal).catch(error => {
              signal?.throwIfAborted();
              if (error instanceof LoginRequired) throw error;
              return undefined;
            });
            if (balance !== undefined && balance <= 0) {
              return { status: 'insufficient_credits', message: 'Cheso 积分不足。', embed_base_url: config.embedBaseUrl };
            }
          }
          const attachments: string[] = [];
          if (files?.length) {
            const cwd = await ctx.workingDirectory.ensure(exec.agent, signal);
            for (const filename of files) {
              // 补充消息的附件先上传，Cheso 在消息出队时绑定到项目。
              attachments.push(await uploadAttachment(config.api, path.resolve(cwd, filename), sessionId ? undefined : projectId, signal));
            }
          }
          let created = await config.api.request<PlanSubmission>(
            '/api/v1/plans/create', {
              body: {
                prompt, project_id: projectId, agent_type: agentType,
                ...(sessionId ? { session_id: sessionId, on_running: 'queue' } : {}),
                contexts: attachments.length ? attachments.map(file_id => ({ file_id, category: 'attachment' })) : undefined,
              },
              signal, timeoutMs: 60_000,
            },
          );
          if (created.queued && projectId) {
            const projectFields = { project_id: projectId, project_url: config.api.projectUrl(projectId) };
            const messageId = created.message?.message_id;
            if (!messageId) {
              return cardPayload({ ...projectFields, status: 'queued', message: 'Cheso 已接收补充消息，可在原项目查看队列。' }, config);
            }
            try {
              created = await config.api.request<PlanSubmission>('/api/v1/messages/send_now', { body: { message_id: messageId }, signal });
            } catch (error) {
              signal?.throwIfAborted();
              const code = error instanceof ChesoApiError ? error.code : undefined;
              // 这条消息已经入队。发送结果不明确时也不要再次提交原文。
              const queued = code !== undefined && [2410, 2614, 2620, 2624, 3203, 3204].includes(code);
              const message = code === 2410 ? '补充消息已排队。当前 Cheso 授权未开放立即发送，可在原项目处理。'
                : queued ? '补充消息已排队，可在原项目查看。'
                  : 'Cheso 已接收补充消息，暂未确认立即发送结果。请在原项目查看消息状态。';
              return cardPayload({ ...projectFields, status: queued ? 'queued' : 'unknown', message }, config);
            }
            if (!created.plan_id) {
              return cardPayload({ ...projectFields, status: 'unknown', message: 'Cheso 已接收补充消息，请在原项目查看消息状态。' }, config);
            }
          }
          if (!created.plan_id) throw new Error('Cheso 未返回任务 ID。');
          const project = created.project_id || projectId;
          const previousTaskId = created.plan_status === 'pending' ? followedTask?.previousTaskId ?? follow_up_task_id : undefined;
          pendingTasks.set(created.plan_id, { config, projectId: project, agentType, previousTaskId });
          return cardPayload({
            task_id: created.plan_id, status: created.plan_status || 'in_progress',
            project_id: project, project_url: project ? config.api.projectUrl(project) : undefined,
          }, config);
        } catch (error) {
          return toolFailure(error, config);
        }
      },
    }),
  );

  ctx.tools.register(
    defineTool({
      name: 'cheso_wait',
      description:
        '等待 Cheso 任务完成。返回 running 时，用同一个任务 ID 继续等待，同一任务一次只调用一个 cheso_wait。' +
        '返回 terminated 时，直接总结停止状态和任务结果确认的成品。' +
        '收到用户插话时提前返回。用户要求停止任务时调用 cheso_stop。用户更正或补充任务需求时，用 cheso_create 的 follow_up_task_id 把消息发到原对话。' +
        '每轮提问（包括追问和修改后的再次确认）都由本工具展示 Cheso 原题。用户回答、跳过或 Cheso 结束提问后，继续等待同一任务。' +
        '无需另行发起问答或转发答案。不得代答、代为跳过，或将先前答复视为对新问题的确认。' +
        '如果返回 interact，结束当前回合；请用户到 Cheso 项目处理，等用户确认后再继续等待。' +
        '任务完成后返回在线产物卡和 Cheso 项目链接，直接用它们交付。产物保存在 Cheso。',
      parameters: {
        task_id: { type: 'string', required: true, description: 'cheso_create 返回的 task_id。' },
        timeout_sec: { type: 'number', description: '每段轮询的等待上限，不含用户回答时间，默认使用插件配置。' },
      },
      output: {
        schema: waitCardSchema,
        presentationMeta: (_args, { question_receipts }) =>
          question_receipts?.length ? { cheso_question_receipts: question_receipts } : null,
        render: (_args, { question_receipts: _receipts, ...value }) => {
          if (value.status === 'terminated') {
            return renderCard(value, STOP_SUMMARY);
          }
          return renderCard(
            value,
            value.status === 'login_required'
              ? DSH_LOGIN_REQUIRED
              : value.status === 'insufficient_credits'
                ? 'Cheso 积分不足'
                : `Cheso 任务 ${value.task_id ?? ''}：${value.status ?? ''}`,
          );
        },
      },
      /** 继续轮询原站点上的任务，处理每轮提问并保留已提交的答复记录。 */
      async execute({ task_id, timeout_sec }, exec) {
        let pending = pendingTasks.get(task_id) ?? { config: currentConfig() };
        const { config } = pending;
        let current = task_id;
        const activity: QuestionActivity = { previews: null, receipts: [] };
        receiptsByExecution.set(exec, activity.receipts);
        if (exec.callId) waitQuestionActivity.set(exec.callId, activity);
        const receiptFields = () => activity.receipts.length ? { question_receipts: activity.receipts } : {};
        const steering = new AbortController();
        const waitSignal = exec.signal ? AbortSignal.any([exec.signal, steering.signal]) : steering.signal;
        const agent = exec.agent;
        const checkSteering = () => {
          if (agent?.inbox?.nextStep.some(message => message.source.kind === 'user')) steering.abort();
        };
        const offInbox = agent && ctx.on('agent/inbox/inserted', ({ agent: recipient }: { agent: typeof agent }) => {
          if (recipient === agent) checkSteering();
        });
        try {
          checkSteering();
          const timeout = Math.min(Math.max(Number(timeout_sec) || config.timeoutSec, 10), 1800);
          for (;;) {
            const repliedQuestion = pending.repliedQuestion;
            const result = await waitForTask(config.api, current, timeout, pending.projectId, waitSignal, repliedQuestion);
            if (result.status === 'terminated') exec.signal?.throwIfAborted();
            else waitSignal.throwIfAborted();
            current = result.task_id;
            const routedTask = pendingTasks.get(current);
            if (routedTask?.config === config) pending = routedTask;
            if (result.done) {
              for (const [id, task] of pendingTasks) {
                if (task === pending || id === task_id || id === current) pendingTasks.delete(id);
              }
            } else {
              // 保留接续链末端和初始 ID 对创建站点的绑定，切站后也能回复原任务。
              pending.projectId = result.project_id;
              pendingTasks.set(task_id, pending);
              pendingTasks.set(current, pending);
              if (result.status === 'running' && pending.repliedQuestion === repliedQuestion) {
                pending.repliedQuestion = result.repliedQuestion;
              }
            }
            if (result.status === 'terminated') return await stoppedCard(result, config, exec.signal, receiptFields());
            const interaction = result.interaction;
            if (interaction && pending.repliedQuestion === interaction.key) continue;
            const userQuestions = interaction?.questions.length && !pending.asking && exec.agent
              ? ctx.get('userQuestions') : undefined;
            if (interaction && userQuestions) {
              pending.asking = true;
              activity.previews = interaction.previews;
              try {
                const reply = await askWhileQuestionIsOpen(config.api, current, interaction,
                  (questions, signal) => userQuestions.ask({ agent: exec.agent, questions, signal }), waitSignal);
                waitSignal.throwIfAborted();
                if (reply === 'closed') continue;
                if (reply) {
                  const submission = await replyToTask(config.api, current, interaction, reply, waitSignal, exec.signal);
                  if (submission !== 'changed') pending.repliedQuestion = interaction.key;
                  if (typeof submission !== 'string') activity.receipts.push(submission);
                  continue;
                }
              } finally {
                activity.previews = null;
                pending.asking = false;
              }
            }
            const message = result.status === 'interact'
              ? [result.message, pending.asking ? 'Cheso 正在等待用户在 DSH 问答卡中操作。'
                : 'Cheso 正在等待你的回复。请打开 Cheso 项目，回答或跳过后回到这里继续。'].filter(Boolean).join('\n')
              : result.message;
            return cardPayload({
              ...result, message,
              project_url: result.project_id ? config.api.projectUrl(result.project_id) : undefined,
            }, config, receiptFields());
          }
        } catch (error) {
          exec.signal?.throwIfAborted();
          if (steering.signal.aborted) {
            pendingTasks.set(task_id, pending);
            return cardPayload({
              task_id: current, status: 'running', project_id: pending.projectId,
              project_url: pending.projectId ? config.api.projectUrl(pending.projectId) : undefined,
              message: '已结束本次等待以处理用户插话。请先处理新消息。',
            }, config, receiptFields());
          }
          return { ...toolFailure(error, config, current), ...receiptFields() };
        } finally {
          offInbox?.();
          if (exec.callId) waitQuestionActivity.delete(exec.callId);
        }
      },
    }),
  );

  ctx.tools.register(
    defineTool({
      name: 'cheso_stop',
      description: '用户要求停止 Cheso 任务时，终止该任务所在的执行链。确认终止后返回停止状态及任务结果中的成品。返回 stopping 表示已发出停止请求。',
      parameters: {
        task_id: { type: 'string', required: true, description: '要停止的 Cheso 任务 ID，来自 cheso_create 或 cheso_wait。' },
      },
      output: {
        schema: artifactCardSchema,
        render: (_args, value) => {
          const { task_id, status } = value;
          if (status === 'terminated') return renderCard(value, STOP_SUMMARY);
          const messages: Record<string, string> = {
            stopping: 'Cheso 已收到停止请求，正在等待任务结束。',
            completed: 'Cheso 任务已完成。',
            failed: 'Cheso 任务已失败。',
            rolled_back: 'Cheso 任务已回滚。',
            pending: 'Cheso 正在交接任务。请使用交接前的任务 ID 停止执行链。',
            login_required: '请先连接 Cheso 账号，再停止任务。',
          };
          return [{ type: 'text', text: `${messages[status ?? ''] ?? '请检查 Cheso 任务状态。'} 任务 ID：${task_id ?? ''}` }];
        },
      },
      async execute({ task_id }, exec) {
        const task = pendingTasks.get(task_id);
        const config = task?.config ?? currentConfig();
        try {
          const result = await stopTask(config.api, task_id, task?.previousTaskId, exec.signal);
          if (result.status === 'terminated') return await stoppedCard({ ...result, project_id: task?.projectId }, config, exec.signal);
          return { task_id: result.task_id, status: result.status };
        } catch (error) {
          if (error instanceof LoginRequired) return { task_id, status: 'login_required' };
          if (error instanceof ChesoApiError && error.code === 2313) {
            throw new Error('只有 Cheso 任务发起人或该项目的所有者可以停止任务。');
          }
          throw error;
        }
      },
    }),
  );

  ctx.tools.register(
    defineTool({
      name: 'cheso_project_files',
      description:
        '按项目 ID 或完整链接只读查询项目文件，返回给模型作为参考。' +
        '用户要求查看项目文件或产物时，将 show_card 设为 true，显示可预览的产物卡。内部查找文件时省略 show_card。' +
        '用户要求在指定项目中创建或修改产物时，直接调用 cheso_create 并传入 project_id。' +
        '显示产物卡后，用户点击「预览」或「打开」时，插件会按需申请文件地址。',
      parameters: {
        project: {
          type: 'string',
          required: true,
          description: '用户提供的原始 project_id 或 Cheso 项目链接。',
        },
        show_card: { type: 'boolean', description: '用户要求展示项目文件或产物时传 true。默认仅返回工具数据。' },
      },
      output: {
        schema: artifactCardSchema,
        render: ({ show_card }, value) => show_card === true
          ? renderCard(value, value.project_id ? `Cheso 项目产物：${value.project_id}` : 'Cheso 项目产物')
          : [{ type: 'text', text: JSON.stringify(value) }],
      },
      /** 验证项目引用并读取项目文件，整理为工具和产物卡共用的数据。 */
      async execute({ project }, exec) {
        const config = currentConfig();
        const projectId = projectIdFromReference(project, config.baseUrl);
        try {
          const files = await config.api.projectFiles(projectId, exec.signal);
          return cardPayload({
            files, project_id: projectId, project_url: config.api.projectUrl(projectId), status: 'completed',
          }, config);
        } catch (error) {
          return toolFailure(error, config);
        }
      },
    }),
  );

  ctx.tools.register(
    defineTool({
      name: 'cheso_login',
      description: '开始 dsh-cheso-design 登录并显示授权卡。拿到结果后结束当前回复，提示用户点击「去 Cheso 授权」，如有验证码则在授权页输入。等用户说已授权后，再检查登录或重试原请求。',
      parameters: {},
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            status: { type: 'string' },
            base_url: { type: 'string' },
            verification_uri: { type: 'string' },
            user_code: { type: 'string' },
            expires_in: { type: 'number' },
            expires_at: { type: 'number' },
          },
        },
        render: (_args, value) => renderCard(value,
          'Cheso 授权卡已显示。请用户在浏览器完成授权，然后回到 DSH 检查登录。等待用户回复后再继续。'),
      },
      /** 为当前站点发起授权，生成对话登录卡所需的数据。 */
      async execute(_args, exec) {
        return login(currentConfig(), exec.signal);
      },
    }),
  );

  ctx.tools.register(
    defineTool({
      name: 'cheso_login_wait',
      description: '用户确认已在浏览器授权后，短暂检查登录结果。若仍待授权，提示用户在授权卡中完成操作并结束回复。',
      parameters: {
        timeout_sec: { type: 'number', description: '兼容旧调用；此工具只做短暂检查。' },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: { status: { type: 'string' }, base_url: { type: 'string' } },
        },
        render: (_args, value) => [{
          type: 'text',
          text: value.status === 'signed_in' ? 'Cheso 已登录。' : 'Cheso 尚未完成授权，请在授权卡中继续操作。',
        }],
      },
      /** 检查当前站点的授权结果，供用户完成浏览器授权后调用。 */
      async execute(_args, exec) {
        return checkLogin(currentConfig(), exec.signal);
      },
    }),
  );

  ctx.tools.register(
    defineTool({
      name: 'cheso_whoami',
      description: '查看 dsh-cheso-design 插件当前站点的登录账号与积分余额。用户询问插件是否登录时直接调用此工具。',
      parameters: {},
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            signed_in: { type: 'boolean' },
            account: { type: 'string' },
            credits: { type: 'number' },
          },
        },
        render: (_args: unknown, value: any) => [
          {
            type: 'text',
            text: value.signed_in
              ? `Cheso 已登录：${value.account || '当前账号'}${typeof value.credits === 'number' ? `，积分 ${value.credits}` : ''}`
              : 'Cheso 未登录。在对话里说「使用 dsh-cheso-design 登录」可获取授权卡。',
          },
        ],
      },
      /** 查询当前站点的登录账号，并在积分接口可用时附上余额。 */
      async execute(_args, exec) {
        const config = currentConfig();
        const signal = exec.signal;
        try {
          const { user } = await config.api.request<{ user?: { username?: string; user_id?: string } }>('/api/v1/whoami', { signal });
          const username = user?.username?.trim();
          const userId = user?.user_id?.trim();
          const account = username && userId ? `${username} (${userId})` : username || userId || '';
          const credits = await config.api.credits(signal).catch(error => {
            signal?.throwIfAborted();
            if (error instanceof LoginRequired) throw error;
            return undefined;
          });
          return { signed_in: true, account, ...(credits === undefined ? {} : { credits }) };
        } catch (error) {
          if (error instanceof LoginRequired) return { signed_in: false };
          throw error;
        }
      },
    }),
  );

  ctx.tools.register(
    defineTool({
      name: 'cheso_logout',
      description: '退出 dsh-cheso-design 插件当前站点的登录，并取消未完成的登录流程。用户要求插件退出登录时直接调用此工具。',
      parameters: {},
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: { status: { type: 'string' }, base_url: { type: 'string' }, revoked: { type: 'boolean' } },
        },
        render: (_args, value) => [{
          type: 'text',
          text: value.status === 'already_signed_out'
            ? `dsh-cheso-design 在 ${value.base_url} 未登录。`
            : `已退出 dsh-cheso-design 在 ${value.base_url} 的登录。${value.revoked === false ? '本地授权已清除，服务端撤销未得到确认。' : ''}`,
        }],
      },
      /** 退出当前站点，并在结果中附上对应站点地址。 */
      async execute(_args, exec) {
        const config = currentConfig();
        return { ...await config.api.logout(exec.signal), base_url: config.baseUrl };
      },
    }),
  );

  // ---- 浏览器登录、站点选项和只读预览路由 ----

  ctx.inject(['connection'], (connectionCtx: any) => {
    connectionCtx.connection.fetch.register({
      path: '/api/cheso/question-previews',
      methods: ['GET'],
      requestBody: 'buffered',
      // `connection` 服务验证 DSH 所有者身份，预览 HTML 通过此接口单独返回。
      /** 按等待工具的调用 ID 返回当前提问预览和答复记录。 */
      async fetch(request: Request) {
        const callId = new URL(request.url).searchParams.get('call_id');
        const activity = callId ? waitQuestionActivity.get(callId) : undefined;
        return jsonResponse(200, activity ?? { previews: null, receipts: [] });
      },
    });
    connectionCtx.connection.fetch.register({
      path: '/api/cheso/site-options',
      methods: ['GET'],
      requestBody: 'buffered',
      /** 提供设置页需要的站点信息，并标明启动配置是否锁定了表单。 */
      async fetch() {
        const entry: { id: string; name: string } | undefined = ctx.fiber?.entry?.options;
        const overlays: readonly StartupPatch[] = ctx.get('profileContext')?.overlays ?? [];
        // 启动配置在用户配置之后应用，会整段替换 `config`。启动时插入的条目仅能在启动配置中修改。
        const lockedByStartupConfig = entry !== undefined && overlays.some(patch => patch.insert
          ? includesStartupEntry(patch.insert, entry.id)
          : patch.id === entry.id && (!patch.name || patch.name === entry.name) && Object.hasOwn(patch, 'config'));
        const { baseUrl, embedBaseUrl } = configs.configured;
        const base = URL.canParse(baseUrl) ? new URL(baseUrl) : undefined;
        const preview = URL.canParse(embedBaseUrl) ? new URL(embedBaseUrl) : undefined;
        const global = new URL(CHESO_SITES.global).href;
        return jsonResponse(200, {
          configuredHost: base?.host,
          previewHost: preview?.host,
          configuredIsGlobal: base?.href === global && preview?.href === global,
          lockedByStartupConfig,
        } satisfies SiteOptions);
      },
    });
    connectionCtx.connection.fetch.register({
      path: '/api/cheso/login',
      methods: ['POST'],
      requestBody: 'buffered',
      // `connection` 服务验证 DSH 所有者身份，仅允许使用已配置站点的凭据记录。
      /** 为当前站点或登录卡所属站点发起授权或检查授权状态。 */
      async fetch(request: Request) {
        if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? '')) {
          return jsonResponse(415, { error: '请从 DSH 登录卡发起授权。' });
        }
        const data = await request.json().catch(() => null);
        if (data?.action !== 'start' && data?.action !== 'check') return jsonResponse(400, { error: '无效的登录操作。' });
        // 历史登录卡仍操作卡片所属站点，即使用户已切换当前站点。
        const config = data.site === undefined
          ? currentConfig() : previewConfigs.find(config => config.baseUrl === data.site);
        if (!config) return jsonResponse(400, {
          code: 'unknown_cheso_site',
          error: '该站点已不在插件配置中。请检查站点设置并重新发起请求。',
        });
        try {
          return jsonResponse(200, await (data.action === 'start' ? login : checkLogin)(config, request.signal));
        } catch (error) {
          return jsonResponse(502, {
            ...(error instanceof LoginAttemptError ? { code: error.code } : {}),
            error: error instanceof Error ? error.message : '无法连接 Cheso 授权服务，请稍后重试。',
          });
        }
      },
    });
    connectionCtx.connection.fetch.register({
      path: '/api/cheso/preview',
      methods: ['GET'],
      requestBody: 'buffered',
      // DSH 在执行此处理器前验证所有者身份，Cheso 验证所请求文件的访问权限。
      /** 按文件 ID 和可选版本返回只读预览所需的文件地址及内嵌页地址。 */
      async fetch(request: Request) {
        const query = new URL(request.url).searchParams;
        // 旧版客户端的标签页刷新前，可能仍会请求文档流。
        if (query.has('document')) return jsonResponse(410, { error: 'preview_client_outdated' });
        const config = previewSite(previewConfigs, query.get('project_url'), query.get('embed_base_url'));
        if (!config) return jsonResponse(400, { error: 'unknown_cheso_site' });
        const fileId = query.get('file_id');
        const versionRaw = query.get('version');
        if (!fileId || fileId === '.' || fileId === '..') return jsonResponse(400, { error: 'file_id_required' });
        const requestOptions = { signal: request.signal, devSet: config.devSet };
        let data;
        try {
          // 首次打开可省略版本查最新文件，续签时可指定正在预览的版本。
          const requestedVersion = Number(versionRaw);
          const version = Number.isSafeInteger(requestedVersion) && requestedVersion > 0 ? requestedVersion : undefined;
          data = await config.api.file(fileId, { ...requestOptions, version });
        } catch (error) {
          if (error instanceof LoginRequired) return jsonResponse(401, { error: 'cheso_login_required' });
          if (error instanceof ChesoApiError && error.status === 403) return jsonResponse(403, { error: 'cheso_file_forbidden' });
          return jsonResponse(502, { error: 'download_url_failed' });
        }
        const contentUrl = data?.download_url ?? data?.attachment_url;
        if (!contentUrl) return jsonResponse(502, { error: 'missing_download_url' });
        return jsonResponse(200, {
          content_url: contentUrl,
          version: data.version,
          expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          embed_url: `${config.embedBaseUrl}/embed/preview`,
        });
      },
    });
  });
}
