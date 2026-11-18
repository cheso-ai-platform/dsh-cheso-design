import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

export const CHESO_CALLBACK_PATH = 'cheso/oauth/callback';

const DEVICE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';
const REFRESH_SKEW_MS = 60_000;
const CLIENT_LOGO_URI = 'https://www.deepseek.com/favicon.ico';

type GrantRecord = { kind: 'grant'; payload: unknown };
export interface CredentialStore {
  /** 按站点凭据键读取授权记录。 */
  readRecord(key: string): Promise<{ kind: string; payload?: unknown } | undefined>;
  /** DSH 锁住单条记录进行读改写，回调返回 undefined 时保留原记录。 */
  modifyRecord(
    key: string,
    mutate: (current: { kind: string; payload?: unknown } | undefined) => Promise<GrantRecord | undefined>,
  ): Promise<{ kind: string; payload?: unknown } | undefined>;
}

type Authorization = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  clientId: string;
  tokenEndpoint: string;
  revocationEndpoint?: string;
};
type BrowserLogin = { state: string; verifier: string; redirectUri: string; verificationUri?: string; expiresAt: number };
type BrowserCallbackResult = 'success' | 'state_mismatch' | 'denied' | 'authorization_error' | 'missing_code' | 'invalid_client' | 'callback_error';
type DeviceLogin = {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresAt: number;
  interval: number;
  nextPollAt: number;
};
// 每个站点的记录包含客户端注册、已生效的授权和进行中的登录。
type SiteGrant = {
  clientId?: string;
  clientRedirect?: string;
  clientLogoUri?: string;
  tokenEndpoint?: string;
  revocationEndpoint?: string;
  authorization?: Authorization;
  pending?: DeviceLogin;
  browser?: BrowserLogin;
  loginError?: string;
};

export class LoginRequired extends Error {
  constructor() { super('请先登录 Cheso，再继续刚才的操作。'); }
}

const loginAttemptMessages = {
  login_expired: 'Cheso 登录已失效，请重新发起登录。',
  login_denied: 'Cheso 登录请求已被拒绝。',
  login_incomplete: 'Cheso 浏览器登录未完成，请重新登录。',
} as const;

export class LoginAttemptError extends Error {
  readonly code: keyof typeof loginAttemptMessages;

  constructor(reason: string) {
    // 旧凭据记录可能存的是完整的错误消息。
    const code = Object.hasOwn(loginAttemptMessages, reason) ? reason as keyof typeof loginAttemptMessages : undefined;
    super(code ? loginAttemptMessages[code] : reason);
    this.code = code ?? 'login_incomplete';
  }
}

class OAuthError extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(`Cheso 授权请求失败（${status}）`);
  }
}

/** 从 DSH 记录取出授权数据。记录缺失或类型不匹配时按空状态处理。 */
function grantOf(record: { kind: string; payload?: unknown } | undefined): SiteGrant {
  return record?.kind === 'grant' && record.payload && typeof record.payload === 'object'
    ? record.payload as SiteGrant
    : {};
}

/** 生成可写入 DSH 的授权记录，并省略未设置的字段。 */
function grantRecord(payload: SiteGrant): GrantRecord {
  return { kind: 'grant', payload: Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) };
}

// OAuth 元数据提供的地址都必须留在同一站点，尤其是接收授权码和令牌的端点。
function sameOrigin(url: string | undefined, base: string): string {
  if (!url || !URL.canParse(url)) throw new Error('Cheso 未提供可用的授权地址。');
  const target = new URL(url);
  if (target.origin !== new URL(base).origin || target.username || target.password) {
    throw new Error('Cheso 授权地址与当前站点不一致。');
  }
  return target.href;
}

