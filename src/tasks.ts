import { setTimeout as sleep } from 'node:timers/promises';
import { ChesoApi, ChesoApiError, chesoId, type ChesoFile } from './api';
import { LoginRequired } from './auth';

type QuestionOption = { label: string; description?: string };
type Question = {
  question: string;
  header?: string;
  options?: QuestionOption[];
  multi_select?: boolean;
};

type Interaction = {
  tool_call_id?: string;
  questions?: Array<Omit<Question, 'options'> & { options?: Array<QuestionOption & { html_preview?: string }> }>;
};

export type UserQuestion = Omit<Question, 'multi_select'> & { id: string; multiSelect?: boolean };
export type UserQuestionAnswer = {
  answers: Array<{ id: string; selected: string[]; custom?: string }>;
};
export type QuestionPreview = { label: string; html: string };
export type QuestionReceipt = { answers: Array<{ label: string; values: string[] }> };

type PendingQuestion = {
  key: string;
  questions: Question[];
  previews: QuestionPreview[];
};

type PlanResult = {
  plan_id?: string;
  status: string;
  next_plan_id?: string;
  reason?: string;
  interaction?: Interaction;
  result?: { text?: string; files?: Array<{ file_id?: string; name?: string; path?: string; version?: number; category?: string }> };
};
type WaitResult = {
  task_id: string;
  project_id?: string;
  status: string;
  done: boolean;
  answer?: string;
  message?: string;
  files?: ChesoFile[];
  interaction?: PendingQuestion;
  repliedQuestion?: string;
};
const TERMINAL = new Set(['completed', 'failed', 'terminated', 'rolled_back']);

/** 沿任务接续链查询结果，返回当前链尾的任务 ID 与状态。 */
async function resultFor(api: ChesoApi, taskId: string, signal?: AbortSignal) {
  const visited = new Set<string>();
  let id = taskId;
  // 已结束的任务阶段也可能交接给下一阶段。遍历时限制链长并检测环。
  while (!visited.has(id) && visited.size < 30) {
    visited.add(id);
    const result = await api.request<PlanResult>(`/api/v1/plans/${chesoId(id)}/result`, { signal });
    if (!result.next_plan_id) return { id, result };
    id = result.next_plan_id;
  }
  throw new Error('Cheso 任务接续链异常。');
}

/** 从任务快照提取成品文件，兼容缺少分类字段的旧结果。 */
function filesOf(result: PlanResult): ChesoFile[] {
  // 旧版任务的成品文件快照 `result_files` 可能省略 `category` 字段。
  return (result.result?.files ?? []).flatMap(file => file.file_id && (file.category === undefined || file.category === 'result')
    ? [{ file_id: file.file_id, name: file.name || file.path || file.file_id, version: file.version, category: 'result' }]
    : []);
}

/** 校验并提取 Cheso 的题干和可选答案，供 DSH 问答卡使用。 */
function questionsOf(interaction?: Interaction): Question[] {
  const items = interaction?.questions;
  if (!Array.isArray(items) || !items.every(item => typeof item?.question === 'string' && item.question.trim())) return [];
  return items.map(({ question, header, options, multi_select }) => ({
    question,
    ...(typeof header === 'string' && header ? { header } : {}),
    ...(Array.isArray(options) ? {
      options: options.flatMap(option => typeof option?.label === 'string' && option.label.trim()
        ? [{ label: option.label, ...(typeof option.description === 'string' ? { description: option.description } : {}) }]
        : []),
    } : {}),
    ...(multi_select === true ? { multi_select } : {}),
  }));
}

/** 根据任务 ID、工具调用 ID 和题目内容识别同一批提问。 */
function interactionKey(id: string, interaction?: Interaction): string {
  return JSON.stringify([id, interaction?.tool_call_id ?? null, questionsOf(interaction)]);
}

/** 从选项中提取非空的 HTML 预览和对应标签。 */
function questionPreviews(interaction?: Interaction): QuestionPreview[] {
  if (!Array.isArray(interaction?.questions)) return [];
  return interaction.questions.flatMap(question =>
    Array.isArray(question?.options) ? question.options.flatMap(option =>
      typeof option?.label === 'string' && typeof option.html_preview === 'string' && option.html_preview.trim()
        ? [{ label: option.label, html: option.html_preview }] : [],
    ) : [],
  );
}

