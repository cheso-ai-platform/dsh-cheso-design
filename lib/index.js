// src/index.ts
import { randomUUID as randomUUID2 } from "node:crypto";
import path2 from "node:path";
import { defineTool } from "@deepseek-ai/dsh-tools";
import z from "@deepseek-ai/schemastery";

// src/auth.ts
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
var CHESO_CALLBACK_PATH = "cheso/oauth/callback";
var DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code";
var REFRESH_SKEW_MS = 6e4;
var CLIENT_LOGO_URI = "https://www.deepseek.com/favicon.ico";
var LoginRequired = class extends Error {
  constructor() {
    super("\u8BF7\u5148\u767B\u5F55 Cheso\uFF0C\u518D\u7EE7\u7EED\u521A\u624D\u7684\u64CD\u4F5C\u3002");
  }
};
var loginAttemptMessages = {
  login_expired: "Cheso \u767B\u5F55\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u53D1\u8D77\u767B\u5F55\u3002",
  login_denied: "Cheso \u767B\u5F55\u8BF7\u6C42\u5DF2\u88AB\u62D2\u7EDD\u3002",
  login_incomplete: "Cheso \u6D4F\u89C8\u5668\u767B\u5F55\u672A\u5B8C\u6210\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55\u3002"
};
var LoginAttemptError = class extends Error {
  code;
  constructor(reason) {
    const code = Object.hasOwn(loginAttemptMessages, reason) ? reason : void 0;
    super(code ? loginAttemptMessages[code] : reason);
    this.code = code ?? "login_incomplete";
  }
};
var OAuthError = class extends Error {
  constructor(code, status) {
    super(`Cheso \u6388\u6743\u8BF7\u6C42\u5931\u8D25\uFF08${status}\uFF09`);
    this.code = code;
    this.status = status;
  }
};
function grantOf(record) {
  return record?.kind === "grant" && record.payload && typeof record.payload === "object" ? record.payload : {};
}
function grantRecord(payload) {
  return { kind: "grant", payload: Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== void 0)) };
}
function sameOrigin(url, base) {
  if (!url || !URL.canParse(url)) throw new Error("Cheso \u672A\u63D0\u4F9B\u53EF\u7528\u7684\u6388\u6743\u5730\u5740\u3002");
  const target = new URL(url);
  if (target.origin !== new URL(base).origin || target.username || target.password) {
    throw new Error("Cheso \u6388\u6743\u5730\u5740\u4E0E\u5F53\u524D\u7AD9\u70B9\u4E0D\u4E00\u81F4\u3002");
  }
  return target.href;
}
async function oauthRequest(url, signal, body) {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: body && !(body instanceof URLSearchParams) ? { "content-type": "application/json" } : void 0,
    body: body instanceof URLSearchParams ? body : body ? JSON.stringify(body) : void 0,
    cache: "no-store",
    redirect: "error",
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(3e4)]) : AbortSignal.timeout(3e4)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || typeof payload?.error === "string") {
    throw new OAuthError(payload?.error ?? "request_failed", response.status);
  }
  if (!payload || typeof payload !== "object") throw new Error("\u6240\u9009 Cheso \u7AD9\u70B9\u672A\u8FD4\u56DE OAuth \u6570\u636E\uFF0C\u8BF7\u786E\u8BA4\u7AD9\u70B9\u5DF2\u5F00\u653E\u63D2\u4EF6\u767B\u5F55\u3002");
  return payload;
}
async function exchange(endpoint, form, signal) {
  const payload = await oauthRequest(endpoint, signal, new URLSearchParams(form));
  if (!payload.access_token || !Number.isFinite(payload.expires_in) || payload.expires_in <= 0) {
    throw new Error("Cheso \u8FD4\u56DE\u4E86\u65E0\u6548\u7684\u8BBF\u95EE\u4EE4\u724C\u3002");
  }
  return {
    accessToken: String(payload.access_token),
    refreshToken: String(payload.refresh_token ?? ""),
    expiresAt: Date.now() + payload.expires_in * 1e3,
    clientId: form.client_id,
    tokenEndpoint: endpoint
  };
}
function withRevocation(authorization, endpoint) {
  return endpoint ? { ...authorization, revocationEndpoint: endpoint } : authorization;
}
var ChesoAuthorization = class {
  constructor(store, base) {
    this.store = store;
    this.base = base;
    this.key = `cheso/site-${createHash("sha256").update(base).digest("hex")}`;
  }
  key;
  /** 有可用回调时发起浏览器授权，否则向站点申请设备码。 */
  async start(signal, browserCallback) {
    let view;
    await this.store.modifyRecord(this.key, async (record) => {
      signal?.throwIfAborted();
      const grant = grantOf(record);
      const now = Date.now();
      const active = browserCallback ? grant.browser : grant.pending;
      if (active?.verificationUri && active.expiresAt > now && (!("redirectUri" in active) || active.redirectUri === browserCallback)) {
        view = {
          verification_uri: active.verificationUri,
          ..."userCode" in active ? { user_code: active.userCode } : {},
          expires_in: Math.ceil((active.expiresAt - now) / 1e3),
          expires_at: active.expiresAt
        };
        return;
      }
      const metadata = await oauthRequest(`${this.base}/.well-known/oauth-authorization-server`, signal);
      if (String(metadata.issuer ?? "").replace(/\/+$/, "") !== this.base) {
        throw new Error("Cheso \u6388\u6743\u670D\u52A1\u5668\u4E0E\u5F53\u524D\u7AD9\u70B9\u4E0D\u4E00\u81F4\u3002");
      }
      const deviceEndpoint = !browserCallback && metadata.device_authorization_endpoint ? sameOrigin(metadata.device_authorization_endpoint, this.base) : void 0;
      if (!browserCallback && !deviceEndpoint) {
        throw new Error("\u5F53\u524D DSH \u65E0\u6CD5\u63A5\u6536\u6D4F\u89C8\u5668\u767B\u5F55\u56DE\u8C03\uFF0C\u6240\u9009 Cheso \u7AD9\u70B9\u4E5F\u672A\u5F00\u653E\u8BBE\u5907\u7801\u767B\u5F55\u3002");
      }
      const clientRedirect = browserCallback ?? "http://127.0.0.1/callback";
      const tokenEndpoint = sameOrigin(metadata.token_endpoint, this.base);
      const revocationEndpoint = metadata.revocation_endpoint ? sameOrigin(metadata.revocation_endpoint, this.base) : void 0;
      const register = async () => {
        const registration2 = await oauthRequest(sameOrigin(metadata.registration_endpoint, this.base), signal, {
          client_name: "DeepSeek Harness",
          logo_uri: CLIENT_LOGO_URI,
          redirect_uris: [clientRedirect],
          grant_types: ["authorization_code", "refresh_token"],
          response_types: ["code"],
          token_endpoint_auth_method: "none"
        });
        if (!registration2.client_id) throw new Error("Cheso \u672A\u8FD4\u56DE OAuth \u5BA2\u6237\u7AEF ID\u3002");
        return String(registration2.client_id);
      };
      let clientId = grant.clientId && grant.clientRedirect === clientRedirect && grant.clientLogoUri === CLIENT_LOGO_URI ? grant.clientId : await register();
      const registration = {
        ...grant,
        clientId,
        clientRedirect,
        clientLogoUri: CLIENT_LOGO_URI,
        tokenEndpoint,
        revocationEndpoint,
        loginError: void 0
      };
      if (!deviceEndpoint) {
        const state = randomBytes(32).toString("base64url");
        const verifier = randomBytes(32).toString("base64url");
        const url = new URL(sameOrigin(metadata.authorization_endpoint, this.base));
        for (const [key, value] of Object.entries({
          response_type: "code",
          client_id: clientId,
          redirect_uri: clientRedirect,
          state,
          scope: "cheso",
          code_challenge_method: "S256",
          code_challenge: createHash("sha256").update(verifier).digest("base64url")
        })) url.searchParams.set(key, value);
        const expiresAt = Date.now() + 3e5;
        view = { verification_uri: url.href, expires_in: 300, expires_at: expiresAt };
        return grantRecord({
          ...registration,
          pending: void 0,
          browser: { state, verifier, redirectUri: clientRedirect, verificationUri: url.href, expiresAt }
        });
      }
      const authorize = () => oauthRequest(deviceEndpoint, signal, new URLSearchParams({ client_id: clientId, scope: "cheso" }));
      let device;
      try {
        device = await authorize();
      } catch (error) {
        if (!(error instanceof OAuthError) || error.code !== "invalid_client" || !grant.clientId) throw error;
        clientId = await register();
        device = await authorize();
      }
      if (!device.device_code || !device.user_code || !Number.isFinite(device.expires_in) || device.expires_in <= 0) {
        throw new Error("Cheso \u8FD4\u56DE\u4E86\u65E0\u6548\u7684\u8BBE\u5907\u7801\u3002");
      }
      const interval = Math.max(1, Number(device.interval) || 5) * 1e3;
      const issuedAt = Date.now();
      const pending = {
        deviceCode: String(device.device_code),
        userCode: String(device.user_code),
        verificationUri: sameOrigin(device.verification_uri, this.base),
        expiresAt: issuedAt + device.expires_in * 1e3,
        interval,
        nextPollAt: issuedAt + interval
      };
      view = {
        verification_uri: pending.verificationUri,
        user_code: pending.userCode,
        expires_in: device.expires_in,
        expires_at: pending.expiresAt
      };
      return grantRecord({ ...registration, clientId, pending, browser: void 0 });
    });
    if (!view) throw new Error("Cheso \u767B\u5F55\u8BF7\u6C42\u672A\u4FDD\u5B58\u3002");
    return view;
  }
  /** 校验浏览器回调并消费一次性 state，以授权码换取令牌并保存到当前站点。 */
  async completeBrowser(query) {
    let result = "state_mismatch";
    let previous;
    await this.store.modifyRecord(this.key, async (current) => {
      const grant = grantOf(current);
      const pending = grant.browser;
      const state = query.get("state");
      if (!pending || !grant.clientId || !state || query.getAll("state").length !== 1 || query.get("iss")?.replace(/\/+$/, "") !== this.base || Buffer.byteLength(state) !== Buffer.byteLength(pending.state) || !timingSafeEqual(Buffer.from(state), Buffer.from(pending.state))) return;
      const code = query.get("code");
      if (pending.expiresAt <= Date.now()) {
        result = "callback_error";
      } else if (query.has("error")) {
        result = query.get("error") === "access_denied" ? "denied" : "authorization_error";
      } else if (!code || query.getAll("code").length !== 1) {
        result = "missing_code";
      } else {
        try {
          const authorization = await exchange(sameOrigin(grant.tokenEndpoint, this.base), {
            grant_type: "authorization_code",
            client_id: grant.clientId,
            code,
            redirect_uri: pending.redirectUri,
            code_verifier: pending.verifier
          }, void 0);
          result = "success";
          if (grant.authorization?.refreshToken !== authorization.refreshToken) previous = grant.authorization;
          return grantRecord({ ...grant, browser: void 0, authorization: withRevocation(authorization, grant.revocationEndpoint) });
        } catch (error) {
          result = error instanceof OAuthError && error.code === "invalid_client" ? "invalid_client" : "callback_error";
        }
      }
      return grantRecord({
        ...grant,
        browser: void 0,
        clientId: result === "invalid_client" ? void 0 : grant.clientId,
        loginError: "login_incomplete"
      });
    });
    await this.revoke(previous);
    return result;
  }
  /** 在短超时内尝试撤销旧授权，返回服务端是否确认成功。 */
  async revoke(previous) {
    if (!previous?.revocationEndpoint) return false;
    try {
      const response = await fetch(sameOrigin(previous.revocationEndpoint, this.base), {
        method: "POST",
        body: new URLSearchParams({
          client_id: previous.clientId,
          token: previous.refreshToken || previous.accessToken,
          token_type_hint: previous.refreshToken ? "refresh_token" : "access_token"
        }),
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(3e3)
      });
      await response.body?.cancel().catch(() => {
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  /** 清空站点的本地授权和待处理登录，再尝试撤销已保存的令牌。 */
  async logout(signal) {
    let previous;
    let clearedPending = false;
    await this.store.modifyRecord(this.key, async (current) => {
      signal?.throwIfAborted();
      const grant = grantOf(current);
      if (!grant.authorization && !grant.pending && !grant.browser && !grant.loginError) return;
      previous = grant.authorization;
      clearedPending = Boolean(grant.pending || grant.browser);
      return grantRecord({ ...grant, authorization: void 0, pending: void 0, browser: void 0, loginError: void 0 });
    });
    if (!previous) return { status: clearedPending ? "signed_out" : "already_signed_out" };
    return { status: "signed_out", revoked: await this.revoke(previous) };
  }
  /** 在指定时限内等待浏览器回调或轮询设备码。等待超时时返回 false。 */
  async wait(timeoutMs, signal) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      signal?.throwIfAborted();
      let retryAt = deadline;
      let previous;
      const snapshot = grantOf(await this.store.readRecord(this.key));
      if (snapshot.loginError) throw new LoginAttemptError(snapshot.loginError);
      if (snapshot.browser) {
        if (snapshot.browser.expiresAt <= Date.now()) throw new LoginAttemptError("login_expired");
        await sleep(Math.max(0, Math.min(deadline, snapshot.browser.expiresAt, Date.now() + 1e3) - Date.now()), void 0, { signal });
        continue;
      }
      const record = await this.store.modifyRecord(this.key, async (current) => {
        const grant = grantOf(current);
        const pending = grant.pending;
        if (!pending || !grant.clientId) return;
        const now = Date.now();
        if (now >= pending.expiresAt) {
          return grantRecord({ ...grant, pending: void 0, loginError: "login_expired" });
        }
        retryAt = Math.min(pending.expiresAt, pending.nextPollAt);
        if (now < retryAt || now >= deadline) return;
        try {
          const timeout = AbortSignal.timeout(Math.ceil(Math.min(deadline, pending.expiresAt) - now));
          const authorization = await exchange(sameOrigin(grant.tokenEndpoint, this.base), {
            grant_type: DEVICE_GRANT,
            client_id: grant.clientId,
            device_code: pending.deviceCode
          }, signal ? AbortSignal.any([signal, timeout]) : timeout);
          previous = grant.authorization;
          return grantRecord({ ...grant, pending: void 0, authorization: withRevocation(authorization, grant.revocationEndpoint) });
        } catch (error) {
          signal?.throwIfAborted();
          if (error instanceof OAuthError && ["access_denied", "expired_token", "invalid_grant", "invalid_client"].includes(error.code)) {
            const loginError = error.code === "access_denied" ? "login_denied" : "login_expired";
            return grantRecord({ ...grant, pending: void 0, loginError, clientId: error.code === "invalid_client" ? void 0 : grant.clientId });
          }
          const waiting = error instanceof OAuthError && error.code === "authorization_pending";
          const slowDown = error instanceof OAuthError && error.code === "slow_down";
          if (error instanceof OAuthError && !waiting && !slowDown && error.status < 500 && error.status !== 429) throw error;
          const interval = slowDown ? pending.interval + 5e3 : waiting ? pending.interval : Math.min(6e4, pending.interval * 2);
          retryAt = Date.now() + interval;
          return grantRecord({ ...grant, pending: { ...pending, interval, nextPollAt: retryAt } });
        }
      });
      const state = grantOf(record);
      if (state.loginError) throw new LoginAttemptError(state.loginError);
      if (state.browser) continue;
      if (!state.pending) {
        if (!state.authorization) throw new LoginRequired();
        if (previous?.refreshToken !== state.authorization.refreshToken) await this.revoke(previous);
        return true;
      }
      await sleep(Math.max(0, Math.min(retryAt, deadline) - Date.now()), void 0, { signal });
    }
    return false;
  }
  /** 取得可用的访问令牌，必要时在记录锁内刷新并保存新令牌。 */
  async token(signal, rejected) {
    const reusable = (authorization) => authorization && authorization.accessToken !== rejected && authorization.expiresAt > Date.now() + REFRESH_SKEW_MS;
    const initial = grantOf(await this.store.readRecord(this.key)).authorization;
    if (initial && reusable(initial)) return initial.accessToken;
    const record = await this.store.modifyRecord(this.key, async (current) => {
      signal?.throwIfAborted();
      const grant = grantOf(current);
      const authorization = grant.authorization;
      if (!authorization || reusable(authorization)) return;
      if (!authorization.refreshToken || !authorization.clientId) return grantRecord({ ...grant, authorization: void 0 });
      try {
        const refreshed = await exchange(sameOrigin(authorization.tokenEndpoint, this.base), {
          grant_type: "refresh_token",
          client_id: authorization.clientId,
          refresh_token: authorization.refreshToken
        }, signal);
        return grantRecord({ ...grant, authorization: { ...authorization, ...refreshed, refreshToken: refreshed.refreshToken || authorization.refreshToken } });
      } catch (error) {
        if (!(error instanceof OAuthError) || !["invalid_grant", "invalid_client"].includes(error.code)) throw error;
        return grantRecord({ ...grant, authorization: void 0, clientId: error.code === "invalid_client" && grant.clientId === authorization.clientId ? void 0 : grant.clientId });
      }
    });
    const active = grantOf(record).authorization;
    if (!active) throw new LoginRequired();
    return active.accessToken;
  }
};

// src/api.ts
var ChesoApiError = class extends Error {
  constructor(status, code, retryAfter) {
    super(`Cheso API \u8BF7\u6C42\u5931\u8D25\uFF08HTTP ${status}${code ? `\uFF0C\u9519\u8BEF\u7801 ${code}` : ""}\uFF09`);
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
};
var FixedTokenRejected = class extends Error {
  code = "fixed_token_rejected";
  constructor() {
    super("Cheso \u62D2\u7EDD\u4E86\u914D\u7F6E\u7684 API token\u3002\u8BF7\u66F4\u65B0\u6216\u79FB\u9664 DSH \u914D\u7F6E\u4E2D\u7684 token \u6216\u542F\u52A8\u73AF\u5883\u4E2D\u7684 CHESO_API_TOKEN\uFF0C\u7136\u540E\u91CD\u542F DSH\u3002");
  }
};
var ChesoApi = class {
  constructor(base, auth, fixedToken) {
    this.base = base;
    this.auth = auth;
    this.fixedToken = fixedToken;
  }
  get usesFixedToken() {
    return Boolean(this.fixedToken());
  }
  /** 退出当前站点的 OAuth 登录。配置了固定 API 令牌时，提示用户从配置移除。 */
  async logout(signal) {
    if (this.fixedToken()) {
      throw new Error("\u5F53\u524D\u7AD9\u70B9\u4F7F\u7528\u914D\u7F6E\u7684 API token\u3002\u8BF7\u4ECE DSH \u914D\u7F6E\u6216\u542F\u52A8\u73AF\u5883\u79FB\u9664 token \u540E\u91CD\u542F DSH\u3002");
    }
    return this.auth.logout(signal);
  }
  /** 发送带站点凭据的 API 请求，解析业务响应。OAuth 凭据收到 401 时刷新后重试一次。 */
  async request(path3, { body, signal, timeoutMs = 3e4, devSet } = {}) {
    signal?.throwIfAborted();
    const fixed = this.fixedToken();
    let token = fixed || await this.auth.token(signal);
    const requestSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
    const send = () => fetch(this.base + path3, {
      method: body ? "POST" : "GET",
      headers: {
        "x-cheso-token": token,
        ...body ? { "content-type": "application/json" } : {},
        ...devSet ? { "X-Dev-Set": devSet } : {}
      },
      body: body ? JSON.stringify(body) : void 0,
      redirect: "error",
      cache: "no-store",
      signal: requestSignal
    });
    let response = await send();
    if (response.status === 401 && !fixed) {
      await response.body?.cancel();
      token = await this.auth.token(requestSignal, token);
      response = await send();
    }
    if (response.status === 401) {
      await response.body?.cancel().catch(() => {
      });
      if (fixed) throw new FixedTokenRejected();
      throw new LoginRequired();
    }
    const payload = await response.json().catch((error) => {
      requestSignal.throwIfAborted();
      if (!(error instanceof SyntaxError)) throw error;
      return null;
    });
    if (!response.ok || typeof payload?.code === "number" && payload.code !== 0) {
      const retryAfter = Number(response.headers.get("retry-after"));
      throw new ChesoApiError(response.status, payload?.code, retryAfter > 0 ? retryAfter : void 0);
    }
    if (!payload || typeof payload !== "object") throw new ChesoApiError(response.status);
    return payload.data ?? payload;
  }
  whoami(signal) {
    return this.request("/api/v1/whoami", { signal });
  }
  /** 由 Manager 核对读权限，为指定文件版本签发短期预览会话。 */
  previewSession(fileId, { version, signal, devSet } = {}) {
    return this.request("/api/v1/files/download_url", {
      body: { file_id: fileId, version, for_preview: true },
      signal,
      devSet
    });
  }
  /** 用已校验的项目 ID 生成当前站点的项目链接。 */
  projectUrl(projectId) {
    return `${this.base}/agent/${chesoId(projectId)}`;
  }
  /** 将项目文件树展开为文件列表，跳过目录和画布节点。 */
  async projectFiles(projectId, signal) {
    const result = await this.request(`/api/v1/project/files/tree?project_id=${chesoId(projectId)}`, { signal });
    const files = [];
    const visit = (nodes, parent = "", depth = 0) => {
      if (depth > 32) return;
      for (const node of nodes ?? []) {
        const relative = parent ? `${parent}/${node.name ?? ""}` : node.name ?? "";
        const kind = node.kind ?? node.file?.kind;
        if (node.file_id && node.type === "file" && kind !== "folder" && kind !== "canvas") {
          files.push({
            file_id: node.file_id,
            name: node.file?.file_path || relative,
            version: node.file?.version,
            category: node.file?.category,
            created_at: node.file?.created_at
          });
        }
        visit(node.children, relative, depth + 1);
      }
    };
    visit(result.tree);
    return files;
  }
  /** 汇总当前有效积分额度中可用的余额。 */
  async credits(signal) {
    const data = await this.request("/api/v1/billing/credits", { signal });
    const now = Date.now();
    return (data.grants ?? []).reduce((total, grant) => {
      const starts = Date.parse(grant.valid_from ?? "");
      const ends = Date.parse(grant.expires_at ?? "");
      const amount = Number(grant.amount_available);
      const expired = !grant.expires_at?.startsWith("0001-01-01") && ends <= now;
      if (starts > now || expired || !Number.isFinite(amount) || amount <= 0) return total;
      return total + amount;
    }, 0);
  }
};
function chesoId(id) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id)) throw new Error("Cheso ID \u65E0\u6548\u3002");
  return id;
}

