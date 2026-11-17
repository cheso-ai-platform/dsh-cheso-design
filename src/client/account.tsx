/**
 * 插件详情页里的 Cheso 账号区。
 *
 * 安装完成后，用户可在插件详情页顶部连接账号。这里负责发起 OAuth 授权、
 * 展示授权链接并观察授权结果。
 */
import { useEffect, useRef, useState } from 'react';
import type { MessageKey, TranslatedProps } from './i18n';
import {
  authorizationUrl, loginErrorKey, LoginRequestError, requestLogin, type LoginChallenge,
} from './login';

type Phase = 'checking' | 'signed_out' | 'pending' | 'signed_in' | 'unavailable';

/** 从有效的站点 URL 提取用于显示的主机名和端口。 */
function siteHost(url?: string): string | undefined {
  if (!url || !URL.canParse(url)) return undefined;
  return new URL(url).host;
}

/** 判断授权是否已过期、被拒绝或未完成，以便恢复到可重新连接的状态。 */
function isEndedLoginAttempt(key: MessageKey): boolean {
  return key === 'loginExpired' || key === 'loginDenied' || key === 'loginIncomplete';
}

/** 在插件详情页显示当前账号状态，并提供连接账号和观察授权结果的入口。 */
export function ChesoAccountStatus({ t, disabled, showSite }: TranslatedProps & { disabled?: boolean; showSite?: boolean }) {
  const [phase, setPhase] = useState<Phase>('checking');
  const phaseRef = useRef<Phase>('checking');
  const generation = useRef(0);
  const [challenge, setChallenge] = useState<LoginChallenge>();
  const [authorizationOpened, setAuthorizationOpened] = useState(false);
  const [starting, setStarting] = useState(false);
  const [notice, setNotice] = useState<MessageKey>();
  const [error, setError] = useState<MessageKey>();
  const [expiredAt, setExpiredAt] = useState(0);
  const [baseUrl, setBaseUrl] = useState<string>();

  // 阶段变化同步写入 `phaseRef`，供较晚返回的请求判断结果是否过时。
  function moveTo(next: Phase) {
    phaseRef.current = next;
    setPhase(next);
  }

  /** 发起或恢复一次授权，更新账号区状态，并返回可打开的授权链接。 */
  async function begin(site?: string, signal?: AbortSignal) {
    const id = ++generation.current;
    setStarting(true);
    setError(undefined);
    setNotice(undefined);
    try {
      const result = await requestLogin('start', site, signal);
      if (signal?.aborted || id !== generation.current || phaseRef.current === 'signed_in') return;
      if (result.base_url) setBaseUrl(result.base_url);
      if (result.status === 'signed_in') {
        setChallenge(undefined);
        moveTo('signed_in');
        return;
      }
      const href = authorizationUrl(result);
      if (result.status === 'login_pending' && href) {
        setChallenge(result);
        setAuthorizationOpened(false);
        setExpiredAt(0);
        moveTo('pending');
        return href;
      }
      if (result.status === 'login_required') {
        moveTo('signed_out');
        setError('loginNotStarted');
        return;
      }
      moveTo('signed_out');
      setError('loginInvalidLink');
    } catch (reason) {
      if (signal?.aborted || id !== generation.current) return;
      moveTo('signed_out');
      setError(reason instanceof LoginRequestError ? loginErrorKey(reason.code) : 'loginFailed');
    } finally {
      if (!signal?.aborted && id === generation.current) setStarting(false);
    }
  }

  /** 在点击时准备浏览器标签页，取得授权链接后跳转到 Cheso。 */
  async function connect(site?: string) {
    const desktop = 'dshDesktop' in window;
    // 浏览器要求在点击时打开标签页。DSH 桌面端把授权链接交给系统浏览器。
    const tab = desktop ? null : window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    const href = await begin(site);
    if (!href) {
      tab?.close();
      return;
    }
    if (desktop) {
      window.open(href, '_blank', 'noopener,noreferrer');
      setAuthorizationOpened(true);
    } else if (tab && !tab.closed) {
      tab.location.replace(href);
      setAuthorizationOpened(true);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    /** 读取当前站点的登录状态，已有待处理授权时取回授权链接。 */
    async function loadStatus() {
      try {
        const result = await requestLogin('check', undefined, signal);
        if (signal.aborted) return;
        if (result.base_url) setBaseUrl(result.base_url);
        if (result.status === 'waiting') {
          await begin(result.base_url, signal);
        } else {
          moveTo(result.status === 'signed_in' ? 'signed_in' : 'signed_out');
        }
      } catch (reason) {
        if (signal.aborted) return;
        const key = reason instanceof LoginRequestError && reason.code
          ? loginErrorKey(reason.code)
          : 'accountStatusFailed';
        if (isEndedLoginAttempt(key)) {
          // 历史授权已结束，可以重新连接账号。
          moveTo('signed_out');
          return;
        }
        moveTo('unavailable');
        setError(key);
      }
    }

    void loadStatus();
    return () => {
      generation.current++;
      controller.abort();
    };
    // 挂载时读一次当前站点，等待授权期间由轮询刷新。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const expiresAt = challenge?.expires_at ?? 0;
  useEffect(() => {
    if (!expiresAt) return;
    const timer = setTimeout(() => setExpiredAt(expiresAt), Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [expiresAt]);

  // 授权挑战存在时在后台轮询，用户从浏览器回来不必再点一次。
  useEffect(() => {
    if (phase !== 'pending' || !challenge) return;
    const controller = new AbortController();
    const deadline = challenge.expires_at ?? 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    /** 检查授权是否完成或过期，仍在等待时安排下次检查。 */
    const poll = async () => {
      if (controller.signal.aborted) return;
      if (deadline && Date.now() >= deadline) {
        setExpiredAt(deadline);
        return;
      }
      try {
        const result = await requestLogin('check', challenge.base_url, controller.signal);
        if (controller.signal.aborted) return;
        if (result.base_url) setBaseUrl(result.base_url);
        if (result.status === 'signed_in') {
          setChallenge(undefined);
          setExpiredAt(0);
          setError(undefined);
          moveTo('signed_in');
          return;
        }
        if (result.status === 'login_required') {
          setExpiredAt(deadline || Date.now());
          setNotice('loginNotStarted');
          setError(undefined);
          return;
        }
      } catch (reason) {
        if (controller.signal.aborted) return;
        if (reason instanceof LoginRequestError) {
          const key = loginErrorKey(reason.code);
          if (isEndedLoginAttempt(key) || key === 'loginUnknownSite') {
            setExpiredAt(deadline || Date.now());
            setNotice(key);
            setError(undefined);
            return;
          }
        }
      }
      timer = setTimeout(poll, 5000);
    };
    timer = setTimeout(poll, 1500);
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [phase, challenge]);

  const live = !expiredAt && (!expiresAt || expiresAt > Date.now());
  const href = challenge && live ? authorizationUrl(challenge) : undefined;
  const host = showSite ? siteHost(challenge?.base_url ?? baseUrl) : undefined;
  const statusText = phase === 'checking'
    ? t('accountChecking')
    : phase === 'pending'
      ? t(href ? 'accountWaiting' : notice ?? 'loginExpired')
      : phase === 'unavailable'
        ? t(error ?? 'accountStatusFailed')
        : phase === 'signed_in'
          ? t('accountSignedIn')
          : t('accountSignedOut');
  const statusColor = phase === 'signed_in'
    ? 'var(--dsw-alias-state-success-primary, #16a34a)'
    : phase === 'unavailable'
      ? 'var(--dsw-alias-state-error-primary, #dc2626)'
      : 'var(--dsw-alias-state-idle-primary, #9ca3af)';

  return (
    <>
      <div style={styles.statusRow}>
        <div style={styles.status} role="status" aria-live="polite">
          <span style={{ ...styles.dot, background: statusColor }} />
          <span>{statusText}{host ? <span style={styles.caption}> {t('accountSite', { host })}</span> : null}</span>
        </div>
        {phase === 'signed_out' || phase === 'unavailable' || (phase === 'pending' && !href) ? (
          <button
            type="button"
            className="cheso-account-primary"
            style={styles.primary}
            disabled={disabled || starting}
            onClick={() => void connect(challenge?.base_url)}
          >
            {t(starting ? 'loginGettingLink' : 'accountConnect')}
          </button>
        ) : null}
        {phase === 'pending' && href && !authorizationOpened && !disabled ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="cheso-account-primary"
            style={styles.primary}
          >
            {t('loginAuthorize')}
          </a>
        ) : null}
      </div>

      {phase === 'pending' && href && challenge?.user_code ? (
        <div style={styles.hint}>{t('loginEnterCode')} <code style={styles.code}>{challenge.user_code}</code></div>
      ) : null}

      {error && phase !== 'unavailable'
        ? <div role="alert" style={styles.error}>{t(error)}</div>
        : null}
    </>
  );
}

const styles = {
  caption: {
    marginInlineStart: 8,
    fontSize: 12,
    lineHeight: '18px',
    color: 'var(--dsw-alias-label-secondary, #888)',
  },
  hint: {
    margin: 0,
    fontSize: 13,
    lineHeight: '20px',
    color: 'var(--dsw-alias-label-secondary, #888)',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 28,
    flexWrap: 'wrap',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flex: 'none',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: '1 1 auto',
    minWidth: 0,
    fontSize: 13,
    lineHeight: '20px',
    color: 'var(--dsw-alias-label-primary, inherit)',
  },
  primary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
    marginInlineStart: 'auto',
    height: 28,
    padding: '0 12px',
    border: 'none',
    borderRadius: 'var(--dsw-radius-sm, 8px)',
    background: 'var(--dsw-alias-button-primary-fill, var(--dsw-alias-brand-primary, #3b82f6))',
    color: 'var(--dsw-alias-label-on-color, #fff)',
    fontFamily: 'inherit',
    fontSize: 12,
    lineHeight: '18px',
    fontWeight: 500,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  code: {
    padding: '1px 5px',
    borderRadius: 4,
    background: 'var(--dsw-alias-bg-module-platform, rgba(127,127,127,.12))',
    fontFamily: 'var(--ds-font-family-code, ui-monospace, SFMono-Regular, Menlo, monospace)',
  },
  error: {
    fontSize: 13,
    lineHeight: '20px',
    color: 'var(--dsw-alias-state-error-primary, #dc2626)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
} as const;