/** 判断网络异常、超时或服务端响应是否允许重试轮询。 */
function transientPollError(error: unknown): boolean {
  return error instanceof TypeError || error instanceof DOMException && error.name === 'TimeoutError'
    || error instanceof ChesoApiError && (error.status === 429 || error.status >= 500);
}

/** 轮询当前任务直到结束或出现待答问题。等待超时时返回可继续查询的任务 ID。 */
export async function waitForTask(
  api: ChesoApi, taskId: string, timeoutSec: number, knownProject: string | undefined,
  signal?: AbortSignal, repliedQuestion?: string,
): Promise<WaitResult> {
  // 调用方取消时抛出取消错误。仅本次等待超时时，保留任务 ID 供后续继续等待。
  const timeout = AbortSignal.timeout(Math.floor(timeoutSec * 1000));
  const waitSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let latest: Awaited<ReturnType<typeof resultFor>> | undefined;
  let current = taskId;
  let failures = 0;
  let waitingForUser = false;
  try {
    while (!waitSignal.aborted) {
      let delay = 3000;
      try {
        latest = await resultFor(api, current, waitSignal);
        current = latest.id;
        failures = 0;
        // 已提交的提问可能短暂留在结果中；等 Cheso 更新后再显示下一批。
        waitingForUser = latest.result.status === 'interact'
          && interactionKey(current, latest.result.interaction) !== repliedQuestion;
        if (latest.result.status !== 'interact') repliedQuestion = undefined;
        if (waitingForUser || TERMINAL.has(latest.result.status)) break;
      } catch (error) {
        // 轮询是只读请求，短暂失败可重试。成功查到结果后重新计算连续失败次数。
        if (!transientPollError(error) || ++failures > 5) throw error;
        if (error instanceof ChesoApiError && error.retryAfter) delay = error.retryAfter * 1000;
      }
      await sleep(delay, undefined, { signal: waitSignal });
    }
  } catch (error) {
    signal?.throwIfAborted();
    if (!timeout.aborted) throw error;
  }
  signal?.throwIfAborted();
  if (!latest || !TERMINAL.has(latest.result.status) && !waitingForUser) {
    return { task_id: current, project_id: knownProject, status: 'running', done: false, repliedQuestion };
  }

  const { result } = latest;
  const projectId = knownProject ?? (await api.request<{ project_id?: string }>(`/api/v1/plans/${chesoId(current)}`, { signal })
    .catch(error => {
      signal?.throwIfAborted();
      if (error instanceof LoginRequired) throw error;
      return { project_id: undefined };
    })).project_id;
  let files = filesOf(result);
  const questions = waitingForUser ? questionsOf(result.interaction) : [];
  const message = waitingForUser ? questions.map(({ question, options }, index) =>
    `${index + 1}. ${question}${options?.length ? `（${options.map(option => option.label).join(' / ')}）` : ''}`).join('\n') : result.reason;
  // 完成响应缺少文件列表时，查项目目录补齐卡片，只取标记为成品的文件。
  if (!result.result?.files?.length && projectId && result.status === 'completed') {
    files = (await api.projectFiles(projectId, signal)).filter(file => file.category === 'result');
  }
  // 卡片携带文件 ID，打开预览时再按需查询文件内容。
  return {
    task_id: current, status: result.status, done: TERMINAL.has(result.status),
    project_id: projectId, answer: result.result?.text, message, files,
    ...(waitingForUser ? {
      interaction: { key: interactionKey(current, result.interaction), questions, previews: questionPreviews(result.interaction) },
    } : {}),
  };
}

/** 将 Cheso 题目转换为 DSH 问答格式，并按顺序分配题目 ID。 */
function userQuestionsFor(questions: Question[]): UserQuestion[] {
  return questions.map(({ multi_select, ...question }, index) => ({
    ...question, id: String(index + 1), multiSelect: multi_select === true,
  }));
}