/** 请求 OAuth 元数据或端点，按请求体类型编码，并保留服务端错误码。 */
async function oauthRequest(url: string, signal: AbortSignal | undefined, body?: URLSearchParams | object) {
  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: body && !(body instanceof URLSearchParams) ? { 'content-type': 'application/json' } : undefined,
    body: body instanceof URLSearchParams ? body : body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    redirect: 'error',
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30_000)]) : AbortSignal.timeout(30_000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || typeof payload?.error === 'string') {
    throw new OAuthError(payload?.error ?? 'request_failed', response.status);
  }
  if (!payload || typeof payload !== 'object') throw new Error('所选 Cheso 站点未返回 OAuth 数据，请确认站点已开放插件登录。');
  return payload;
}

/** 向令牌端点提交授权参数，并将有效期转换为本地到期时间。 */
async function exchange(endpoint: string, form: Record<string, string>, signal: AbortSignal | undefined) {
  const payload = await oauthRequest(endpoint, signal, new URLSearchParams(form));
  if (!payload.access_token || !Number.isFinite(payload.expires_in) || payload.expires_in <= 0) {
    throw new Error('Cheso 返回了无效的访问令牌。');
  }
  return {
    accessToken: String(payload.access_token),
    refreshToken: String(payload.refresh_token ?? ''),
    expiresAt: Date.now() + payload.expires_in * 1000,
    clientId: form.client_id, tokenEndpoint: endpoint,
  };
}

/** 将站点提供的撤销端点附到本次授权，供之后退出或换绑时使用。 */
function withRevocation(authorization: Authorization, endpoint?: string): Authorization {
  return endpoint ? { ...authorization, revocationEndpoint: endpoint } : authorization;
}

export class ChesoAuthorization {
  private readonly key: string;

  constructor(private readonly store: CredentialStore, private readonly base: string) {
    // 按规范化后的站点地址隔离凭据，自定义部署也使用独立记录。
    this.key = `cheso/site-${createHash('sha256').update(base).digest('hex')}`;
  }

