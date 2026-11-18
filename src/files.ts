import { constants, createWriteStream, openAsBlob, promises as fs } from 'node:fs';
import type { BigIntStats } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { ToolDispatchExecution } from '@deepseek-ai/dsh-tools';
import { ChesoApi, ChesoApiError } from './api';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.pdf': 'application/pdf',
  '.txt': 'text/plain', '.md': 'text/markdown', '.csv': 'text/csv', '.json': 'application/json',
  '.html': 'text/html', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/** 取路径末尾的文件名，替换特殊字符，并为无效名称提供默认值。 */
function safeFilename(input: string): string {
  const name = input.split(/[\\/]/).pop()?.replace(/[\x00-\x1f<>:"|?*]/g, '_').trim();
  return name && name !== '.' && name !== '..' ? name : 'artifact';
}

/** 校验预签名存储地址的协议和用户信息，再交给上传请求使用。 */
function storageUrl(raw: string): URL {
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Cheso 返回了无效的文件传输地址。');
  }
  return url;
}

/** 合并调用方的取消信号与文件传输的两分钟超时。 */
function transferSignal(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(120_000);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

type AttachmentSource = { filename: string; name: string; mime?: string; digest?: string; beforeApproval?: BigIntStats };
type PreparedAttachment = { file: Blob; name: string; mime: string; hash: string };

/** 从宿主的最新用户消息捕获附件来源，以便授权后恢复同一次请求。 */
export function userAttachmentBlocks(agent: ToolDispatchExecution['agent']) {
  return (agent?.session?.deriveMessages?.() ?? []).reverse()
    .find(message => message.role === 'user' && message.source.kind === 'user')?.content
    .filter(block => block.type === 'file' || block.type === 'image') ?? [];
}

/** 只信任原请求用户消息中的附件引用。其它路径由 DSH 向用户确认后才读取。 */
async function authorizedSources(
  ctx: any, paths: string[], site: string, exec: ToolDispatchExecution,
  attachmentBlocks: ReturnType<typeof userAttachmentBlocks>,
): Promise<AttachmentSource[]> {
  const { agent, signal } = exec;
  const store = ctx.get('attachments');
  const attached = attachmentBlocks.flatMap(block => {
    if (!store || block.type !== 'file' && block.type !== 'image' || !('attachment' in block)) return [];
    const ref = block.attachment;
    const filename = block.type === 'file' ? store.fileHostPath?.(ref) : store.imageHostPath?.(ref);
    if (typeof filename !== 'string' || !path.isAbsolute(filename)) return [];
    const visiblePath = ctx.get('fs')?.processPathFromHostPath?.(filename);
    const mime = block.type === 'image' ? block.attachment.mediaType : undefined;
    const name = ref.name ?? `image.${mime?.split('/')[1] ?? 'png'}`;
    return [{ filename, name, mime, digest: String(ref.attachmentId), visiblePath }];
  });
  const approval = ctx.get('approval');
  let cwd: string | undefined;
  const needsApproval = new Set<string>();
  const sources: AttachmentSource[] = [];
  for (const requested of paths) {
    signal.throwIfAborted();
    const matches = attached.filter(file =>
      requested === file.digest || requested === file.filename || requested === file.visiblePath);
    const candidates = matches.length ? matches : attached.filter(file => requested === file.name);
    const selected = new Map(candidates.map(file => [file.digest, file]));
    if (selected.size > 1) throw new Error('有多个同名附件，请通过 DSH 提供的附件路径指定文件。');
    const attachment = selected.values().next().value;
    if (attachment) {
      sources.push(attachment);
      continue;
    }
    if (!agent || !approval) throw new Error('当前 DSH 无法确认本地文件上传，请将文件直接附加到消息中。');
    const workingDirectory = cwd ??= await ctx.workingDirectory.ensure(agent, signal);
    const requestedPath = path.resolve(workingDirectory, requested);
    const filename = await canonicalPath(requestedPath);
    const beforeApproval = await fs.stat(filename, { bigint: true }).catch(() => undefined);
    if (!beforeApproval?.isFile()) throw new Error(`无法读取附件 ${safeFilename(requestedPath)}，请选择普通文件。`);
    needsApproval.add(filename);
    sources.push({ filename, name: path.basename(requestedPath), beforeApproval });
  }
  if (needsApproval.size) {
    const files = [...needsApproval].map(file => JSON.stringify(file)).join(', ');
    const outcome = await approval.request({
      agent, toolName: exec.name, callId: exec.callId, signal,
      reason: `允许将这些本地文件上传到 ${site} 吗？\n${files}`,
      displayReason: { en: `Upload these local files to ${site}?\n${files}`, zh: `允许将这些本地文件上传到 ${site} 吗？\n${files}` },
    });
    signal.throwIfAborted();
    if (outcome !== 'allowed-once') throw new Error('本地文件上传未获授权。');
  }
  return sources;
}

function sameFileRevision(first: BigIntStats, second: BigIntStats): boolean {
  return first.dev === second.dev && first.ino === second.ino && first.size === second.size
    && first.mtimeNs === second.mtimeNs && first.ctimeNs === second.ctimeNs;
}

async function canonicalPath(filename: string): Promise<string> {
  return fs.realpath(filename).catch(() => {
    throw new Error(`无法读取附件 ${safeFilename(filename)}。`);
  });
}

/** 从已打开的源文件生成私有快照，校验和与上传都使用这份数据。 */
async function prepareAttachment(source: AttachmentSource, snapshot: string, signal: AbortSignal): Promise<PreparedAttachment> {
  const { filename } = source;
  const name = safeFilename(source.name);
  const mime = source.mime ?? MIME_TYPES[path.extname(name).toLowerCase()] ?? 'application/octet-stream';
  // 上传的附件存储目录可能通过宿主路径别名挂载。手动确认的路径则必须仍指向用户看到的位置。
  const canonical = source.digest ? await canonicalPath(filename) : filename;
  const handle = await fs.open(canonical, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
    .catch(() => { throw new Error(`无法读取附件 ${name}，请选择普通文件。`); });
  try {
    const before = await handle.stat({ bigint: true });
    const actual = await fs.stat(canonical, { bigint: true });
    if (!before.isFile() || before.dev !== actual.dev || before.ino !== actual.ino || await canonicalPath(canonical) !== canonical) {
      throw new Error(`附件 ${name} 的路径已变化，或目标不是普通文件。`);
    }
    if (source.beforeApproval && !sameFileRevision(source.beforeApproval, before)) {
      throw new Error(`附件 ${name} 在等待审批期间已变化，请重新选择文件。`);
    }
    const hash = createHash('md5');
    const digest = source.digest ? createHash('sha256') : undefined;
    await pipeline(
      handle.createReadStream({ autoClose: false }),
      async function* (chunks) {
        for await (const chunk of chunks) {
          hash.update(chunk);
          digest?.update(chunk);
          yield chunk;
        }
      },
      createWriteStream(snapshot, { flags: 'wx', mode: 0o600 }),
      { signal },
    );
    const after = await handle.stat({ bigint: true });
    if (!sameFileRevision(before, after)
        || digest && `sha256:${digest.digest('hex')}` !== source.digest) {
      throw new Error(`附件 ${name} 已变化，请重新选择文件。`);
    }
    return { file: await openAsBlob(snapshot, { type: mime }), name, mime, hash: hash.digest('hex') };
  } finally {
    await handle.close();
  }
}

export async function uploadAttachments(
  ctx: any, api: ChesoApi, paths: string[], projectId: string | undefined, exec: ToolDispatchExecution,
  attachmentBlocks: ReturnType<typeof userAttachmentBlocks>,
) {
  const sources = await authorizedSources(ctx, paths, api.base, exec, attachmentBlocks);
  const directory = await fs.mkdtemp(path.join(tmpdir(), 'dsh-cheso-upload-'));
  try {
    const prepared: PreparedAttachment[] = [];
    for (const [index, source] of sources.entries()) {
      prepared.push(await prepareAttachment(source, path.join(directory, String(index)), exec.signal));
    }
    const ids: string[] = [];
    for (const file of prepared) ids.push(await uploadAttachment(api, file, projectId, exec.signal));
    return ids;
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

/** 为已验证的附件申请预签名地址，按需上传并确认。 */
async function uploadAttachment(api: ChesoApi, attachment: PreparedAttachment, projectId?: string, signal?: AbortSignal) {
  const { name, mime, file, hash } = attachment;
  const body = { name, size: file.size, hash, mime_type: mime, category: 'attachment' };
  // 加到已有项目时，用 create_only 保护项目里原有的同名附件。
  /** 按附件名称申请上传地址，已有项目使用专用的附件路径。 */
  const presign = (attachmentName: string) => api.request<{
    file_id: string; version: number; upload_url?: string; instant?: boolean;
  }>('/api/v1/files/presign', {
    body: { ...body, ...(projectId ? { project_id: projectId, create_only: true, file_path: `attachments/${attachmentName}` } : {}) },
    signal,
  });
  let upload;
  try {
    upload = await presign(name);
  } catch (error) {
    if (!projectId || !(error instanceof ChesoApiError) || error.code !== 1208) throw error;
    // 命中同名冲突后换一个附件路径，只重试这次地址申请。
    const ext = path.extname(name);
    upload = await presign(`${path.basename(name, ext)}-${randomUUID()}${ext}`);
  }
  if (!upload.file_id) throw new Error('Cheso 未返回附件 ID。');
  // instant 表示 Cheso 已有可用文件，可以直接用返回的 ID 创建任务。
  if (!upload.instant) {
    if (!upload.upload_url || !upload.version) throw new Error('Cheso 未返回完整的附件上传信息。');
    // 存储上传请求仅凭预签名地址授权。
    const response = await fetch(storageUrl(upload.upload_url), {
      method: 'PUT', body: file, headers: { 'content-type': mime, 'content-length': String(file.size) },
      redirect: 'error', signal: transferSignal(signal),
    });
    await response.body?.cancel();
    if (!response.ok) throw new Error(`Cheso 附件上传失败（HTTP ${response.status}）`);
    await api.request('/api/v1/files/confirm', { body: { file_id: upload.file_id, version: upload.version }, signal });
  }
  return upload.file_id;
}