// src/embed-format.ts
var embedFormats = /* @__PURE__ */ new Set([
  ...`vppt vimg vmotion vboard drawnix html htm svg image png jpg jpeg gif bmp webp ico tiff tif heic heif avif apng
  video mp4 webm mov avi wmv flv m3u8 3gp mkv mpg mpeg ogv
  audio mp3 wav ogg oga m4a aac flac wma opus mid midi amr aiff aif caf wv ape mka ac3 dts pcm au ra ram mp2
  pdf docx pptx xls xlsx csv md markdown vue jsx tsx plantuml puml mermaid mmd
  text code code-preview js ts py java c cpp cs go rb php swift kt kotlin scala rs sh pl lua r dart elm clj erl hs
  css scss less xml yml yaml json ini toml env sql txt log svelte pug jade ejs hbs njk sass styl dockerfile makefile
  nginx apache gradle cmake ps1 psm1 bat cmd fish zsh jl ex exs nim cr zig v vb fs ml graphql gql proto rst tex adoc org`.split(/\s+/)
]);
function isEmbedFormat(format) {
  return embedFormats.has(format);
}

// src/files.ts
import { constants, createWriteStream, openAsBlob, promises as fs } from "node:fs";
import { createHash as createHash2, randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
var MIME_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".csv": "text/csv",
  ".json": "application/json",
  ".html": "text/html",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};