  /** 有可用回调时发起浏览器授权，否则向站点申请设备码。 */
  async start(signal?: AbortSignal, browserCallback?: string) {
    let view: { verification_uri: string; user_code?: string; expires_in: number; expires_at: number } | undefined;
    await this.store.modifyRecord(this.key, async record => {
      signal?.throwIfAborted();
      const grant = grantOf(record);
      const now = Date.now();
      // 对话工具和登录按钮共用同一份有效的授权挑战。
      const active = browserCallback ? grant.browser : grant.pending;
      if (active?.verificationUri && active.expiresAt > now
          && (!('redirectUri' in active) || active.redirectUri === browserCallback)) {
        view = {
          verification_uri: active.verificationUri,
          ...('userCode' in active ? { user_code: active.userCode } : {}),
          expires_in: Math.ceil((active.expiresAt - now) / 1000),
          expires_at: active.expiresAt,
        };
        return;
      }
      const metadata = await oauthRequest(`${this.base}/.well-known/oauth-authorization-server`, signal);
      if (String(metadata.issuer ?? '').replace(/\/+$/, '') !== this.base) {
        throw new Error('Cheso 授权服务器与当前站点不一致。');
      }
      const deviceEndpoint = !browserCallback && metadata.device_authorization_endpoint
        ? sameOrigin(metadata.device_authorization_endpoint, this.base) : undefined;
      if (!browserCallback && !deviceEndpoint) {
        throw new Error('当前 DSH 无法接收浏览器登录回调，所选 Cheso 站点也未开放设备码登录。');
      }
      const clientRedirect = browserCallback ?? 'http://127.0.0.1/callback';
      const tokenEndpoint = sameOrigin(metadata.token_endpoint, this.base);
      const revocationEndpoint = metadata.revocation_endpoint
        ? sameOrigin(metadata.revocation_endpoint, this.base) : undefined;
      /** 按当前回调地址注册 OAuth 客户端并取得客户端 ID。 */
      const register = async () => {
        const registration = await oauthRequest(sameOrigin(metadata.registration_endpoint, this.base), signal, {
          client_name: 'DeepSeek Harness',
          logo_uri: CLIENT_LOGO_URI,
          redirect_uris: [clientRedirect],
          grant_types: ['authorization_code', 'refresh_token'],
          response_types: ['code'],
          token_endpoint_auth_method: 'none',
        });
        if (!registration.client_id) throw new Error('Cheso 未返回 OAuth 客户端 ID。');
        return String(registration.client_id);
      };
      // 回调地址和应用图标属于客户端注册信息，变更后在新登录时重新注册。
      let clientId = grant.clientId && grant.clientRedirect === clientRedirect && grant.clientLogoUri === CLIENT_LOGO_URI
        ? grant.clientId : await register();
      const registration = {
        ...grant, clientId, clientRedirect, clientLogoUri: CLIENT_LOGO_URI, tokenEndpoint, revocationEndpoint, loginError: undefined,
      };
      if (!deviceEndpoint) {
        // `state` 关联本次登录，PKCE 校验值 `verifier` 由宿主端保存，换取令牌时提交。
        const state = randomBytes(32).toString('base64url');
        const verifier = randomBytes(32).toString('base64url');
        const url = new URL(sameOrigin(metadata.authorization_endpoint, this.base));
        for (const [key, value] of Object.entries({
          response_type: 'code', client_id: clientId, redirect_uri: clientRedirect, state, scope: 'cheso',
          code_challenge_method: 'S256', code_challenge: createHash('sha256').update(verifier).digest('base64url'),
        })) url.searchParams.set(key, value);
        const expiresAt = Date.now() + 300_000;
        view = { verification_uri: url.href, expires_in: 300, expires_at: expiresAt };
        return grantRecord({
          ...registration, pending: undefined,
          browser: { state, verifier, redirectUri: clientRedirect, verificationUri: url.href, expiresAt },
        });
      }
      /** 使用当前客户端 ID 申请设备码，供客户端重新注册后再次调用。 */
      const authorize = () => oauthRequest(deviceEndpoint, signal, new URLSearchParams({ client_id: clientId, scope: 'cheso' }));
      let device;
      try {
        device = await authorize();
      } catch (error) {
        if (!(error instanceof OAuthError) || error.code !== 'invalid_client' || !grant.clientId) throw error;
        clientId = await register();
        device = await authorize();
      }
      if (!device.device_code || !device.user_code || !Number.isFinite(device.expires_in) || device.expires_in <= 0) {
        throw new Error('Cheso 返回了无效的设备码。');
      }
      const interval = Math.max(1, Number(device.interval) || 5) * 1000;
      const issuedAt = Date.now();
      const pending = {
        deviceCode: String(device.device_code),
        userCode: String(device.user_code),
        verificationUri: sameOrigin(device.verification_uri, this.base),
        expiresAt: issuedAt + device.expires_in * 1000,
        interval,
        nextPollAt: issuedAt + interval,
      };
      view = {
        verification_uri: pending.verificationUri, user_code: pending.userCode,
        expires_in: device.expires_in, expires_at: pending.expiresAt,
      };
      return grantRecord({ ...registration, clientId, pending, browser: undefined });
    });
    if (!view) throw new Error('Cheso 登录请求未保存。');
    return view;
  }

