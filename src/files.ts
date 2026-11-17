import { openAsBlob, promises as fs } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';
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

/** 为本地附件申请预签名地址，按需上传并确认，返回创建任务所需的文件 ID。 */
export async function uploadAttachment(api: ChesoApi, filename: string, projectId?: string, signal?: AbortSignal) {
  const name = safeFilename(filename);
  const stat = await fs.stat(filename).catch(() => undefined);
  if (!stat?.isFile()) throw new Error(`无法读取附件 ${name}，请选择普通文件。`);
  const mime = MIME_TYPES[path.extname(name).toLowerCase()] ?? 'application/octet-stream';
  const file = await openAsBlob(filename, { type: mime });
  const hash = createHash('md5');
  // 申请预签名地址时，使用实际上传的同一个 Blob 的校验和与大小。
  const source = Readable.fromWeb(file.stream() as ReadableStream<Uint8Array>, { signal });
  for await (const chunk of source) hash.update(chunk);
  const body = { name, size: file.size, hash: hash.digest('hex'), mime_type: mime, category: 'attachment' };
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
