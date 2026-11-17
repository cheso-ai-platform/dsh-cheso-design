import { ChesoAuthorization, LoginRequired } from './auth';

export class ChesoApiError extends Error {
  constructor(readonly status: number, readonly code?: number, readonly retryAfter?: number) {
    super(`Cheso API 请求失败（HTTP ${status}${code ? `，错误码 ${code}` : ''}）`);
  }
}

export type FileDetail = {
  version?: number;
  download_url?: string;
  attachment_url?: string;
  name?: string;
  file_path?: string;
};
export type ChesoFile = {
  file_id: string;
  name: string;
  version?: number;
  category?: string;
  created_at?: string;
};
export type ProjectTree = {
  tree?: Array<{
    type?: string;
    kind?: string;
    name?: string;
    file_id?: string;
    file?: { file_path?: string; version?: number; kind?: string; category?: string; created_at?: string };
    children?: ProjectTree['tree'];
  }>;
};

export class ChesoApi {
  constructor(
    readonly base: string,
    readonly auth: ChesoAuthorization,
    private readonly fixedToken: () => string | undefined,
  ) {}

  /** 退出当前站点的 OAuth 登录。配置了固定 API 令牌时，提示用户从配置移除。 */
  async logout(signal?: AbortSignal) {
    if (this.fixedToken()) {
      throw new Error('当前站点使用配置的 API token。请从 DSH 配置或启动环境移除 token 后重启 DSH。');
    }
    return this.auth.logout(signal);
  }

  /** 发送带站点凭据的 API 请求，解析业务响应。OAuth 凭据收到 401 时刷新后重试一次。 */
  async request<T>(path: string, { body, signal, timeoutMs = 30_000, devSet }: {
    body?: object; signal?: AbortSignal; timeoutMs?: number; devSet?: string;
  } = {}): Promise<T> {
    signal?.throwIfAborted();
    const fixed = this.fixedToken();
    let token = fixed || await this.auth.token(signal);
    const requestSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
    /** 使用当前令牌发送请求，供收到 401 并刷新令牌后复用。 */
    const send = () => fetch(this.base + path, {
      method: body ? 'POST' : 'GET',
      headers: {
        'x-cheso-token': token,
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(devSet ? { 'X-Dev-Set': devSet } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'error',
      cache: 'no-store',
      signal: requestSignal,
    });
    let response = await send();
    if (response.status === 401 && !fixed) {
      await response.body?.cancel();
      // 仅在服务端明确拒绝认证时重试。传输出错时，写入可能已经成功。
      token = await this.auth.token(requestSignal, token);
      response = await send();
    }
    const payload = await response.json().catch(() => null);
    if (response.status === 401) throw new LoginRequired();
    // Cheso 也会在成功的 HTTP 响应中通过非零业务错误码报告失败。
    if (!response.ok || typeof payload?.code === 'number' && payload.code !== 0) {
      const retryAfter = Number(response.headers.get('retry-after'));
      throw new ChesoApiError(response.status, payload?.code, retryAfter > 0 ? retryAfter : undefined);
    }
    if (!payload || typeof payload !== 'object') throw new ChesoApiError(response.status);
    // 兼容带 data 外层的响应和直接返回业务对象的接口。
    return (payload.data ?? payload) as T;
  }

  /** 读取指定版本的文件详情。省略版本时，读取最新版本。 */
  file(fileId: string, { version, signal, devSet }: {
    version?: number; signal?: AbortSignal; devSet?: string;
  } = {}): Promise<FileDetail> {
    return this.request(`/api/v1/files/${chesoId(fileId)}${version ? `?version=${version}` : ''}`, { signal, devSet });
  }

  /** 用已校验的项目 ID 生成当前站点的项目链接。 */
  projectUrl(projectId: string): string {
    return `${this.base}/agent/${chesoId(projectId)}`;
  }

  /** 将项目文件树展开为文件列表，跳过目录和画布节点。 */
  async projectFiles(projectId: string, signal?: AbortSignal): Promise<ChesoFile[]> {
    const result = await this.request<ProjectTree>(`/api/v1/project/files/tree?project_id=${chesoId(projectId)}`, { signal });
    const files: ChesoFile[] = [];
    /** 递归访问子节点，并保留用于补齐文件路径的父目录。 */
    const visit = (nodes: ProjectTree['tree'], parent = '', depth = 0) => {
      if (depth > 32) return;
      for (const node of nodes ?? []) {
        // 有些节点缺少完整路径，遍历时用父目录和节点名拼出显示路径。
        const relative = parent ? `${parent}/${node.name ?? ''}` : (node.name ?? '');
        const kind = node.kind ?? node.file?.kind;
        if (node.file_id && node.type === 'file' && kind !== 'folder' && kind !== 'canvas') {
          files.push({
            file_id: node.file_id,
            name: node.file?.file_path || relative,
            version: node.file?.version,
            category: node.file?.category,
            created_at: node.file?.created_at,
          });
        }
        visit(node.children, relative, depth + 1);
      }
    };
    visit(result.tree);
    return files;
  }

  /** 汇总当前有效积分额度中可用的余额。 */
  async credits(signal?: AbortSignal): Promise<number> {
    const data = await this.request<{
      grants?: Array<{ valid_from?: string; expires_at?: string; amount_available?: number }>;
    }>('/api/v1/billing/credits', { signal });
    const now = Date.now();
    return (data.grants ?? []).reduce((total, grant) => {
      const starts = Date.parse(grant.valid_from ?? '');
      const ends = Date.parse(grant.expires_at ?? '');
      const amount = Number(grant.amount_available);
      // Cheso 用 0001-01-01 表示未设过期时间，不能当作历史到期时间。
      const expired = !grant.expires_at?.startsWith('0001-01-01') && ends <= now;
      if (starts > now || expired || !Number.isFinite(amount) || amount <= 0) return total;
      return total + amount;
    }, 0);
  }
}

// ID 会直接拼入 API 路径或查询字符串，只接受 Cheso ID 所用的字符。
export function chesoId(id: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id)) throw new Error('Cheso ID 无效。');
  return id;
}