  /** 校验浏览器回调并消费一次性 state，以授权码换取令牌并保存到当前站点。 */
  async completeBrowser(query: URLSearchParams): Promise<BrowserCallbackResult> {
    let result: BrowserCallbackResult = 'state_mismatch';
    let previous: Authorization | undefined;
    // 在同一次记录更新中校验并消费 state，防止并发回调用同一次授权换取令牌。
    await this.store.modifyRecord(this.key, async current => {
      const grant = grantOf(current);
      const pending = grant.browser;
      const state = query.get('state');
      if (!pending || !grant.clientId || !state || query.getAll('state').length !== 1
          || query.get('iss')?.replace(/\/+$/, '') !== this.base
          || Buffer.byteLength(state) !== Buffer.byteLength(pending.state)
          || !timingSafeEqual(Buffer.from(state), Buffer.from(pending.state))) return;
      const code = query.get('code');
      if (pending.expiresAt <= Date.now()) {
        result = 'callback_error';
      } else if (query.has('error')) {
        result = query.get('error') === 'access_denied' ? 'denied' : 'authorization_error';
      } else if (!code || query.getAll('code').length !== 1) {
        result = 'missing_code';
      } else {
        try {
          const authorization = await exchange(sameOrigin(grant.tokenEndpoint, this.base), {
            grant_type: 'authorization_code', client_id: grant.clientId, code,
            redirect_uri: pending.redirectUri, code_verifier: pending.verifier,
          }, undefined);
          result = 'success';
          if (grant.authorization?.refreshToken !== authorization.refreshToken) previous = grant.authorization;
          return grantRecord({ ...grant, browser: undefined, authorization: withRevocation(authorization, grant.revocationEndpoint) });
        } catch (error) {
          result = error instanceof OAuthError && error.code === 'invalid_client' ? 'invalid_client' : 'callback_error';
        }
      }
      return grantRecord({
        ...grant, browser: undefined,
        clientId: result === 'invalid_client' ? undefined : grant.clientId,
        loginError: 'login_incomplete',
      });
    });
    await this.revoke(previous);
    return result;
  }

  /** 在短超时内尝试撤销旧授权，返回服务端是否确认成功。 */
  private async revoke(previous?: Authorization) {
    if (!previous?.revocationEndpoint) return false;
    try {
      const response = await fetch(sameOrigin(previous.revocationEndpoint, this.base), {
        method: 'POST',
        body: new URLSearchParams({
          client_id: previous.clientId,
          token: previous.refreshToken || previous.accessToken,
          token_type_hint: previous.refreshToken ? 'refresh_token' : 'access_token',
        }),
        redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(3000),
      });
      await response.body?.cancel().catch(() => {});
      return response.ok;
    } catch {
      return false;
    }
  }

  /** 清空站点的本地授权和待处理登录，再尝试撤销已保存的令牌。 */
  async logout(signal?: AbortSignal) {
    let previous: Authorization | undefined;
    let clearedPending = false;
    await this.store.modifyRecord(this.key, async current => {
      signal?.throwIfAborted();
      const grant = grantOf(current);
      if (!grant.authorization && !grant.pending && !grant.browser && !grant.loginError) return;
      previous = grant.authorization;
      clearedPending = Boolean(grant.pending || grant.browser);
      // 在令牌刷新使用的同一把锁内清除两种待处理登录，防止回调恢复已清除的授权。
      return grantRecord({ ...grant, authorization: undefined, pending: undefined, browser: undefined, loginError: undefined });
    });
    if (!previous) return { status: clearedPending ? 'signed_out' : 'already_signed_out' } as const;
    return { status: 'signed_out', revoked: await this.revoke(previous) } as const;
  }