function safeFilename(input) {
  const name2 = input.split(/[\\/]/).pop()?.replace(/[\x00-\x1f<>:"|?*]/g, "_").trim();
  return name2 && name2 !== "." && name2 !== ".." ? name2 : "artifact";
}
function storageUrl(raw) {
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Cheso \u8FD4\u56DE\u4E86\u65E0\u6548\u7684\u6587\u4EF6\u4F20\u8F93\u5730\u5740\u3002");
  }
  return url;
}
function transferSignal(signal) {
  const timeout = AbortSignal.timeout(12e4);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}
function userAttachmentBlocks(agent) {
  return (agent?.session?.deriveMessages?.() ?? []).reverse().find((message) => message.role === "user" && message.source.kind === "user")?.content.filter((block) => block.type === "file" || block.type === "image") ?? [];
}
async function authorizedSources(ctx, paths, site, exec, attachmentBlocks) {
  const { agent, signal } = exec;
  const store = ctx.get("attachments");
  const attached = attachmentBlocks.flatMap((block) => {
    if (!store || block.type !== "file" && block.type !== "image" || !("attachment" in block)) return [];
    const ref = block.attachment;
    const filename = block.type === "file" ? store.fileHostPath?.(ref) : store.imageHostPath?.(ref);
    if (typeof filename !== "string" || !path.isAbsolute(filename)) return [];
    const visiblePath = ctx.get("fs")?.processPathFromHostPath?.(filename);
    const mime = block.type === "image" ? block.attachment.mediaType : void 0;
    const name2 = ref.name ?? `image.${mime?.split("/")[1] ?? "png"}`;
    return [{ filename, name: name2, mime, digest: String(ref.attachmentId), visiblePath }];
  });
  const approval = ctx.get("approval");
  let cwd;
  const needsApproval = /* @__PURE__ */ new Set();
  const sources = [];
  for (const requested of paths) {
    signal.throwIfAborted();
    const matches = attached.filter((file) => requested === file.digest || requested === file.filename || requested === file.visiblePath);
    const candidates = matches.length ? matches : attached.filter((file) => requested === file.name);
    const selected = new Map(candidates.map((file) => [file.digest, file]));
    if (selected.size > 1) throw new Error("\u6709\u591A\u4E2A\u540C\u540D\u9644\u4EF6\uFF0C\u8BF7\u901A\u8FC7 DSH \u63D0\u4F9B\u7684\u9644\u4EF6\u8DEF\u5F84\u6307\u5B9A\u6587\u4EF6\u3002");
    const attachment = selected.values().next().value;
    if (attachment) {
      sources.push(attachment);
      continue;
    }
    if (!agent || !approval) throw new Error("\u5F53\u524D DSH \u65E0\u6CD5\u786E\u8BA4\u672C\u5730\u6587\u4EF6\u4E0A\u4F20\uFF0C\u8BF7\u5C06\u6587\u4EF6\u76F4\u63A5\u9644\u52A0\u5230\u6D88\u606F\u4E2D\u3002");
    const workingDirectory = cwd ??= await ctx.workingDirectory.ensure(agent, signal);
    const requestedPath = path.resolve(workingDirectory, requested);
    const filename = await canonicalPath(requestedPath);
    const beforeApproval = await fs.stat(filename, { bigint: true }).catch(() => void 0);
    if (!beforeApproval?.isFile()) throw new Error(`\u65E0\u6CD5\u8BFB\u53D6\u9644\u4EF6 ${safeFilename(requestedPath)}\uFF0C\u8BF7\u9009\u62E9\u666E\u901A\u6587\u4EF6\u3002`);
    needsApproval.add(filename);
    sources.push({ filename, name: path.basename(requestedPath), beforeApproval });
  }
  if (needsApproval.size) {
    const files = [...needsApproval].map((file) => JSON.stringify(file)).join(", ");
    const outcome = await approval.request({
      agent,
      toolName: exec.name,
      callId: exec.callId,
      signal,
      reason: `\u5141\u8BB8\u5C06\u8FD9\u4E9B\u672C\u5730\u6587\u4EF6\u4E0A\u4F20\u5230 ${site} \u5417\uFF1F
${files}`,
      displayReason: { en: `Upload these local files to ${site}?
${files}`, zh: `\u5141\u8BB8\u5C06\u8FD9\u4E9B\u672C\u5730\u6587\u4EF6\u4E0A\u4F20\u5230 ${site} \u5417\uFF1F
${files}` }
    });
    signal.throwIfAborted();
    if (outcome !== "allowed-once") throw new Error("\u672C\u5730\u6587\u4EF6\u4E0A\u4F20\u672A\u83B7\u6388\u6743\u3002");
  }
  return sources;
}
function sameFileRevision(first, second) {
  return first.dev === second.dev && first.ino === second.ino && first.size === second.size && first.mtimeNs === second.mtimeNs && first.ctimeNs === second.ctimeNs;
}
async function canonicalPath(filename) {
  return fs.realpath(filename).catch(() => {
    throw new Error(`\u65E0\u6CD5\u8BFB\u53D6\u9644\u4EF6 ${safeFilename(filename)}\u3002`);
  });
}
async function prepareAttachment(source, snapshot, signal) {
  const { filename } = source;
  const name2 = safeFilename(source.name);
  const mime = source.mime ?? MIME_TYPES[path.extname(name2).toLowerCase()] ?? "application/octet-stream";
  const canonical = source.digest ? await canonicalPath(filename) : filename;
  const handle = await fs.open(canonical, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK).catch(() => {
    throw new Error(`\u65E0\u6CD5\u8BFB\u53D6\u9644\u4EF6 ${name2}\uFF0C\u8BF7\u9009\u62E9\u666E\u901A\u6587\u4EF6\u3002`);
  });
  try {
    const before = await handle.stat({ bigint: true });
    const actual = await fs.stat(canonical, { bigint: true });
    if (!before.isFile() || before.dev !== actual.dev || before.ino !== actual.ino || await canonicalPath(canonical) !== canonical) {
      throw new Error(`\u9644\u4EF6 ${name2} \u7684\u8DEF\u5F84\u5DF2\u53D8\u5316\uFF0C\u6216\u76EE\u6807\u4E0D\u662F\u666E\u901A\u6587\u4EF6\u3002`);
    }
    if (source.beforeApproval && !sameFileRevision(source.beforeApproval, before)) {
      throw new Error(`\u9644\u4EF6 ${name2} \u5728\u7B49\u5F85\u5BA1\u6279\u671F\u95F4\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u6587\u4EF6\u3002`);
    }
    const hash = createHash2("md5");
    const digest = source.digest ? createHash2("sha256") : void 0;
    await pipeline(
      handle.createReadStream({ autoClose: false }),
      async function* (chunks) {
        for await (const chunk of chunks) {
          hash.update(chunk);
          digest?.update(chunk);
          yield chunk;
        }
      },
      createWriteStream(snapshot, { flags: "wx", mode: 384 }),
      { signal }
    );
    const after = await handle.stat({ bigint: true });
    if (!sameFileRevision(before, after) || digest && `sha256:${digest.digest("hex")}` !== source.digest) {
      throw new Error(`\u9644\u4EF6 ${name2} \u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u6587\u4EF6\u3002`);
    }
    return { file: await openAsBlob(snapshot, { type: mime }), name: name2, mime, hash: hash.digest("hex") };
  } finally {
    await handle.close();
  }
}
async function uploadAttachments(ctx, api, paths, projectId, exec, attachmentBlocks) {
  const sources = await authorizedSources(ctx, paths, api.base, exec, attachmentBlocks);
  const directory = await fs.mkdtemp(path.join(tmpdir(), "dsh-cheso-upload-"));
  try {
    const prepared = [];
    for (const [index, source] of sources.entries()) {
      prepared.push(await prepareAttachment(source, path.join(directory, String(index)), exec.signal));
    }
    const ids = [];
    for (const file of prepared) ids.push(await uploadAttachment(api, file, projectId, exec.signal));
    return ids;
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}
async function uploadAttachment(api, attachment, projectId, signal) {
  const { name: name2, mime, file, hash } = attachment;
  const body = { name: name2, size: file.size, hash, mime_type: mime, category: "attachment" };
  const presign = (attachmentName) => api.request("/api/v1/files/presign", {
    body: { ...body, ...projectId ? { project_id: projectId, create_only: true, file_path: `attachments/${attachmentName}` } : {} },
    signal
  });
  let upload;
  try {
    upload = await presign(name2);
  } catch (error) {
    if (!projectId || !(error instanceof ChesoApiError) || error.code !== 1208) throw error;
    const ext = path.extname(name2);
    upload = await presign(`${path.basename(name2, ext)}-${randomUUID()}${ext}`);
  }
  if (!upload.file_id) throw new Error("Cheso \u672A\u8FD4\u56DE\u9644\u4EF6 ID\u3002");
  if (!upload.instant) {
    if (!upload.upload_url || !upload.version) throw new Error("Cheso \u672A\u8FD4\u56DE\u5B8C\u6574\u7684\u9644\u4EF6\u4E0A\u4F20\u4FE1\u606F\u3002");
    const response = await fetch(storageUrl(upload.upload_url), {
      method: "PUT",
      body: file,
      headers: { "content-type": mime, "content-length": String(file.size) },
      redirect: "error",
      signal: transferSignal(signal)
    });
    await response.body?.cancel();
    if (!response.ok) throw new Error(`Cheso \u9644\u4EF6\u4E0A\u4F20\u5931\u8D25\uFF08HTTP ${response.status}\uFF09`);
    await api.request("/api/v1/files/confirm", { body: { file_id: upload.file_id, version: upload.version }, signal });
  }
  return upload.file_id;
}

// src/tasks.ts
import { setTimeout as sleep2 } from "node:timers/promises";
var TERMINAL = /* @__PURE__ */ new Set(["completed", "failed", "terminated", "rolled_back"]);
async function resultFor(api, taskId, signal, onHandoff) {
  const visited = /* @__PURE__ */ new Set();
  let id = taskId;
  let activeId;
  while (!visited.has(id) && visited.size < 30) {
    visited.add(id);
    const result = await api.request(`/api/v1/plans/${chesoId(id)}/result`, { signal });
    if (result.reason === "hard_stopped" || result.status === "hard_stopped") {
      return { id, result: { ...result, status: "terminated", reason: void 0 }, activeId: void 0 };
    }
    if (!TERMINAL.has(result.status) && result.status !== "pending") activeId = id;
    if (!result.next_plan_id) return { id, result, activeId };
    id = chesoId(result.next_plan_id);
    if (!visited.has(id)) onHandoff?.(id, activeId);
  }
  throw new Error("Cheso \u4EFB\u52A1\u63A5\u7EED\u94FE\u5F02\u5E38\u3002");
}
function filesOf(result) {
  return (result.result?.files ?? []).flatMap((file) => file.file_id && (file.category === void 0 || file.category === "result") ? [{ file_id: file.file_id, name: file.name || file.path || file.file_id, version: file.version, category: "result" }] : []);
}
function questionsOf(interaction) {
  const items = interaction?.questions;
  if (!Array.isArray(items) || !items.every((item) => typeof item?.question === "string" && item.question.trim())) return [];
  return items.map(({ question, header, options, multi_select }) => ({
    question,
    ...typeof header === "string" && header ? { header } : {},
    ...Array.isArray(options) ? {
      options: options.flatMap((option) => typeof option?.label === "string" && option.label.trim() ? [{ label: option.label, ...typeof option.description === "string" ? { description: option.description } : {} }] : [])
    } : {},
    ...multi_select === true ? { multi_select } : {}
  }));
}
function interactionKey(id, interaction) {
  return JSON.stringify([id, interaction?.tool_call_id ?? null, questionsOf(interaction)]);
}
function questionPreviews(interaction) {
  if (!Array.isArray(interaction?.questions)) return [];
  return interaction.questions.flatMap(
    (question) => Array.isArray(question?.options) ? question.options.flatMap(
      (option) => typeof option?.label === "string" && typeof option.html_preview === "string" && option.html_preview.trim() ? [{ label: option.label, html: option.html_preview }] : []
    ) : []
  );
}
function transientPollError(error) {
  return error instanceof TypeError || error instanceof DOMException && error.name === "TimeoutError" || error instanceof ChesoApiError && (error.status === 429 || error.status >= 500);
}
async function stopTask(api, taskId, previousTaskId, signal) {
  const stoppedResult = (id2, result2) => ({
    task_id: id2,
    status: result2.status,
    ...result2.status === "terminated" ? { files: filesOf(result2) } : {}
  });
  const stopTarget = async (chain) => {
    if (chain.result.status !== "pending") return chain.id;
    if (chain.activeId) return chain.activeId;
    if (!previousTaskId || previousTaskId === chain.id) return chain.id;
    const previous = await resultFor(api, previousTaskId, signal);
    return previous.activeId ?? chain.id;
  };
  const { id, result, activeId } = await resultFor(api, taskId, signal);
  if (TERMINAL.has(result.status)) return stoppedResult(id, result);
  const stopId = await stopTarget({ id, result, activeId });
  try {
    await api.request(`/api/v1/plans/${chesoId(stopId)}/terminate`, { body: {}, signal });
  } catch (error) {
    if (!(error instanceof ChesoApiError && error.code === 1101)) throw error;
    const latest = await resultFor(api, taskId, signal);
    if (TERMINAL.has(latest.result.status)) return stoppedResult(latest.id, latest.result);
    const nextStopId = await stopTarget(latest);
    if (nextStopId === stopId) {
      if (latest.result.status === "pending") return stoppedResult(latest.id, latest.result);
      throw error;
    }
    try {
      await api.request(`/api/v1/plans/${chesoId(nextStopId)}/terminate`, { body: {}, signal });
    } catch (retryError) {
      if (!(retryError instanceof ChesoApiError && retryError.code === 1101)) throw retryError;
      const settled = await resultFor(api, taskId, signal);
      if (TERMINAL.has(settled.result.status) || settled.result.status === "pending") return stoppedResult(settled.id, settled.result);
      throw retryError;
    }
  }
  const deadline = AbortSignal.timeout(1e4);
  const pollSignal = signal ? AbortSignal.any([signal, deadline]) : deadline;
  try {
    while (!pollSignal.aborted) {
      const latest = await resultFor(api, id, pollSignal).catch((error) => {
        if (!transientPollError(error)) throw error;
      });
      if (latest && TERMINAL.has(latest.result.status)) return stoppedResult(latest.id, latest.result);
      await sleep2(1e3, void 0, { signal: pollSignal });
    }
  } catch (error) {
    signal?.throwIfAborted();
    if (!deadline.aborted && !(error instanceof ChesoApiError || error instanceof LoginRequired)) throw error;
  }
  signal?.throwIfAborted();
  return { task_id: id, status: "stopping" };
}
async function waitForTask(api, taskId, timeoutSec, knownProject, signal, repliedQuestion, onHandoff) {
  const timeout = AbortSignal.timeout(Math.floor(timeoutSec * 1e3));
  const waitSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let latest;
  let current = taskId;
  let failures = 0;
  let waitingForUser = false;
  try {
    while (!waitSignal.aborted) {
      let delay = 3e3;
      try {
        latest = await resultFor(api, current, waitSignal, (id, activeId) => {
          current = id;
          onHandoff?.(id, activeId);
        });
        current = latest.id;
        failures = 0;
        waitingForUser = latest.result.status === "interact" && interactionKey(current, latest.result.interaction) !== repliedQuestion;
        if (latest.result.status !== "interact") repliedQuestion = void 0;
        if (waitingForUser || TERMINAL.has(latest.result.status)) break;
      } catch (error) {
        if (!transientPollError(error) || ++failures > 5) throw error;
        if (error instanceof ChesoApiError && error.retryAfter) delay = error.retryAfter * 1e3;
      }
      await sleep2(delay, void 0, { signal: waitSignal });
    }
  } catch (error) {
    signal?.throwIfAborted();
    if (!timeout.aborted) throw error;
  }
  signal?.throwIfAborted();
  if (!latest || !TERMINAL.has(latest.result.status) && !waitingForUser) {
    return { task_id: current, project_id: knownProject, status: "running", done: false, repliedQuestion };
  }
  const { result } = latest;
  if (result.status === "terminated") {
    return {
      task_id: current,
      status: result.status,
      project_id: knownProject,
      done: true,
      files: filesOf(result),
      message: result.reason,
      answer: result.result?.text
    };
  }
  const projectId = knownProject ?? (await api.request(`/api/v1/plans/${chesoId(current)}`, { signal }).catch((error) => {
    signal?.throwIfAborted();
    if (error instanceof LoginRequired) throw error;
    return { project_id: void 0 };
  })).project_id;
  const questions = waitingForUser ? questionsOf(result.interaction) : [];
  const message = waitingForUser ? questions.map(({ question, options }, index) => `${index + 1}. ${question}${options?.length ? `\uFF08${options.map((option) => option.label).join(" / ")}\uFF09` : ""}`).join("\n") : result.reason;
  return {
    task_id: current,
    status: result.status,
    done: TERMINAL.has(result.status),
    project_id: projectId,
    answer: result.result?.text,
    message,
    files: filesOf(result),
    ...waitingForUser ? {
      interaction: { key: interactionKey(current, result.interaction), questions, previews: questionPreviews(result.interaction) }
    } : {}
  };
}
function hasDuplicateQuestions(questions) {
  return new Set(questions.map((question) => question.question)).size !== questions.length;
}
function userQuestionsFor(questions) {
  return questions.map(({ multi_select, ...question }, index) => ({
    ...question,
    id: String(index + 1),
    multiSelect: multi_select === true
  }));
}
async function waitForQuestionToClose(api, taskId, key, signal) {
  let failures = 0;
  let delay = 3e3;
  for (; ; ) {
    await sleep2(delay, void 0, { signal });
    try {
      const { id, result } = await resultFor(api, taskId, signal);
      if (result.status !== "interact" || interactionKey(id, result.interaction) !== key) return;
      failures = 0;
      delay = 3e3;
    } catch (error) {
      signal.throwIfAborted();
      if (!transientPollError(error) || ++failures > 5) throw error;
      delay = error instanceof ChesoApiError && error.retryAfter ? error.retryAfter * 1e3 : 3e3;
    }
  }
}
async function askWhileQuestionIsOpen(api, taskId, question, ask, signal) {
  const stop = new AbortController();
  const localSignal = signal ? AbortSignal.any([signal, stop.signal]) : stop.signal;
  localSignal.throwIfAborted();
  try {
    return await Promise.race([
      ask(userQuestionsFor(question.questions), localSignal).catch(() => void 0),
      waitForQuestionToClose(api, taskId, question.key, localSignal).then(() => "closed")
    ]);
  } finally {
    stop.abort();
  }
}
async function replyToTask(api, taskId, question, reply, signal, submissionSignal = signal) {
  signal?.throwIfAborted();
  if (hasDuplicateQuestions(question.questions)) throw new Error("\u8FD9\u6279\u63D0\u95EE\u5305\u542B\u91CD\u590D\u9898\u5E72\uFF0C\u8BF7\u5728 Cheso \u9879\u76EE\u4E2D\u56DE\u7B54\u3002");
  const questions = userQuestionsFor(question.questions);
  const answers = new Map(reply.answers.map((answer) => [answer.id, answer]));
  if (!questions.length || answers.size !== questions.length || reply.answers.length !== questions.length) {
    throw new Error("Cheso \u95EE\u7B54\u9700\u8981\u56DE\u7B54\u6216\u660E\u786E\u8DF3\u8FC7\u6BCF\u4E00\u9898\u3002");
  }
  const reviewed = questions.map((item) => {
    const answer = answers.get(item.id);
    if (!answer || !Array.isArray(answer.selected) || answer.selected.some((label) => !item.options?.some((option) => option.label === label)) || !item.multiSelect && (answer.selected.length > 1 || answer.selected.length && answer.custom) || answer.custom !== void 0 && (typeof answer.custom !== "string" || !answer.custom.trim())) {
      throw new Error("Cheso \u95EE\u7B54\u6536\u5230\u65E0\u6548\u7684\u7528\u6237\u56DE\u590D\u3002");
    }
    const values = [...answer.selected, ...answer.custom ? [answer.custom.trim()] : []];
    return { question: item.question, label: item.header || item.question, values };
  });
  const pairs = reviewed.flatMap(({ question: question2, values }) => values.length ? [[question2, values.join(",")]] : []);
  const { id, result } = await resultFor(api, taskId, signal);
  if (result.status !== "interact" || interactionKey(id, result.interaction) !== question.key) return "changed";
  const skip = pairs.length === 0;
  signal?.throwIfAborted();
  try {
    await api.request(`/api/v1/plans/${chesoId(id)}/interact`, {
      body: {
        args: {
          ...result.interaction?.tool_call_id ? { tool_call_id: result.interaction.tool_call_id } : {},
          ...!skip ? { answers: Object.fromEntries(pairs) } : {}
        },
        skip
      },
      signal: submissionSignal
    });
  } catch (error) {
    if (!(error instanceof ChesoApiError && error.code === 1101)) throw error;
    return "expired";
  }
  return { answers: reviewed.map(({ label, question: question2, values }) => ({
    label,
    ...question2 === label ? {} : { question: question2 },
    values
  })) };
}

// src/sites.ts
var CHESO_SITES = {
  global: "https://cheso.ai"
};
var CHESO_SITE_OPTIONS = ["configured", "global"];
function projectSite(projectUrl) {
  if (typeof projectUrl !== "string") return void 0;
  return projectUrl.match(/^(.*)\/agent\/[A-Za-z0-9_-]+\/?$/)?.[1];
}

// src/index.ts
var name = "cheso";
var inject = ["tools", "workingDirectory", "credentials"];
var Config = z.object({
  /** DSH 以可实时读取的配置项提供站点，切换后新请求立即使用新站点。 */
  site: z.union([...CHESO_SITE_OPTIONS]).default("configured").volatile(),
  /** Cheso 站点，例如 https://cheso.ai。 */
  baseUrl: z.string().default(CHESO_SITES.global),
  /** 只读预览页所在站点；留空跟随 baseUrl，本地开发时可指向 Vite。 */
  embedBaseUrl: z.string().default(""),
  /** 可选的 Manager 分流标识，传给预览路由发起的文件查询。 */
  devSet: z.string().default(""),
  /** 每段任务轮询的默认上限（秒），不含用户回答时间。 */
  timeoutSec: z.number().default(540),
  /** 可选的 API 令牌。留空时使用 DSH 保存的登录授权。 */
  token: z.string().default("")
});
var STOP_SUMMARY = "Cheso \u4EFB\u52A1\u5DF2\u505C\u6B62\u3002\u8BF7\u7528\u4E00\u4E24\u53E5\u8BDD\u544A\u77E5\u7528\u6237\uFF0C\u6309\u9700\u63D0\u53CA\u4EFB\u52A1\u7ED3\u679C\u5217\u51FA\u7684\u6210\u54C1\u548C\u9879\u76EE\u94FE\u63A5\u3002\u4E0D\u8981\u518D\u67E5\u8BE2\u9879\u76EE\u6587\u4EF6\u3001\u7EE7\u7EED\u7B49\u5F85\u6216\u91CD\u65B0\u63D0\u4EA4\u4EFB\u52A1\u3002";
var DSH_LOGIN_REQUIRED = "Cheso \u672A\u767B\u5F55\u3002\u8BF7\u7528\u6237\u4ECE DSH \u767B\u5F55\u5361\u83B7\u53D6\u6388\u6743\u94FE\u63A5\u5E76\u5B8C\u6210\u6D4F\u89C8\u5668\u6388\u6743\uFF0C\u7136\u540E\u518D\u7EE7\u7EED\u3002";
function includesStartupEntry(entries, id) {
  return entries.some((entry) => entry.id === id || entry.group === true && Array.isArray(entry.config) && includesStartupEntry(entry.config, id));
}
function formatOf(nameOrPath) {
  const name2 = (nameOrPath.split(/[\\/]/).pop() ?? "").toLowerCase();
  return path2.extname(name2).slice(1) || (isEmbedFormat(name2.replace(/^\./, "")) ? name2.replace(/^\./, "") : "");
}
function trimBaseUrl(raw) {
  return raw.trim().replace(/\/+$/, "");
}
function resolveSiteConfig({ site: _site, ...config }, site, credentials) {
  const configuredBase = trimBaseUrl(config.baseUrl);
  const baseUrl = site === "configured" ? configuredBase : CHESO_SITES[site];
  const embedOverride = site === "configured" ? trimBaseUrl(config.embedBaseUrl) : "";
  const inheritToken = baseUrl === configuredBase;
  return {
    ...config,
    baseUrl,
    embedBaseUrl: embedOverride || baseUrl,
    legacyEmbedBaseUrl: site === "configured" && !embedOverride ? CHESO_SITES.global : void 0,
    devSet: config.devSet?.trim() || void 0,
    token: inheritToken ? config.token : "",
    api: new ChesoApi(baseUrl, new ChesoAuthorization(credentials, baseUrl), () => inheritToken ? config.token?.trim() || process.env.CHESO_API_TOKEN?.trim() : void 0)
  };
}
function toolFailure(error, config, taskId) {
  const common = { ...taskId ? { task_id: taskId } : {}, embed_base_url: config.embedBaseUrl };
  if (error instanceof LoginRequired) return { ...common, status: "login_required", message: error.message, base_url: config.baseUrl };
  if (error instanceof ChesoApiError && error.code === 2614) {
    throw new Error("\u8BE5\u9879\u76EE\u5DF2\u6709\u4EFB\u52A1\u5728\u8FD0\u884C\uFF0C\u8BF7\u7B49\u5F85\u4EFB\u52A1\u5B8C\u6210\u540E\u518D\u8BD5\u3002");
  }
  throw error;
}
function definedOnly(value) {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== void 0));
}
function creationTime(artifact) {
  const timestamp = Date.parse(artifact.created_at ?? "");
  return Number.isFinite(timestamp) ? timestamp : Number.MIN_SAFE_INTEGER;
}
function artifactsOf(view) {
  const files = Array.isArray(view.files) ? view.files : [];
  const artifacts = [];
  for (const item of files) {
    if (!item || typeof item !== "object" || item.kind === "folder") continue;
    const name2 = String(item.name ?? item.path ?? item.file_id ?? "artifact");
    artifacts.push({
      name: name2,
      format: formatOf(name2),
      ...typeof item.file_id === "string" ? { file_id: item.file_id } : {},
      ...typeof item.version === "number" ? { version: item.version } : {},
      ...typeof item.category === "string" ? { category: item.category } : {},
      ...typeof item.created_at === "string" ? { created_at: item.created_at } : {}
    });
  }
  return artifacts.sort((a, b) => {
    const priority = Number(b.category === "result") - Number(a.category === "result");
    if (priority !== 0 || a.category === "result") return priority;
    return creationTime(b) - creationTime(a);
  });
}
var artifactCardSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    task_id: { type: "string" },
    status: { type: "string" },
    project_id: { type: "string" },
    project_url: { type: "string" },
    artifacts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          file_id: { type: "string" },
          version: { type: "number" },
          name: { type: "string" },
          format: { type: "string" },
          category: { type: "string" },
          created_at: { type: "string" }
        }
      }
    },
    embed_base_url: { type: "string" },
    base_url: { type: "string" },
    retry_call_id: { type: "string" },
    previous_task_id: { type: "string" },
    message: { type: "string" },
    answer: { type: "string" }
  }
};
var waitCardSchema = {
  ...artifactCardSchema,
  properties: {
    ...artifactCardSchema.properties,
    question_receipts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          answers: {
            type: "array",
            required: true,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                label: { type: "string", required: true },
                question: { type: "string" },
                values: { type: "array", required: true, items: { type: "string" } }
              }
            }
          }
        }
      }
    }
  }
};
function cardPayload(view, config, extra = {}) {
  return definedOnly({
    task_id: typeof view.task_id === "string" ? view.task_id : void 0,
    status: typeof view.status === "string" ? view.status : "unknown",
    project_id: typeof view.project_id === "string" ? view.project_id : void 0,
    project_url: typeof view.project_url === "string" ? view.project_url : void 0,
    message: typeof view.message === "string" ? view.message : void 0,
    answer: typeof view.answer === "string" ? view.answer.slice(0, 1200) : void 0,
    artifacts: artifactsOf(view),
    embed_base_url: trimBaseUrl(config.embedBaseUrl),
    base_url: config.baseUrl,
    previous_task_id: typeof view.previous_task_id === "string" ? view.previous_task_id : void 0,
    ...extra
  });
}
async function stoppedCard(result, config, signal, extra) {
  let projectId;
  try {
    let id = result.project_id;
    if (!id) {
      const deadline = AbortSignal.timeout(5e3);
      const plan = await config.api.request(`/api/v1/plans/${chesoId(result.task_id)}`, {
        signal: signal ? AbortSignal.any([signal, deadline]) : deadline
      });
      id = plan.project_id;
    }
    if (id) projectId = chesoId(id);
  } catch {
    signal?.throwIfAborted();
  }
  return cardPayload({
    ...result,
    status: "terminated",
    project_id: projectId,
    project_url: projectId ? config.api.projectUrl(projectId) : void 0
  }, config, extra);
}
function projectIdFromReference(reference, baseUrl) {
  const input = reference.trim();
  if (/^project_[a-z0-9]+$/i.test(input)) return input;
  const url = URL.canParse(input) ? new URL(input) : void 0;
  const projectId = url?.pathname.match(/^\/agent\/(project_[a-z0-9]+)(?:\/|$)/i)?.[1];
  if (!url || !projectId || url.username || url.password) {
    throw new Error("\u8BF7\u8F93\u5165 project_id \u6216\u5B8C\u6574\u7684 Cheso \u9879\u76EE\u94FE\u63A5\u3002");
  }
  if (url.origin !== new URL(baseUrl).origin) {
    throw new Error("\u9879\u76EE\u94FE\u63A5\u4E0E\u63D2\u4EF6\u914D\u7F6E\u7684 Cheso \u7AD9\u70B9\u4E0D\u4E00\u81F4\u3002");
  }
  return projectId;
}
function renderCard(payload, headline) {
  const lines = [headline];
  if (payload.project_url) lines.push(`\u9879\u76EE\uFF1A${String(payload.project_url)}`);
  const artifacts = payload.artifacts ?? [];
  if (artifacts.length > 0) {
    lines.push("\u6587\u4EF6\uFF1A");
    for (const item of artifacts) {
      const tag = item.file_id ? ` [${item.file_id}${item.version ? ` v${item.version}` : ""}]` : "";
      lines.push(`- ${item.name} (${item.format})${tag}`);
    }
  }
  if (payload.message) lines.push(String(payload.message));
  if (payload.answer) {
    lines.push("", String(payload.answer));
  }
  lines.push(`[cheso-card]${JSON.stringify(payload)}`);
  return [{ type: "text", text: lines.join("\n") }];
}
function* historicalCards(agent) {
  const messages = agent?.session?.deriveMessages?.() ?? [];
  const names = /* @__PURE__ */ new Set(["cheso_create", "cheso_wait", "cheso_stop", "cheso_login", "cheso_project_files"]);
  const calls = new Set(messages.flatMap((message) => message.role === "assistant" ? message.content.flatMap((block) => block.type === "tool-call" && names.has(block.name) ? [block.id] : []) : []));
  for (const message of messages.reverse()) {
    if (message.role !== "tool" || message.isError || !calls.has(message.source.callId)) continue;
    for (const block of message.content) {
      if (block.type !== "text") continue;
      const marker = "\n[cheso-card]";
      const start = block.text.lastIndexOf(marker);
      if (start < 0) continue;
      try {
        const card = JSON.parse(block.text.slice(start + marker.length));
        if (card && typeof card === "object" && !Array.isArray(card)) yield card;
      } catch {
      }
    }
  }
}
function historicalTask(taskId, agent) {
  const routes = /* @__PURE__ */ new Map();
  for (const card of historicalCards(agent)) {
    if (card.task_id !== taskId || card.status === "login_required") continue;
    const base = typeof card.base_url === "string" ? card.base_url : projectSite(card.project_url);
    if (!base) continue;
    const route = routes.get(base) ?? {};
    if (typeof card.project_id === "string") route.projectId ??= card.project_id;
    if (typeof card.previous_task_id === "string") route.previousTaskId ??= card.previous_task_id;
    routes.set(base, route);
  }
  return routes;
}
function historicalLoginSite(agent) {
  for (const { status, base_url } of historicalCards(agent)) {
    if ((status === "login_pending" || status === "login_required") && typeof base_url === "string" && base_url) {
      return base_url;
    }
  }
}
function previewSite(configs, projectUrl, embedBaseUrl) {
  if (projectUrl) {
    const project = URL.canParse(projectUrl) ? new URL(projectUrl) : void 0;
    if (!project || project.username || project.password || !/^\/agent\/project_[a-z0-9]+(?:\/|$)/i.test(project.pathname)) {
      return void 0;
    }
    const matchingSites2 = configs.filter((config) => URL.canParse(config.baseUrl) && new URL(config.baseUrl).origin === project.origin);
    return matchingSites2.find((config) => config.embedBaseUrl === embedBaseUrl) ?? matchingSites2[0];
  }
  const matchingSites = configs.filter((config) => config.embedBaseUrl === embedBaseUrl || config.legacyEmbedBaseUrl === embedBaseUrl);
  return new Set(matchingSites.map((config) => config.baseUrl)).size === 1 ? matchingSites[0] : void 0;
}
function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
function browserLoginCallback(root) {
  if (!root || !URL.canParse(root)) return;
  const url = new URL(root);
  if (!url.hostname || url.username || url.password || ["0.0.0.0", "[::]"].includes(url.hostname)) return;
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol === "https:" || url.protocol === "http:" && loopback) {
    return new URL(CHESO_CALLBACK_PATH, url);
  }
}
function apply(ctx, pluginConfig) {
  const configs = {
    configured: resolveSiteConfig(pluginConfig, "configured", ctx.credentials),
    global: resolveSiteConfig(pluginConfig, "global", ctx.credentials)
  };
  const currentConfig = () => configs[pluginConfig.site.get()];
  const previewConfigs = Object.values(configs);
  const configForSite = (baseUrl) => baseUrl === void 0 ? currentConfig() : previewConfigs.find((config) => config.baseUrl === baseUrl);
  const unknownSite = "\u8BE5\u7AD9\u70B9\u5DF2\u4E0D\u5728\u63D2\u4EF6\u914D\u7F6E\u4E2D\u3002\u8BF7\u68C0\u67E5\u7AD9\u70B9\u8BBE\u7F6E\u5E76\u91CD\u65B0\u53D1\u8D77\u8BF7\u6C42\u3002";
  const createRetries = /* @__PURE__ */ new WeakMap();
  const pendingTasks = /* @__PURE__ */ new Map();
  const recentTaskRoutes = /* @__PURE__ */ new Map();
  const routingKey = (config, id) => JSON.stringify([config.baseUrl, id]);
  const rememberTask = (id, { config, projectId, agentType, previousTaskId }) => {
    const key = routingKey(config, id);
    recentTaskRoutes.delete(key);
    recentTaskRoutes.set(key, { config, projectId, agentType, previousTaskId });
    if (recentTaskRoutes.size > 1024) recentTaskRoutes.delete(recentTaskRoutes.keys().next().value);
  };
  const routeTask = (id, site, agent) => {
    chesoId(id);
    const history = historicalTask(id, agent);
    const cachedSites = /* @__PURE__ */ new Set();
    for (const config2 of previewConfigs) {
      const key2 = routingKey(config2, id);
      if (pendingTasks.has(key2) || recentTaskRoutes.has(key2)) cachedSites.add(config2.baseUrl);
    }
    const knownSites = history.size ? new Set(history.keys()) : cachedSites;
    if (site && knownSites.size && !knownSites.has(site) && !cachedSites.has(site)) {
      throw new Error("\u6307\u5B9A\u7684 Cheso \u7AD9\u70B9\u4E0E\u539F\u4EFB\u52A1\u4E0D\u4E00\u81F4\u3002");
    }
    if (!site && knownSites.size > 1) throw new Error("\u591A\u4E2A Cheso \u7AD9\u70B9\u5B58\u5728\u76F8\u540C\u4EFB\u52A1 ID\uFF0C\u8BF7\u4F20\u5165\u539F\u4EFB\u52A1\u7ED3\u679C\u4E2D\u7684 base_url\u3002");
    const base = site || knownSites.values().next().value;
    const selected = currentConfig();
    const config = !base || selected.baseUrl === base ? selected : previewConfigs.find((candidate) => candidate.baseUrl === base);
    if (!config) throw new Error("\u539F\u4EFB\u52A1\u7684 Cheso \u7AD9\u70B9\u5DF2\u4E0D\u5728\u63D2\u4EF6\u914D\u7F6E\u4E2D\uFF0C\u8BF7\u6062\u590D\u539F\u7AD9\u70B9\u914D\u7F6E\u540E\u91CD\u8BD5\u3002");
    const key = routingKey(config, id);
    const remembered = recentTaskRoutes.get(key);
    const saved = history.get(config.baseUrl);
    return pendingTasks.get(key) ?? {
      config: remembered?.config ?? config,
      projectId: remembered?.projectId ?? saved?.projectId,
      previousTaskId: remembered?.previousTaskId ?? saved?.previousTaskId,
      agentType: remembered?.agentType
    };
  };
  const waitQuestionActivity = /* @__PURE__ */ new Map();
  const receiptsByExecution = /* @__PURE__ */ new WeakMap();
  ctx.on("tools/execute", async (exec, next) => {
    if (exec.name !== "cheso_wait") return next();
    const result = await next();
    const receipts = receiptsByExecution.get(exec);
    if (!result.isError || !receipts?.length) return result;
    const meta = result.meta;
    return {
      ...result,
      meta: {
        ...meta && typeof meta === "object" && !Array.isArray(meta) ? meta : {},
        cheso_question_receipts: receipts
      }
    };
  }, { global: true });
  const loginCallback = () => {
    const webServer = ctx.get("webServer");
    if (!webServer) return;
    try {
      return browserLoginCallback(ctx.get("webApp")?.getAdvertisedUrl() ?? webServer.getOrigin());
    } catch {
    }
  };
  const login = async (config, signal) => {
    if (config.api.usesFixedToken) {
      await config.api.whoami(signal);
      return { status: "signed_in", base_url: config.baseUrl };
    }
    const redirectUri = loginCallback()?.href;
    return { status: "login_pending", base_url: config.baseUrl, ...await config.api.auth.start(signal, redirectUri) };
  };
  const checkLogin = async (config, signal) => {
    try {
      if (!config.api.usesFixedToken && !await config.api.auth.wait(4e3, signal)) {
        return { status: "waiting", base_url: config.baseUrl };
      }
      await config.api.whoami(AbortSignal.any([signal, AbortSignal.timeout(5e3)]));
      return { status: "signed_in", base_url: config.baseUrl };
    } catch (error) {
      if (!(error instanceof LoginRequired)) throw error;
      return { status: "login_required", base_url: config.baseUrl };
    }
  };
  ctx.inject(["systemPrompt"], (promptCtx) => {
    promptCtx.effect(() => promptCtx.systemPrompt.section({
      name: "cheso:plugin-routing",
      order: promptCtx.systemPrompt.getSectionOrder("TOOLS_SDK"),
      text: "For Cheso requests in DSH, use only the native dsh-cheso-design cheso_* tools. The catalog entry named cheso is a separate CLI workflow: do not load it or run Cheso shell commands, even if that skill was loaded earlier. The two integrations have separate sign-ins. Start deliverable requests with cheso_create, without a login preflight. If a tool returns login_required, direct the user to its DSH login card. Use cheso_login for an explicit sign-in request, cheso_login_wait with the authorization card base_url after the user authorizes, and cheso_whoami when asked about the account. If the plugin does not support an action, direct the user to Cheso. After the user completes OAuth and asks to continue a blocked creation, call cheso_create with the retry_call_id from that creation result. It reuses the original request, attachments, and site; do not compose a new request. If a fixed API token was rejected, tell the user to update or remove it in their DSH configuration or startup environment. When creating or revising a deliverable in a named project, call cheso_create directly with project_id. Copy the user\u2019s original task wording into cheso_create.prompt verbatim, including their priorities. For files the user asks Cheso to use, pass the attachment names or exact paths in cheso_create.files. Include earlier user-provided or user-approved text only when the user explicitly refers to it. Do not rewrite, expand, or add an audience, language, style, outline, output format, or other requirements. Leave unspecified choices to Cheso. Use cheso_project_files with show_card: true when the user asks to see the project files or artifacts. Leave show_card unset when checking project files for your own context. After creation, use one cheso_wait call at a time and continue with the existing task if it is still running. When waiting, stopping, or following up on a task, pass the original result base_url as task_site when available. Treat terminated (including hard_stopped) as final. Briefly report the stop and any artifacts confirmed by the task result. Do not list project files, wait again, or resubmit the stopped task. If the user asks to stop a Cheso task, call cheso_stop with the task ID from this conversation. When cheso_wait yields to a stop request, handle it with cheso_stop and report the returned status. When cheso_wait yields to a new user message, address that message first. To pass a correction or extra instructions for the active Cheso task, call cheso_create with follow_up_task_id set to that task ID and prompt set to the user\u2019s exact message. Wait on the returned task ID. If no task ID is returned for the follow-up, tell the user the result and link to the Cheso project without resubmitting. Use cheso_wait to handle every Cheso question, including follow-ups and confirmations of a revised outline. The plugin shows the original questions and submits the user\u2019s answers or explicit skips directly. If Cheso closes the question itself, the plugin resumes waiting. Do not recreate Cheso questions with another tool, answer or skip on the user\u2019s behalf, or treat a previous answer as approval of a later question. If cheso_wait returns interact, end the turn and direct the user to the Cheso project to answer. Do not retry until the user says they have answered or skipped there. When cheso_wait returns completed with artifacts, deliver the online result through its card and the Open in Cheso link. Do not query the same project again for delivery, download artifacts to the workspace, or look for local copies. Let DSH Host handle Cheso credentials. Do not read credential files or extract tokens. Only perform format conversion when the user explicitly asks to convert or export. A request to make a PPT alone does not authorize a separate export."
    }), "cheso: plugin routing");
  });
  ctx.inject(["webServer"], (webCtx) => {
    async function handleCallback(request, response) {
      const headers = { "cache-control": "no-store", "referrer-policy": "no-referrer" };
      if (request.method !== "GET") {
        response.writeHead(405, headers).end();
        return;
      }
      const query = new URL(request.url ?? "/", "http://localhost").searchParams;
      if (!["code", "error", "state"].some((key) => query.has(key))) {
        response.writeHead(404, headers).end();
        return;
      }
      const issuers = query.getAll("iss");
      const issuer = issuers.length === 1 ? issuers[0].replace(/\/+$/, "") : void 0;
      const config = previewConfigs.find((config2) => config2.baseUrl === issuer);
      const base = `${(config ?? currentConfig()).baseUrl}/`;
      const resultPath = "oauth/callback-result";
      if (!URL.canParse(resultPath, base)) {
        response.writeHead(400, headers).end();
        return;
      }
      const location = new URL(resultPath, base);
      if (!["http:", "https:"].includes(location.protocol) || location.username || location.password) {
        response.writeHead(400, headers).end();
        return;
      }
      const result = config ? await config.api.auth.completeBrowser(query).catch(() => "callback_error") : "issuer_mismatch";
      location.searchParams.set("status", result === "success" ? "success" : "failed");
      location.searchParams.set("client", "dsh_cheso");
      if (result !== "success") location.searchParams.set("reason", result);
      response.writeHead(303, { ...headers, location: location.href }).end();
    }
    webCtx.on("webserver/request", async (request, response, next) => {
      const callback = loginCallback();
      if (!callback || request.headers.host?.toLowerCase() !== callback.host || request.url?.split("?", 1)[0] !== callback.pathname) {
        await next();
        return;
      }
      await handleCallback(request, response);
    });
    webCtx.effect(() => webCtx.webServer.register({
      kind: "exact",
      path: `/${CHESO_CALLBACK_PATH}`,
      handler: handleCallback
    }), "cheso: OAuth callback");
  });
  ctx.tools.register(
    defineTool({
      name: "cheso_create",
      description: "\u7528 dsh-cheso-design \u521B\u5EFA\u6216\u4FEE\u6539\u6210\u54C1\uFF1APPT/\u6F14\u793A\u6587\u7A3F\u3001\u6D77\u62A5/\u56FE\u7247\u3001\u52A8\u6548\u89C6\u9891\u3001\u7F51\u9875\u3001\u62A5\u544A\u7B49\u3002\u76F4\u63A5\u8C03\u7528\u672C\u5DE5\u5177\u5F00\u59CB\u4EFB\u52A1\uFF0C\u7531 DSH \u68C0\u67E5\u6388\u6743\uFF1B\u4E0D\u9700\u8981\u5148\u68C0\u67E5\u767B\u5F55\u3002\u7528\u6237\u6307\u5B9A\u5DF2\u6709\u9879\u76EE\u7EE7\u7EED\u505A\u65F6\uFF0C\u5C06\u9879\u76EE ID \u6216\u5B8C\u6574\u94FE\u63A5\u586B\u5165 project_id\uFF0C\u76F4\u63A5\u8C03\u7528\u6B64\u5DE5\u5177\u3002\u7528\u6237\u66F4\u6B63\u6216\u8865\u5145\u5F53\u524D Cheso \u4EFB\u52A1\u7684\u9700\u6C42\u65F6\uFF0C\u4F20\u5165 follow_up_task_id\uFF0C\u628A\u6D88\u606F\u53D1\u5230\u8BE5\u4EFB\u52A1\u7684 Cheso \u5BF9\u8BDD\u3002\u53EA\u6709\u7528\u6237\u8981\u6C42\u67E5\u770B\u9879\u76EE\u6587\u4EF6\u6216\u4EFB\u52A1\u786E\u5B9E\u9700\u8981\u9009\u53D6\u67D0\u4E2A\u6587\u4EF6\u65F6\uFF0C\u624D\u8C03\u7528 cheso_project_files\u3002\u521B\u5EFA\u6210\u529F\u540E\u7528\u8FD4\u56DE\u7684 task_id \u8C03\u7528\u4E00\u6B21 cheso_wait \u7B49\u5F85\u7ED3\u679C\u3002\u4EFB\u52A1\u6309\u7528\u6237\u7684 Cheso \u8D26\u53F7\u4E0E\u79EF\u5206\u6267\u884C\u3002",
      parameters: {
        prompt: {
          type: "string",
          description: "\u65B0\u5EFA\u65F6\u5FC5\u987B\u9010\u5B57\u4F20\u5165\u7528\u6237\u7684\u4EFB\u52A1\u539F\u8BDD\u3002\u53EA\u5728\u7528\u6237\u660E\u786E\u5F15\u7528\u524D\u6587\u65F6\u9644\u4E0A\u7528\u6237\u63D0\u4F9B\u6216\u786E\u8BA4\u7684\u76F8\u5173\u539F\u6587\u3002\u4E0D\u8981\u6539\u5199\uFF0C\u4E5F\u4E0D\u8981\u8865\u5145\u53D7\u4F17\u3001\u8BED\u8A00\u3001\u98CE\u683C\u3001\u5927\u7EB2\u3001\u8F93\u51FA\u683C\u5F0F\u6216\u5176\u4ED6\u672A\u6307\u5B9A\u7684\u4FE1\u606F\u3002"
        },
        files: { type: "array", items: { type: "string" }, description: "\u7528\u6237\u6307\u5B9A\u7684\u53C2\u8003\u9644\u4EF6\u540D\u79F0\u6216\u8DEF\u5F84\u3002\u76F4\u63A5\u9644\u52A0\u5728\u5F53\u524D\u6D88\u606F\u4E2D\u7684\u6587\u4EF6\u53EF\u6309\u540D\u79F0\u5F15\u7528\uFF1B\u5176\u5B83\u672C\u5730\u6587\u4EF6\u9700\u8981\u7528\u6237\u786E\u8BA4\u4E0A\u4F20\u3002" },
        project_id: { type: "string", description: "\u7EE7\u7EED\u5728\u5DF2\u6709 Cheso \u9879\u76EE\u4E2D\u521B\u5EFA\u6216\u4FEE\u6539\u4EA7\u7269\u65F6\uFF0C\u4F20\u5165\u7528\u6237\u63D0\u4F9B\u7684\u9879\u76EE ID \u6216\u5B8C\u6574\u9879\u76EE\u94FE\u63A5\u3002" },
        follow_up_task_id: { type: "string", description: "\u7ED9 Cheso \u5BF9\u8BDD\u53D1\u9001\u66F4\u6B63\u6216\u8865\u5145\u6D88\u606F\u65F6\uFF0C\u4F20\u5165 cheso_create \u6216 cheso_wait \u8FD4\u56DE\u7684\u5F53\u524D\u4EFB\u52A1 ID\u3002" },
        task_site: { type: "string", description: "\u539F\u4EFB\u52A1\u6216\u6388\u6743\u5361\u4E2D\u7684 base_url\u3002\u7701\u7565\u65F6\uFF0C\u65B0\u8BF7\u6C42\u4F7F\u7528\u5F53\u524D\u7AD9\u70B9\u3002" },
        retry_call_id: { type: "string", description: "\u6388\u6743\u5B8C\u6210\u540E\u7EE7\u7EED\u521B\u5EFA\u65F6\uFF0C\u53EA\u4F20\u4E4B\u524D login_required \u7ED3\u679C\u7684 retry_call_id\uFF0C\u63D2\u4EF6\u4F1A\u6062\u590D\u539F\u8BF7\u6C42\u3002" },
        agent_type: { type: "string", description: "cheso\uFF08\u9ED8\u8BA4\uFF09\u6216 image_edit\u3002" }
      },
      output: {
        schema: artifactCardSchema,
        render: (_args, value) => renderCard(
          value,
          value.status === "login_required" ? DSH_LOGIN_REQUIRED : value.status === "insufficient_credits" ? "Cheso \u79EF\u5206\u4E0D\u8DB3" : `Cheso \u4EFB\u52A1 ${value.task_id ?? ""}\uFF1A${value.status ?? ""}`
        )
      },
      /** 检查积分、上传参考附件并创建任务，同时记住任务所属站点。 */
      async execute({ retry_call_id, task_site, ...input }, exec) {
        const session = exec.agent?.session;
        const retries = session && createRetries.get(session);
        const retry = retry_call_id ? retries?.get(retry_call_id) : void 0;
        if (retry_call_id && !retry) throw new Error("\u539F\u521B\u5EFA\u8BF7\u6C42\u5DF2\u4E0D\u53EF\u6062\u590D\u6216\u5DF2\u5904\u7406\uFF0C\u8BF7\u6838\u5BF9\u4EFB\u52A1\u72B6\u6001\uFF1B\u5982\u9700\u91CD\u65B0\u521B\u5EFA\uFF0C\u8BF7\u91CD\u65B0\u53D1\u9001\u9700\u6C42\u548C\u9644\u4EF6\u3002");
        if (retry?.inFlight) throw new Error("\u539F\u521B\u5EFA\u8BF7\u6C42\u6B63\u5728\u91CD\u8BD5\u3002");
        if (retry && (task_site !== void 0 && task_site !== retry.baseUrl || Object.entries(input).some(([key, value]) => value !== void 0 && JSON.stringify(value) !== JSON.stringify(retry.request[key])))) {
          throw new Error("\u91CD\u8BD5\u987B\u6CBF\u7528\u539F\u7AD9\u70B9\u548C\u539F\u8BF7\u6C42\u3002");
        }
        const request = retry?.request ?? input;
        const { prompt, files, project_id, follow_up_task_id, agent_type } = request;
        if (!prompt?.trim()) throw new Error("\u8BF7\u63D0\u4F9B\u4EFB\u52A1\u9700\u6C42\u3002");
        const site = retry?.baseUrl ?? task_site;
        const followedTask = follow_up_task_id ? routeTask(follow_up_task_id, site, exec.agent) : void 0;
        const config = followedTask?.config ?? configForSite(site);
        if (!config) throw new Error(unknownSite);
        const agentType = followedTask?.agentType || agent_type || void 0;
        const attachmentBlocks = retry?.attachmentBlocks ?? (files?.length ? userAttachmentBlocks(exec.agent) : []);
        const signal = exec.signal;
        let waitingForLogin = false;
        if (retry) retry.inFlight = true;
        try {
          let projectId = project_id ? projectIdFromReference(project_id, config.baseUrl) : void 0;
          let sessionId;
          if (follow_up_task_id) {
            const task = await config.api.request(
              `/api/v1/plans/${chesoId(follow_up_task_id)}`,
              { signal }
            );
            if (!task.project_id || !task.session_id) throw new Error("Cheso \u672A\u8FD4\u56DE\u539F\u4EFB\u52A1\u7684\u9879\u76EE\u6216\u5BF9\u8BDD ID\u3002");
            if (projectId && task.project_id !== projectId) {
              throw new Error("\u8865\u5145\u6D88\u606F\u5FC5\u987B\u53D1\u5230\u539F\u4EFB\u52A1\u6240\u5C5E\u7684 Cheso \u9879\u76EE\u3002");
            }
            projectId = task.project_id;
            sessionId = task.session_id;
          } else {
            const balance = await config.api.credits(signal).catch((error) => {
              signal?.throwIfAborted();
              if (error instanceof LoginRequired || error instanceof FixedTokenRejected) throw error;
              return void 0;
            });
            if (balance !== void 0 && balance <= 0) {
              return { status: "insufficient_credits", message: "Cheso \u79EF\u5206\u4E0D\u8DB3\u3002", embed_base_url: config.embedBaseUrl };
            }
          }
          const attachments = files?.length ? await uploadAttachments(ctx, config.api, files, sessionId ? void 0 : projectId, exec, attachmentBlocks) : [];
          let created = await config.api.request(
            "/api/v1/plans/create",
            {
              body: {
                prompt,
                project_id: projectId,
                agent_type: agentType,
                ...sessionId ? { session_id: sessionId, on_running: "queue" } : {},
                contexts: attachments.length ? attachments.map((file_id) => ({ file_id, category: "attachment" })) : void 0
              },
              signal,
              timeoutMs: 6e4
            }
          );
          if (created.queued && projectId) {
            const projectFields = { project_id: projectId, project_url: config.api.projectUrl(projectId) };
            const messageId = created.message?.message_id;
            if (!messageId) {
              return cardPayload({ ...projectFields, status: "queued", message: "Cheso \u5DF2\u63A5\u6536\u8865\u5145\u6D88\u606F\uFF0C\u53EF\u5728\u539F\u9879\u76EE\u67E5\u770B\u961F\u5217\u3002" }, config);
            }
            try {
              created = await config.api.request("/api/v1/messages/send_now", { body: { message_id: messageId }, signal });
            } catch (error) {
              signal?.throwIfAborted();
              const code = error instanceof ChesoApiError ? error.code : void 0;
              const queued = code !== void 0 && [2410, 2614, 2620, 2624, 3203, 3204].includes(code);
              const message = code === 2410 ? "\u8865\u5145\u6D88\u606F\u5DF2\u6392\u961F\u3002\u5F53\u524D Cheso \u6388\u6743\u672A\u5F00\u653E\u7ACB\u5373\u53D1\u9001\uFF0C\u53EF\u5728\u539F\u9879\u76EE\u5904\u7406\u3002" : queued ? "\u8865\u5145\u6D88\u606F\u5DF2\u6392\u961F\uFF0C\u53EF\u5728\u539F\u9879\u76EE\u67E5\u770B\u3002" : "Cheso \u5DF2\u63A5\u6536\u8865\u5145\u6D88\u606F\uFF0C\u6682\u672A\u786E\u8BA4\u7ACB\u5373\u53D1\u9001\u7ED3\u679C\u3002\u8BF7\u5728\u539F\u9879\u76EE\u67E5\u770B\u6D88\u606F\u72B6\u6001\u3002";
              return cardPayload({ ...projectFields, status: queued ? "queued" : "unknown", message }, config);
            }
            if (!created.plan_id) {
              return cardPayload({ ...projectFields, status: "unknown", message: "Cheso \u5DF2\u63A5\u6536\u8865\u5145\u6D88\u606F\uFF0C\u8BF7\u5728\u539F\u9879\u76EE\u67E5\u770B\u6D88\u606F\u72B6\u6001\u3002" }, config);
            }
          }
          if (!created.plan_id) throw new Error("Cheso \u672A\u8FD4\u56DE\u4EFB\u52A1 ID\u3002");
          const project = created.project_id || projectId;
          const previousTaskId = created.plan_status === "pending" ? followedTask?.previousTaskId ?? follow_up_task_id : void 0;
          const route = { config, projectId: project, agentType, previousTaskId };
          pendingTasks.set(routingKey(config, created.plan_id), route);
          rememberTask(created.plan_id, route);
          return cardPayload({
            task_id: created.plan_id,
            previous_task_id: previousTaskId,
            status: created.plan_status || "in_progress",
            project_id: project,
            project_url: project ? config.api.projectUrl(project) : void 0
          }, config);
        } catch (error) {
          if (error instanceof LoginRequired && session) {
            const retryId = retry_call_id ?? randomUUID2();
            const sessionRetries = retries ?? /* @__PURE__ */ new Map();
            sessionRetries.set(retryId, { request, baseUrl: config.baseUrl, attachmentBlocks });
            if (!retries) createRetries.set(session, sessionRetries);
            waitingForLogin = true;
            return { ...toolFailure(error, config), retry_call_id: retryId };
          }
          return toolFailure(error, config);
        } finally {
          if (retry_call_id && !waitingForLogin) retries?.delete(retry_call_id);
        }
      }
    })
  );
  ctx.tools.register(
    defineTool({
      name: "cheso_wait",
      description: "\u7B49\u5F85 Cheso \u4EFB\u52A1\u5B8C\u6210\u3002\u8FD4\u56DE running \u65F6\uFF0C\u7528\u540C\u4E00\u4E2A\u4EFB\u52A1 ID \u7EE7\u7EED\u7B49\u5F85\uFF0C\u540C\u4E00\u4EFB\u52A1\u4E00\u6B21\u53EA\u8C03\u7528\u4E00\u4E2A cheso_wait\u3002\u8FD4\u56DE terminated \u65F6\uFF0C\u76F4\u63A5\u603B\u7ED3\u505C\u6B62\u72B6\u6001\u548C\u4EFB\u52A1\u7ED3\u679C\u786E\u8BA4\u7684\u6210\u54C1\u3002\u6536\u5230\u7528\u6237\u63D2\u8BDD\u65F6\u63D0\u524D\u8FD4\u56DE\u3002\u7528\u6237\u8981\u6C42\u505C\u6B62\u4EFB\u52A1\u65F6\u8C03\u7528 cheso_stop\u3002\u7528\u6237\u66F4\u6B63\u6216\u8865\u5145\u4EFB\u52A1\u9700\u6C42\u65F6\uFF0C\u7528 cheso_create \u7684 follow_up_task_id \u628A\u6D88\u606F\u53D1\u5230\u539F\u5BF9\u8BDD\u3002\u6BCF\u8F6E\u63D0\u95EE\uFF08\u5305\u62EC\u8FFD\u95EE\u548C\u4FEE\u6539\u540E\u7684\u518D\u6B21\u786E\u8BA4\uFF09\u90FD\u7531\u672C\u5DE5\u5177\u5C55\u793A Cheso \u539F\u9898\u3002\u7528\u6237\u56DE\u7B54\u3001\u8DF3\u8FC7\u6216 Cheso \u7ED3\u675F\u63D0\u95EE\u540E\uFF0C\u7EE7\u7EED\u7B49\u5F85\u540C\u4E00\u4EFB\u52A1\u3002\u65E0\u9700\u53E6\u884C\u53D1\u8D77\u95EE\u7B54\u6216\u8F6C\u53D1\u7B54\u6848\u3002\u4E0D\u5F97\u4EE3\u7B54\u3001\u4EE3\u4E3A\u8DF3\u8FC7\uFF0C\u6216\u5C06\u5148\u524D\u7B54\u590D\u89C6\u4E3A\u5BF9\u65B0\u95EE\u9898\u7684\u786E\u8BA4\u3002\u5982\u679C\u8FD4\u56DE interact\uFF0C\u7ED3\u675F\u5F53\u524D\u56DE\u5408\uFF1B\u8BF7\u7528\u6237\u5230 Cheso \u9879\u76EE\u5904\u7406\uFF0C\u7B49\u7528\u6237\u786E\u8BA4\u540E\u518D\u7EE7\u7EED\u7B49\u5F85\u3002\u4EFB\u52A1\u5B8C\u6210\u540E\u8FD4\u56DE\u5728\u7EBF\u4EA7\u7269\u5361\u548C Cheso \u9879\u76EE\u94FE\u63A5\uFF0C\u76F4\u63A5\u7528\u5B83\u4EEC\u4EA4\u4ED8\u3002\u4EA7\u7269\u4FDD\u5B58\u5728 Cheso\u3002",
      parameters: {
        task_id: { type: "string", required: true, description: "cheso_create \u8FD4\u56DE\u7684 task_id\u3002" },
        task_site: { type: "string", description: "\u539F\u4EFB\u52A1\u7ED3\u679C\u4E2D\u7684 base_url\uFF08\u5982\u6709\uFF09\u3002" },
        timeout_sec: { type: "number", description: "\u6BCF\u6BB5\u8F6E\u8BE2\u7684\u7B49\u5F85\u4E0A\u9650\uFF0C\u4E0D\u542B\u7528\u6237\u56DE\u7B54\u65F6\u95F4\uFF0C\u9ED8\u8BA4\u4F7F\u7528\u63D2\u4EF6\u914D\u7F6E\u3002" }
      },
      output: {
        schema: waitCardSchema,
        presentationMeta: (_args, { question_receipts }) => question_receipts?.length ? { cheso_question_receipts: question_receipts } : null,
        render: (_args, { question_receipts: _receipts, ...value }) => {
          if (value.status === "terminated") {
            return renderCard(value, STOP_SUMMARY);
          }
          return renderCard(
            value,
            value.status === "login_required" ? DSH_LOGIN_REQUIRED : value.status === "insufficient_credits" ? "Cheso \u79EF\u5206\u4E0D\u8DB3" : `Cheso \u4EFB\u52A1 ${value.task_id ?? ""}\uFF1A${value.status ?? ""}`
          );
        }
      },
      /** 继续轮询原站点上的任务，处理每轮提问并保留已提交的答复记录。 */
      async execute({ task_id, task_site, timeout_sec }, exec) {
        let pending = routeTask(task_id, task_site, exec.agent);
        const { config } = pending;
        let current = task_id;
        const activity = { previews: null, receipts: [] };
        receiptsByExecution.set(exec, activity.receipts);
        if (exec.callId) waitQuestionActivity.set(exec.callId, activity);
        const receiptFields = () => activity.receipts.length ? { question_receipts: activity.receipts } : {};
        const steering = new AbortController();
        const waitSignal = exec.signal ? AbortSignal.any([exec.signal, steering.signal]) : steering.signal;
        const agent = exec.agent;
        const checkSteering = () => {
          if (agent?.inbox?.nextStep.some((message) => message.source.kind === "user")) steering.abort();
        };
        const offInbox = agent && ctx.on("agent/inbox/inserted", ({ agent: recipient }) => {
          if (recipient === agent) checkSteering();
        });
        try {
          checkSteering();
          const timeout = Math.min(Math.max(Number(timeout_sec) || config.timeoutSec, 10), 1800);
          for (; ; ) {
            const repliedQuestion = pending.repliedQuestion;
            const result = await waitForTask(config.api, current, timeout, pending.projectId, waitSignal, repliedQuestion, (id, activeId) => {
              current = id;
              pending = pendingTasks.get(routingKey(config, id)) ?? pending;
              if (activeId) pending.previousTaskId = activeId;
              rememberTask(id, pending);
            });
            if (result.status === "terminated") exec.signal?.throwIfAborted();
            else waitSignal.throwIfAborted();
            current = result.task_id;
            const routedTask = pendingTasks.get(routingKey(config, current));
            if (routedTask) pending = routedTask;
            pending.projectId = result.project_id ?? pending.projectId;
            rememberTask(task_id, pending);
            rememberTask(current, pending);
            if (result.done) {
              for (const [key, task] of pendingTasks) {
                if (task === pending || key === routingKey(config, task_id) || key === routingKey(config, current)) pendingTasks.delete(key);
              }
            } else {
              pendingTasks.set(routingKey(config, task_id), pending);
              pendingTasks.set(routingKey(config, current), pending);
              if (result.status === "running" && pending.repliedQuestion === repliedQuestion) {
                pending.repliedQuestion = result.repliedQuestion;
              }
            }
            if (result.status === "terminated") return await stoppedCard(result, config, exec.signal, receiptFields());
            const interaction = result.interaction;
            if (interaction && pending.repliedQuestion === interaction.key) continue;
            const userQuestions = interaction?.questions.length && !hasDuplicateQuestions(interaction.questions) && !pending.asking && exec.agent ? ctx.get("userQuestions") : void 0;
            if (interaction && userQuestions) {
              pending.asking = true;
              activity.previews = interaction.previews;
              try {
                const reply = await askWhileQuestionIsOpen(
                  config.api,
                  current,
                  interaction,
                  (questions, signal) => userQuestions.ask({ agent: exec.agent, questions, signal }),
                  waitSignal
                );
                waitSignal.throwIfAborted();
                if (reply === "closed") continue;
                if (reply) {
                  const submission = await replyToTask(config.api, current, interaction, reply, waitSignal, exec.signal);
                  if (submission !== "changed") pending.repliedQuestion = interaction.key;
                  if (typeof submission !== "string") activity.receipts.push(submission);
                  continue;
                }
              } finally {
                activity.previews = null;
                pending.asking = false;
              }
            }
            const message = result.status === "interact" ? [result.message, pending.asking ? "Cheso \u6B63\u5728\u7B49\u5F85\u7528\u6237\u5728 DSH \u95EE\u7B54\u5361\u4E2D\u64CD\u4F5C\u3002" : "Cheso \u6B63\u5728\u7B49\u5F85\u4F60\u7684\u56DE\u590D\u3002\u8BF7\u6253\u5F00 Cheso \u9879\u76EE\uFF0C\u56DE\u7B54\u6216\u8DF3\u8FC7\u540E\u56DE\u5230\u8FD9\u91CC\u7EE7\u7EED\u3002"].filter(Boolean).join("\n") : result.message;
            return cardPayload({
              ...result,
              message,
              previous_task_id: pending.previousTaskId,
              project_url: result.project_id ? config.api.projectUrl(result.project_id) : void 0
            }, config, receiptFields());
          }
        } catch (error) {
          exec.signal?.throwIfAborted();
          if (steering.signal.aborted) {
            pendingTasks.set(routingKey(config, task_id), pending);
            pendingTasks.set(routingKey(config, current), pending);
            return cardPayload({
              task_id: current,
              status: "running",
              project_id: pending.projectId,
              previous_task_id: pending.previousTaskId,
              project_url: pending.projectId ? config.api.projectUrl(pending.projectId) : void 0,
              message: "\u5DF2\u7ED3\u675F\u672C\u6B21\u7B49\u5F85\u4EE5\u5904\u7406\u7528\u6237\u63D2\u8BDD\u3002\u8BF7\u5148\u5904\u7406\u65B0\u6D88\u606F\u3002"
            }, config, receiptFields());
          }
          return { ...toolFailure(error, config, current), ...receiptFields() };
        } finally {
          offInbox?.();
          if (exec.callId) waitQuestionActivity.delete(exec.callId);
        }
      }
    })
  );
  ctx.tools.register(
    defineTool({
      name: "cheso_stop",
      description: "\u7528\u6237\u8981\u6C42\u505C\u6B62 Cheso \u4EFB\u52A1\u65F6\uFF0C\u7EC8\u6B62\u8BE5\u4EFB\u52A1\u6240\u5728\u7684\u6267\u884C\u94FE\u3002\u786E\u8BA4\u7EC8\u6B62\u540E\u8FD4\u56DE\u505C\u6B62\u72B6\u6001\u53CA\u4EFB\u52A1\u7ED3\u679C\u4E2D\u7684\u6210\u54C1\u3002\u8FD4\u56DE stopping \u8868\u793A\u5DF2\u53D1\u51FA\u505C\u6B62\u8BF7\u6C42\u3002",
      parameters: {
        task_id: { type: "string", required: true, description: "\u8981\u505C\u6B62\u7684 Cheso \u4EFB\u52A1 ID\uFF0C\u6765\u81EA cheso_create \u6216 cheso_wait\u3002" },
        task_site: { type: "string", description: "\u539F\u4EFB\u52A1\u7ED3\u679C\u4E2D\u7684 base_url\uFF08\u5982\u6709\uFF09\u3002" }
      },
      output: {
        schema: artifactCardSchema,
        render: (_args, value) => {
          const { task_id, status } = value;
          if (status === "terminated") return renderCard(value, STOP_SUMMARY);
          if (status === "login_required") return renderCard(value, DSH_LOGIN_REQUIRED);
          const messages = {
            stopping: "Cheso \u5DF2\u6536\u5230\u505C\u6B62\u8BF7\u6C42\uFF0C\u6B63\u5728\u7B49\u5F85\u4EFB\u52A1\u7ED3\u675F\u3002",
            completed: "Cheso \u4EFB\u52A1\u5DF2\u5B8C\u6210\u3002",
            failed: "Cheso \u4EFB\u52A1\u5DF2\u5931\u8D25\u3002",
            rolled_back: "Cheso \u4EFB\u52A1\u5DF2\u56DE\u6EDA\u3002",
            pending: "Cheso \u6B63\u5728\u4EA4\u63A5\u4EFB\u52A1\uFF0C\u5C1A\u672A\u786E\u8BA4\u505C\u6B62\u3002\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002"
          };
          return renderCard(value, `${messages[status ?? ""] ?? "\u8BF7\u68C0\u67E5 Cheso \u4EFB\u52A1\u72B6\u6001\u3002"} \u4EFB\u52A1 ID\uFF1A${task_id ?? ""}`);
        }
      },
      async execute({ task_id, task_site }, exec) {
        const task = routeTask(task_id, task_site, exec.agent);
        const { config } = task;
        try {
          const result = await stopTask(config.api, task_id, task.previousTaskId, exec.signal);
          rememberTask(result.task_id, task);
          if (result.status === "terminated") return await stoppedCard({ ...result, project_id: task.projectId }, config, exec.signal);
          return { task_id: result.task_id, status: result.status, base_url: config.baseUrl };
        } catch (error) {
          if (error instanceof LoginRequired) return toolFailure(error, config, task_id);
          if (error instanceof ChesoApiError && error.code === 2313) {
            throw new Error("\u53EA\u6709 Cheso \u4EFB\u52A1\u53D1\u8D77\u4EBA\u6216\u8BE5\u9879\u76EE\u7684\u6240\u6709\u8005\u53EF\u4EE5\u505C\u6B62\u4EFB\u52A1\u3002");
          }
          throw error;
        }
      }
    })
  );
  ctx.tools.register(
    defineTool({
      name: "cheso_project_files",
      description: "\u6309\u9879\u76EE ID \u6216\u5B8C\u6574\u94FE\u63A5\u53EA\u8BFB\u67E5\u8BE2\u9879\u76EE\u6587\u4EF6\uFF0C\u8FD4\u56DE\u7ED9\u6A21\u578B\u4F5C\u4E3A\u53C2\u8003\u3002\u7528\u6237\u8981\u6C42\u67E5\u770B\u9879\u76EE\u6587\u4EF6\u6216\u4EA7\u7269\u65F6\uFF0C\u5C06 show_card \u8BBE\u4E3A true\uFF0C\u663E\u793A\u53EF\u9884\u89C8\u7684\u4EA7\u7269\u5361\u3002\u5185\u90E8\u67E5\u627E\u6587\u4EF6\u65F6\u7701\u7565 show_card\u3002\u7528\u6237\u8981\u6C42\u5728\u6307\u5B9A\u9879\u76EE\u4E2D\u521B\u5EFA\u6216\u4FEE\u6539\u4EA7\u7269\u65F6\uFF0C\u76F4\u63A5\u8C03\u7528 cheso_create \u5E76\u4F20\u5165 project_id\u3002\u663E\u793A\u4EA7\u7269\u5361\u540E\uFF0C\u7528\u6237\u70B9\u51FB\u300C\u9884\u89C8\u300D\u6216\u300C\u6253\u5F00\u300D\u65F6\uFF0C\u63D2\u4EF6\u4F1A\u6309\u9700\u7533\u8BF7\u6587\u4EF6\u5730\u5740\u3002",
      parameters: {
        project: {
          type: "string",
          required: true,
          description: "\u7528\u6237\u63D0\u4F9B\u7684\u539F\u59CB project_id \u6216 Cheso \u9879\u76EE\u94FE\u63A5\u3002"
        },
        show_card: { type: "boolean", description: "\u7528\u6237\u8981\u6C42\u5C55\u793A\u9879\u76EE\u6587\u4EF6\u6216\u4EA7\u7269\u65F6\u4F20 true\u3002\u9ED8\u8BA4\u4EC5\u8FD4\u56DE\u5DE5\u5177\u6570\u636E\u3002" }
      },
      output: {
        schema: artifactCardSchema,
        render: ({ show_card }, value) => show_card === true ? renderCard(value, value.project_id ? `Cheso \u9879\u76EE\u4EA7\u7269\uFF1A${value.project_id}` : "Cheso \u9879\u76EE\u4EA7\u7269") : [{ type: "text", text: JSON.stringify(value) }]
      },
      /** 验证项目引用并读取项目文件，整理为工具和产物卡共用的数据。 */
      async execute({ project }, exec) {
        const config = currentConfig();
        const projectId = projectIdFromReference(project, config.baseUrl);
        try {
          const files = await config.api.projectFiles(projectId, exec.signal);
          return cardPayload({
            files,
            project_id: projectId,
            project_url: config.api.projectUrl(projectId),
            status: "completed"
          }, config);
        } catch (error) {
          return toolFailure(error, config);
        }
      }
    })
  );
  ctx.tools.register(
    defineTool({
      name: "cheso_login",
      description: "\u5F00\u59CB dsh-cheso-design \u767B\u5F55\u5E76\u663E\u793A\u6388\u6743\u5361\u3002\u62FF\u5230\u7ED3\u679C\u540E\u7ED3\u675F\u5F53\u524D\u56DE\u590D\uFF0C\u63D0\u793A\u7528\u6237\u70B9\u51FB\u300C\u53BB Cheso \u6388\u6743\u300D\uFF0C\u5982\u6709\u9A8C\u8BC1\u7801\u5219\u5728\u6388\u6743\u9875\u8F93\u5165\u3002\u7B49\u7528\u6237\u8BF4\u5DF2\u6388\u6743\u540E\uFF0C\u518D\u68C0\u67E5\u767B\u5F55\u6216\u91CD\u8BD5\u539F\u8BF7\u6C42\u3002",
      parameters: {},
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            status: { type: "string" },
            base_url: { type: "string" },
            verification_uri: { type: "string" },
            user_code: { type: "string" },
            expires_in: { type: "number" },
            expires_at: { type: "number" }
          }
        },
        render: (_args, value) => value.status === "signed_in" ? [{ type: "text", text: "Cheso \u5DF2\u767B\u5F55\u3002" }] : renderCard(value, "Cheso \u6388\u6743\u5361\u5DF2\u663E\u793A\u3002\u8BF7\u7528\u6237\u5728\u6D4F\u89C8\u5668\u5B8C\u6210\u6388\u6743\uFF0C\u7136\u540E\u56DE\u5230 DSH \u68C0\u67E5\u767B\u5F55\u3002\u7B49\u5F85\u7528\u6237\u56DE\u590D\u540E\u518D\u7EE7\u7EED\u3002")
      },
      /** 为当前站点发起授权，生成对话登录卡所需的数据。 */
      async execute(_args, exec) {
        return login(currentConfig(), exec.signal);
      }
    })
  );
  ctx.tools.register(
    defineTool({
      name: "cheso_login_wait",
      description: "\u7528\u6237\u786E\u8BA4\u5DF2\u5728\u6D4F\u89C8\u5668\u6388\u6743\u540E\uFF0C\u77ED\u6682\u68C0\u67E5\u767B\u5F55\u7ED3\u679C\u3002\u82E5\u4ECD\u5F85\u6388\u6743\uFF0C\u63D0\u793A\u7528\u6237\u5728\u6388\u6743\u5361\u4E2D\u5B8C\u6210\u64CD\u4F5C\u5E76\u7ED3\u675F\u56DE\u590D\u3002",
      parameters: {
        base_url: { type: "string", description: "\u672C\u6B21\u6388\u6743\u5361\u4E2D\u7684 base_url\u3002\u7701\u7565\u65F6\u4F7F\u7528\u5F53\u524D\u5BF9\u8BDD\u6700\u8FD1\u4E00\u5F20\u6388\u6743\u5361\u3002" },
        timeout_sec: { type: "number", description: "\u517C\u5BB9\u65E7\u8C03\u7528\uFF1B\u6B64\u5DE5\u5177\u53EA\u505A\u77ED\u6682\u68C0\u67E5\u3002" }
      },
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: { status: { type: "string" }, base_url: { type: "string" } }
        },
        render: (_args, value) => [{
          type: "text",
          text: value.status === "signed_in" ? "Cheso \u5DF2\u767B\u5F55\u3002" : "Cheso \u5C1A\u672A\u5B8C\u6210\u6388\u6743\uFF0C\u8BF7\u5728\u6388\u6743\u5361\u4E2D\u7EE7\u7EED\u64CD\u4F5C\u3002"
        }]
      },
      /** 在登录卡所属站点确认授权。 */
      async execute({ base_url }, exec) {
        const config = configForSite(base_url ?? historicalLoginSite(exec.agent));
        if (!config) throw new Error(unknownSite);
        return checkLogin(config, exec.signal);
      }
    })
  );
  ctx.tools.register(
    defineTool({
      name: "cheso_whoami",
      description: "\u67E5\u770B dsh-cheso-design \u63D2\u4EF6\u5F53\u524D\u7AD9\u70B9\u7684\u767B\u5F55\u8D26\u53F7\u4E0E\u79EF\u5206\u4F59\u989D\u3002\u7528\u6237\u8BE2\u95EE\u63D2\u4EF6\u662F\u5426\u767B\u5F55\u65F6\u76F4\u63A5\u8C03\u7528\u6B64\u5DE5\u5177\u3002",
      parameters: {},
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            signed_in: { type: "boolean" },
            account: { type: "string" },
            credits: { type: "number" }
          }
        },
        render: (_args, value) => [
          {
            type: "text",
            text: value.signed_in ? `Cheso \u5DF2\u767B\u5F55\uFF1A${value.account || "\u5F53\u524D\u8D26\u53F7"}${typeof value.credits === "number" ? `\uFF0C\u79EF\u5206 ${value.credits}` : ""}` : "Cheso \u672A\u767B\u5F55\u3002\u5728\u5BF9\u8BDD\u91CC\u8BF4\u300C\u4F7F\u7528 dsh-cheso-design \u767B\u5F55\u300D\u53EF\u83B7\u53D6\u6388\u6743\u5361\u3002"
          }
        ]
      },
      /** 查询当前站点的登录账号，并在积分接口可用时附上余额。 */
      async execute(_args, exec) {
        const config = currentConfig();
        const signal = exec.signal;
        try {
          const { user } = await config.api.whoami(signal);
          const username = user?.username?.trim();
          const userId = user?.user_id?.trim();
          const account = username && userId ? `${username} (${userId})` : username || userId || "";
          const credits = await config.api.credits(signal).catch((error) => {
            signal?.throwIfAborted();
            if (error instanceof LoginRequired || error instanceof FixedTokenRejected) throw error;
            return void 0;
          });
          return { signed_in: true, account, ...credits === void 0 ? {} : { credits } };
        } catch (error) {
          if (error instanceof LoginRequired) return { signed_in: false };
          throw error;
        }
      }
    })
  );
  ctx.tools.register(
    defineTool({
      name: "cheso_logout",
      description: "\u9000\u51FA dsh-cheso-design \u63D2\u4EF6\u5F53\u524D\u7AD9\u70B9\u7684\u767B\u5F55\uFF0C\u5E76\u53D6\u6D88\u672A\u5B8C\u6210\u7684\u767B\u5F55\u6D41\u7A0B\u3002\u7528\u6237\u8981\u6C42\u63D2\u4EF6\u9000\u51FA\u767B\u5F55\u65F6\u76F4\u63A5\u8C03\u7528\u6B64\u5DE5\u5177\u3002",
      parameters: {},
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: { status: { type: "string" }, base_url: { type: "string" }, revoked: { type: "boolean" } }
        },
        render: (_args, value) => [{
          type: "text",
          text: value.status === "already_signed_out" ? `dsh-cheso-design \u5728 ${value.base_url} \u672A\u767B\u5F55\u3002` : `\u5DF2\u9000\u51FA dsh-cheso-design \u5728 ${value.base_url} \u7684\u767B\u5F55\u3002${value.revoked === false ? "\u672C\u5730\u6388\u6743\u5DF2\u6E05\u9664\uFF0C\u670D\u52A1\u7AEF\u64A4\u9500\u672A\u5F97\u5230\u786E\u8BA4\u3002" : ""}`
        }]
      },
      /** 退出当前站点，并在结果中附上对应站点地址。 */
      async execute(_args, exec) {
        const config = currentConfig();
        return { ...await config.api.logout(exec.signal), base_url: config.baseUrl };
      }
    })
  );
  ctx.inject(["connection"], (connectionCtx) => {
    connectionCtx.connection.fetch.register({
      path: "/api/cheso/question-previews",
      methods: ["GET"],
      requestBody: "buffered",
      // `connection` 服务验证 DSH 所有者身份，预览 HTML 通过此接口单独返回。
      /** 按等待工具的调用 ID 返回当前提问预览和答复记录。 */
      async fetch(request) {
        const callId = new URL(request.url).searchParams.get("call_id");
        const activity = callId ? waitQuestionActivity.get(callId) : void 0;
        return jsonResponse(200, activity ?? { previews: null, receipts: [] });
      }
    });
    connectionCtx.connection.fetch.register({
      path: "/api/cheso/site-options",
      methods: ["GET"],
      requestBody: "buffered",
      /** 提供设置页需要的站点信息，并标明启动配置是否锁定了表单。 */
      async fetch() {
        const entry = ctx.fiber?.entry?.options;
        const overlays = ctx.get("profileContext")?.overlays ?? [];
        const lockedByStartupConfig = entry !== void 0 && overlays.some((patch) => patch.insert ? includesStartupEntry(patch.insert, entry.id) : patch.id === entry.id && (!patch.name || patch.name === entry.name) && Object.hasOwn(patch, "config"));
        const { baseUrl, embedBaseUrl } = configs.configured;
        const base = URL.canParse(baseUrl) ? new URL(baseUrl) : void 0;
        const preview = URL.canParse(embedBaseUrl) ? new URL(embedBaseUrl) : void 0;
        const global = new URL(CHESO_SITES.global).href;
        return jsonResponse(200, {
          configuredHost: base?.host,
          previewHost: preview?.host,
          configuredIsGlobal: base?.href === global && preview?.href === global,
          lockedByStartupConfig
        });
      }
    });
    connectionCtx.connection.fetch.register({
      path: "/api/cheso/login",
      methods: ["POST"],
      requestBody: "buffered",
      // `connection` 服务验证 DSH 所有者身份，仅允许使用已配置站点的凭据记录。
      /** 为当前站点或登录卡所属站点发起授权或检查授权状态。 */
      async fetch(request) {
        if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
          return jsonResponse(415, { error: "\u8BF7\u4ECE DSH \u767B\u5F55\u5361\u53D1\u8D77\u6388\u6743\u3002" });
        }
        const data = await request.json().catch(() => null);
        if (data?.action !== "start" && data?.action !== "check") return jsonResponse(400, { error: "\u65E0\u6548\u7684\u767B\u5F55\u64CD\u4F5C\u3002" });
        const config = configForSite(data.site);
        if (!config) return jsonResponse(400, {
          code: "unknown_cheso_site",
          error: unknownSite
        });
        try {
          return jsonResponse(200, await (data.action === "start" ? login : checkLogin)(config, request.signal));
        } catch (error) {
          if (error instanceof FixedTokenRejected) {
            return jsonResponse(401, { code: error.code, error: error.message });
          }
          return jsonResponse(502, {
            ...error instanceof LoginAttemptError ? { code: error.code } : {},
            error: error instanceof Error ? error.message : "\u65E0\u6CD5\u8FDE\u63A5 Cheso \u6388\u6743\u670D\u52A1\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002"
          });
        }
      }
    });
    connectionCtx.connection.fetch.register({
      path: "/api/cheso/preview",
      methods: ["GET"],
      requestBody: "buffered",
      // DSH 在执行此处理器前验证所有者身份，Cheso 验证所请求文件的访问权限。
      /** 按文件 ID 和可选版本签发只读预览会话并返回内嵌页地址。 */
      async fetch(request) {
        const query = new URL(request.url).searchParams;
        if (query.has("document")) return jsonResponse(410, { error: "preview_client_outdated" });
        const config = previewSite(previewConfigs, query.get("project_url"), query.get("embed_base_url"));
        if (!config) return jsonResponse(400, { error: "unknown_cheso_site" });
        const fileId = query.get("file_id");
        const versionRaw = query.get("version");
        if (!fileId || fileId === "." || fileId === "..") return jsonResponse(400, { error: "file_id_required" });
        const requestOptions = { signal: request.signal, devSet: config.devSet };
        let data;
        try {
          const requestedVersion = Number(versionRaw);
          const version = Number.isSafeInteger(requestedVersion) && requestedVersion > 0 ? requestedVersion : void 0;
          data = await config.api.previewSession(fileId, { ...requestOptions, version });
        } catch (error) {
          if (error instanceof FixedTokenRejected) return jsonResponse(401, { error: error.code });
          if (error instanceof LoginRequired) return jsonResponse(401, { error: "cheso_login_required" });
          if (error instanceof ChesoApiError && error.status === 403) return jsonResponse(403, { error: "cheso_file_forbidden" });
          return jsonResponse(502, { error: "preview_session_failed" });
        }
        if (!data?.preview_session || !Number.isSafeInteger(data.version) || data.version < 1) {
          return jsonResponse(502, { error: "missing_preview_session" });
        }
        return jsonResponse(200, {
          preview_session: data.preview_session,
          version: data.version,
          expires_at: data.expires_at,
          embed_url: `${config.embedBaseUrl}/embed/preview`
        });
      }
    });
  });
}
export {
  Config,
  apply,
  inject,
  name
};
//# sourceMappingURL=index.js.map