/** 轮询远端问答状态，发现同一批提问已结束或更换时返回。 */
async function waitForQuestionToClose(api: ChesoApi, taskId: string, key: string, signal: AbortSignal) {
  let failures = 0;
  let delay = 3000;
  for (;;) {
    await sleep(delay, undefined, { signal });
    try {
      const { id, result } = await resultFor(api, taskId, signal);
      if (result.status !== 'interact' || interactionKey(id, result.interaction) !== key) return;
      failures = 0;
      delay = 3000;
    } catch (error) {
      signal.throwIfAborted();
      if (!transientPollError(error) || ++failures > 5) throw error;
      delay = error instanceof ChesoApiError && error.retryAfter ? error.retryAfter * 1000 : 3000;
    }
  }
}

/** 同时等待 DSH 用户操作与远端提问关闭，任一结束后取消另一项等待。 */
export async function askWhileQuestionIsOpen(
  api: ChesoApi, taskId: string, question: PendingQuestion,
  ask: (questions: UserQuestion[], signal: AbortSignal) => Promise<UserQuestionAnswer>,
  signal?: AbortSignal,
) {
  const stop = new AbortController();
  const localSignal = signal ? AbortSignal.any([signal, stop.signal]) : stop.signal;
  localSignal.throwIfAborted();
  try {
    // 回答期限由 Cheso 决定。远端跳过、从其他入口作答或切换题目都会关闭本地问答卡。
    return await Promise.race([
      ask(userQuestionsFor(question.questions), localSignal).catch(() => undefined),
      waitForQuestionToClose(api, taskId, question.key, localSignal).then(() => 'closed' as const),
    ]);
  } finally {
    stop.abort();
  }
}

/** 校验用户的答案或跳过操作，确认题目仍有效后提交并返回答复记录。 */
export async function replyToTask(
  api: ChesoApi, taskId: string, question: PendingQuestion, reply: UserQuestionAnswer, signal?: AbortSignal,
): Promise<QuestionReceipt | 'changed' | 'expired'> {
  signal?.throwIfAborted();
  const questions = userQuestionsFor(question.questions);
  const answers = new Map(reply.answers.map(answer => [answer.id, answer]));
  if (!questions.length || answers.size !== questions.length || reply.answers.length !== questions.length) {
    throw new Error('Cheso 问答需要回答或明确跳过每一题。');
  }
  const reviewed = questions.map(item => {
    const answer = answers.get(item.id);
    if (!answer || !Array.isArray(answer.selected)
      || answer.selected.some(label => !item.options?.some(option => option.label === label))
      || (!item.multiSelect && (answer.selected.length > 1 || answer.selected.length && answer.custom))
      || (answer.custom !== undefined && (typeof answer.custom !== 'string' || !answer.custom.trim()))) {
      throw new Error('Cheso 问答收到无效的用户回复。');
    }
    const values = [...answer.selected, ...(answer.custom ? [answer.custom.trim()] : [])];
    return { question: item.question, label: item.header || item.question, values };
  });
  // DSH 的「跳过」返回空选项；部分跳过时交给 Cheso 处理未回答的题。
  const pairs = reviewed.flatMap(({ question, values }) => values.length ? [[question, values.join(',')]] : []);
  // 用户操作期间，问题可能已在其他客户端回答或切换到下一批。
  const { id, result } = await resultFor(api, taskId, signal);
  if (result.status !== 'interact' || interactionKey(id, result.interaction) !== question.key) return 'changed';
  const skip = pairs.length === 0;
  try {
    await api.request(`/api/v1/plans/${chesoId(id)}/interact`, {
      body: {
        args: {
          ...(result.interaction?.tool_call_id ? { tool_call_id: result.interaction.tool_call_id } : {}),
          ...(!skip ? { answers: Object.fromEntries(pairs) } : {}),
        },
        skip,
      },
      signal,
    });
  } catch (error) {
    // 问题可能在状态检查后过期，此时继续等待 Cheso 更新任务状态。
    if (!(error instanceof ChesoApiError && error.code === 1101)) throw error;
    return 'expired';
  }
  return { answers: reviewed.map(({ label, values }) => ({ label, values })) };
}