  /** 在指定时限内等待浏览器回调或轮询设备码。等待超时时返回 false。 */
  async wait(timeoutMs: number, signal?: AbortSignal): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      signal?.throwIfAborted();
      let retryAt = deadline;
      let previous: Authorization | undefined;
      const snapshot = grantOf(await this.store.readRecord(this.key));
      if (snapshot.loginError) throw new LoginAttemptError(snapshot.loginError);
      if (snapshot.browser) {
        // 浏览器回调负责换取令牌，检查登录时只观察凭据记录的变化。
        if (snapshot.browser.expiresAt <= Date.now()) throw new LoginAttemptError('login_expired');
        await sleep(Math.max(0, Math.min(deadline, snapshot.browser.expiresAt, Date.now() + 1000) - Date.now()), undefined, { signal });
        continue;
      }
      // 将下次轮询时间写入待处理授权记录，使并发等待遵循同一轮询间隔。
      const record = await this.store.modifyRecord(this.key, async current => {
        const grant = grantOf(current);
        const pending = grant.pending;
        if (!pending || !grant.clientId) return;
        const now = Date.now();
        if (now >= pending.expiresAt) {
          return grantRecord({ ...grant, pending: undefined, loginError: 'login_expired' });
        }
        retryAt = Math.min(pending.expiresAt, pending.nextPollAt);
        if (now < retryAt || now >= deadline) return;
        try {
          const timeout = AbortSignal.timeout(Math.ceil(Math.min(deadline, pending.expiresAt) - now));
          const authorization = await exchange(sameOrigin(grant.tokenEndpoint, this.base), {
            grant_type: DEVICE_GRANT, client_id: grant.clientId, device_code: pending.deviceCode,
          }, signal ? AbortSignal.any([signal, timeout]) : timeout);
          previous = grant.authorization;
          return grantRecord({ ...grant, pending: undefined, authorization: withRevocation(authorization, grant.revocationEndpoint) });
        } catch (error) {
          signal?.throwIfAborted();
          if (error instanceof OAuthError && ['access_denied', 'expired_token', 'invalid_grant', 'invalid_client'].includes(error.code)) {
            const loginError = error.code === 'access_denied' ? 'login_denied' : 'login_expired';
            return grantRecord({ ...grant, pending: undefined, loginError, clientId: error.code === 'invalid_client' ? undefined : grant.clientId });
          }
          const waiting = error instanceof OAuthError && error.code === 'authorization_pending';
          const slowDown = error instanceof OAuthError && error.code === 'slow_down';
          if (error instanceof OAuthError && !waiting && !slowDown && error.status < 500 && error.status !== 429) throw error;
          const interval = slowDown ? pending.interval + 5000 : waiting ? pending.interval : Math.min(60_000, pending.interval * 2);
          retryAt = Date.now() + interval;
          return grantRecord({ ...grant, pending: { ...pending, interval, nextPollAt: retryAt } });
        }
      });
      const state = grantOf(record);
      if (state.loginError) throw new LoginAttemptError(state.loginError);
      if (state.browser) continue;
      if (!state.pending) {
        if (!state.authorization) throw new LoginRequired();
        // 确认新授权已写入后，再撤销旧授权。
        if (previous?.refreshToken !== state.authorization.refreshToken) await this.revoke(previous);
        return true;
      }
      await sleep(Math.max(0, Math.min(retryAt, deadline) - Date.now()), undefined, { signal });
    }
    return false;
  }

  /** 取得可用的访问令牌，必要时在记录锁内刷新并保存新令牌。 */
  async token(signal?: AbortSignal, rejected?: string): Promise<string> {
    // 请求收到 401 后带入被拒的令牌，仍可复用其他请求已经刷新的令牌。
    const reusable = (authorization?: Authorization) =>
      authorization && authorization.accessToken !== rejected && authorization.expiresAt > Date.now() + REFRESH_SKEW_MS;
    const initial = grantOf(await this.store.readRecord(this.key)).authorization;
    if (initial && reusable(initial)) return initial.accessToken;
    // 刷新令牌可能随刷新操作轮换，需在 DSH 的记录锁内重新读取并刷新。
    const record = await this.store.modifyRecord(this.key, async current => {
      signal?.throwIfAborted();
      const grant = grantOf(current);
      const authorization = grant.authorization;
      if (!authorization || reusable(authorization)) return;
      if (!authorization.refreshToken || !authorization.clientId) return grantRecord({ ...grant, authorization: undefined });
      try {
        const refreshed = await exchange(sameOrigin(authorization.tokenEndpoint, this.base), {
          grant_type: 'refresh_token', client_id: authorization.clientId, refresh_token: authorization.refreshToken,
        }, signal);
        return grantRecord({ ...grant, authorization: { ...authorization, ...refreshed, refreshToken: refreshed.refreshToken || authorization.refreshToken } });
      } catch (error) {
        if (!(error instanceof OAuthError) || !['invalid_grant', 'invalid_client'].includes(error.code)) throw error;
        return grantRecord({ ...grant, authorization: undefined, clientId: error.code === 'invalid_client' && grant.clientId === authorization.clientId ? undefined : grant.clientId });
      }
    });
    const active = grantOf(record).authorization;
    if (!active) throw new LoginRequired();
    return active.accessToken;
  }
}
