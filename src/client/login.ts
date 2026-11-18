/**
 * 浏览器侧共用的 Cheso OAuth 调用。
 *
 * 登录卡和插件详情页的账号区共用宿主端的 `/api/cheso/login` 接口。
 * `start` 取回或新建授权挑战，`check` 在短时间内等待登录结果。
 */
import type { MessageKey } from './i18n';

export interface LoginChallenge {
  status?: string;
  base_url?: string;
  verification_uri?: string;
  user_code?: string;
  expires_in?: number;
  expires_at?: number;
}

export class LoginRequestError extends Error {
  constructor(readonly code?: string) {
    super(code ?? 'login_failed');
  }
}

/** 调用宿主端的登录接口发起授权或检查状态，并保留失败时的错误码。 */
export async function requestLogin(
  action: 'start' | 'check',
  site?: string,
  signal?: AbortSignal,
): Promise<LoginChallenge> {
  const response = await fetch('/api/cheso/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, site }),
    signal,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw new LoginRequestError(result?.code);
  return result as LoginChallenge;
}

// 授权页必须与卡片记录的站点同源，避免把用户带到意外域名。
export function authorizationUrl(payload: Pick<LoginChallenge, 'base_url' | 'verification_uri'>): string | undefined {
  if (!payload.verification_uri || !payload.base_url
    || !URL.canParse(payload.verification_uri) || !URL.canParse(payload.base_url)) return undefined;
  const url = new URL(payload.verification_uri);
  if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
    && url.origin === new URL(payload.base_url).origin) {
    return url.href;
  }
  return undefined;
}

/** 将宿主端返回的登录错误码映射成界面文案键。 */
export function loginErrorKey(code?: string): MessageKey {
  switch (code) {
    case 'login_expired': return 'loginExpired';
    case 'login_denied': return 'loginDenied';
    case 'login_incomplete': return 'loginIncomplete';
    case 'unknown_cheso_site': return 'loginUnknownSite';
    case 'fixed_token_rejected': return 'fixedTokenRejected';
    default: return 'loginFailed';
  }
}
