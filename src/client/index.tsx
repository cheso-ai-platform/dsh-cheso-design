/**
 * Cheso × DeepSeek Harness 客户端。
 *
 * 1. 工具卡显示任务状态，回合末尾从会话记录恢复产物卡。
 * 2. 侧栏预览标签页内嵌 `/embed/preview`，使用和 ChatGPT 卡片相同的 `postMessage` 协议握手。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { isEmbedFormat } from '../embed-format';
import type { QuestionReceipt } from '../tasks';
import { FileIcon } from './file-icon';
import { dictionaries, localeNamespace, type MessageKey, type MessageParams, type Translate, type TranslatedProps } from './i18n';
import { authorizationUrl } from './login';
import { QuestionPreviews, useQuestionActivity } from './question-previews';
import { ChesoSettings, type SettingsForm } from './site-settings';

export const inject = ['slots', 'locale', 'configForms', 'sidebarRight', 'sidebarRightTabs', 'uiConversation'];

const TAB_ID = 'dsh-cheso-design-preview';
const TAB_KIND = 'cheso-preview';
const RESOURCE_PREFIX = 'dsh-resource://cheso-file/';
const PREVIEW_STORAGE_PREFIX = 'dsh-cheso-design.preview.v1:';
const CARD_MARKER = '[cheso-card]';
const ARTIFACTS_TURN_KEY = 'dsh-cheso-design-artifacts';
const CARD_TOOLS = ['cheso_create', 'cheso_wait', 'cheso_project_files', 'cheso_login'];
const ACTIVE_TASK_STATUSES = new Set(['running', 'in_progress', 'pending', 'queued']);
const CARD_INLINE_PADDING = 14;
const ARTIFACT_ROW_HEIGHT = 38;
const MAX_VISIBLE_ARTIFACT_ROWS = 10;

interface Artifact {
  file_id?: string;
  name: string;
  path?: string;
  format: string;
  category?: string;
}

interface CardPayload {
  task_id?: string;
  status?: string;
  project_id?: string;
  project_url?: string;
  answer?: string;
  message?: string;
  artifacts?: Artifact[];
  embed_base_url?: string;
  base_url?: string;
  verification_uri?: string;
  user_code?: string;
  expires_at?: number;
}

/** 识别需要登录或正在等待授权的卡片状态。 */
function isLoginCard(payload: CardPayload) {
  return payload.status === 'login_required' || payload.status === 'login_pending';
}

interface ArtifactCardProps extends TranslatedProps {
  payload: CardPayload;
  openFile: (path: string) => void;
  openPreview: (artifact: Artifact, payload: CardPayload) => void;
}

type ArtifactRowProps = ArtifactCardProps & { artifact: Artifact };

/** 根据旧卡的相对路径推断目录并隐藏目录条目。 */
function hideLegacyDirectories(artifacts: Artifact[]): Artifact[] {
  // 旧卡的 `name` 和 `path` 都存项目相对路径，且省略了 `kind` 字段。
  const parents = new Set<string>();
  for (const { name, path } of artifacts) {
    if (path !== name) continue;
    const segments = name.split('/');
    segments.pop();
    while (segments.length) {
      parents.add(segments.join('/'));
      segments.pop();
    }
  }
  return artifacts.filter(({ name, path }) => path !== name || (!parents.has(name) && !name.endsWith('/')));
}

/** 从工具结果提取卡片 JSON，并过滤历史卡片中的目录条目。 */
function parseCard(block: any): CardPayload | null {
  const content = Array.isArray(block?.content) ? block.content : [];
  for (const part of content) {
    if (part?.type !== 'text' || typeof part.text !== 'string') continue;
    // 宿主端的 `renderCard` 在摘要后附加标记，从末尾查找可以跳过正文里的同名文本。
    const markerLine = part.text.lastIndexOf(`\n${CARD_MARKER}`);
    const index = markerLine >= 0 ? markerLine + 1 : part.text.startsWith(CARD_MARKER) ? 0 : -1;
    if (index < 0) continue;
    const raw = part.text.slice(index + CARD_MARKER.length).trim();
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.artifacts)) parsed.artifacts = hideLegacyDirectories(parsed.artifacts);
        return parsed as CardPayload;
      }
    } catch {
      return null;
    }
  }
  return null;
}

/** 优先读取结构化错误消息，缺失时用工具结果的文本作为错误详情。 */
function errorText(block: any): string {
  if (typeof block?.error?.message === 'string') return block.error.message;
  const content = Array.isArray(block?.content) ? block.content : [];
  const text = content
    .filter((part: any) => part?.type === 'text' && typeof part.text === 'string')
    .map((part: any) => part.text)
    .join('\n')
    .trim();
  return text;
}

const styles = {
  card: {
    border: '1px solid var(--dsh-border, rgba(127,127,127,.25))',
    borderRadius: 12,
    padding: `12px ${CARD_INLINE_PADDING}px`,
    margin: '8px 0',
    background: 'var(--dsh-surface, transparent)',
    fontSize: 13,
    lineHeight: 1.5,
  },
  head: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flex: 'none' },
  title: { fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' },
  status: { color: 'var(--dsh-text-secondary, #888)', fontSize: 12 },
  scrollableList: {
    maxHeight: ARTIFACT_ROW_HEIGHT * MAX_VISIBLE_ARTIFACT_ROWS,
    overflowY: 'auto',
    marginInlineEnd: -CARD_INLINE_PADDING,
    paddingInlineEnd: CARD_INLINE_PADDING,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: ARTIFACT_ROW_HEIGHT,
    boxSizing: 'border-box',
    borderTop: '1px solid var(--dsh-border, rgba(127,127,127,.15))',
  },
  name: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  resultBadge: {
    flex: 'none',
    whiteSpace: 'nowrap',
    fontSize: 11,
    fontWeight: 500,
    borderRadius: 4,
    padding: '2px 6px',
    background: 'rgba(59,130,246,.14)',
  },
  button: {
    border: '1px solid var(--dsh-border, rgba(127,127,127,.3))',
    background: 'transparent',
    color: 'inherit',
    borderRadius: 6,
    padding: '3px 8px',
    fontSize: 12,
    cursor: 'pointer',
    flex: 'none',
  },
  link: { color: 'inherit', textDecoration: 'underline', fontSize: 12, opacity: 0.8 },
  message: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  error: { color: '#dc2626', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  preview: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
    minHeight: 40,
    padding: '0 12px',
    borderBottom: '1px solid var(--dsh-border, rgba(127,127,127,.25))',
    fontSize: 13,
  },
  previewFileName: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 600,
  },
  previewBody: { flex: '1 1 0%', minHeight: 0, overflow: 'auto' },
} as const;

/** 从工具参数中判断是否显式请求展示项目文件卡。 */
function projectCardRequested(argsRaw: unknown): boolean {
  if (typeof argsRaw !== 'string') return false;
  try {
    return JSON.parse(argsRaw)?.show_card === true;
  } catch {
    return false;
  }
}

interface ChesoTurnLocation {
  status?: 'open' | 'closed' | 'unknown';
  data: { get: (key: string) => ChesoTurnState | undefined };
}

type UseChat = <T>(select: (snapshot: {
  timeline: { turns: ReadonlyMap<number, ChesoTurnLocation> };
}) => T) => T;

/** 在工具槽未提供会话订阅时，用空会话快照完成状态读取。 */
const noChat: UseChat = select => select({ timeline: { turns: new Map() } });

/** 从等待工具的原始参数中读取任务 ID，供进度卡查找项目链接。 */
function waitTaskId(argsRaw?: string): string | undefined {
  try {
    const taskId = JSON.parse(argsRaw ?? '{}')?.task_id;
    return typeof taskId === 'string' ? taskId : undefined;
  } catch {
    return undefined;
  }
}

/** 展示 Cheso 已接受的答复及跳过的题目。 */
function QuestionReceipts({ receipts, t }: TranslatedProps & { receipts?: QuestionReceipt[] }) {
  return receipts?.map(({ answers }, index) => (
    <div key={index} style={styles.card} data-tool="cheso-question-receipt">
      <div style={styles.head}>
        <span aria-hidden="true" style={{ ...styles.dot, background: '#16a34a' }} />
        <span style={styles.title}>{t(answers.some(({ values }) => values.length) ? 'questionAnswered' : 'questionSkipped')}</span>
      </div>
      <dl style={{ margin: 0 }}>
        {answers.map(({ label, values }, answerIndex) => (
          <div key={answerIndex} style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px', marginTop: 4 }}>
            <dt style={styles.status}>{label}</dt>
            <dd style={{ ...styles.message, margin: 0, minWidth: 0 }}>{values.length ? values.join(', ') : t('questionSkipped')}</dd>
          </div>
        ))}
      </dl>
    </div>
  )) ?? null;
}

/** 在等待工具运行时显示任务进度、提问预览、答复记录和项目链接。 */
function WaitProgress({ block, callId, useChat, t }: TranslatedProps & {
  block?: { turn?: number; argsRaw?: string };
  callId?: string;
  useChat: UseChat;
}) {
  const { previews, receipts } = useQuestionActivity(callId);
  const taskId = waitTaskId(block?.argsRaw);
  const turn = block?.turn;
  const projectUrl = useChat(snapshot => turn !== undefined && taskId
    ? snapshot.timeline.turns.get(turn)?.data.get(ARTIFACTS_TURN_KEY)?.cards.get(taskId)?.payload.project_url
    : undefined);
  return (
    <>
      <QuestionReceipts receipts={receipts} t={t} />
      <div style={styles.card} data-tool="cheso">
        <div style={styles.head}>
          <span style={styles.dot} />
          <span style={styles.title}>{t('task')}</span>
          <span style={styles.status}>{t(previews ? 'taskNeedsReply' : 'generating')}</span>
        </div>
        {previews ? <QuestionPreviews previews={previews} /> : null}
        {projectUrl ? <a href={projectUrl} target="_blank" rel="noreferrer" style={styles.link}>{t('openInCheso')}</a> : null}
      </div>
    </>
  );
}

/** 根据会话状态决定是否在工具结果区展示产物卡，避免与回合末尾重复。 */
function ToolResultArtifact({ payload, callId, openFile, openPreview, useChat, t }: ArtifactCardProps & {
  callId: string;
  useChat: UseChat;
}) {
  // 回合结束后由 turnTail 展示已收录的产物卡，工具结果区隐藏同一张卡。
  const visible = useChat(snapshot => {
    for (const turn of snapshot.timeline.turns.values()) {
      const state = turn.data.get(ARTIFACTS_TURN_KEY);
      if (!state?.callIds.has(callId)) continue;
      const card = state.cards.get(artifactCardKey(payload, callId));
      return !card || (card.callId === callId && turn.status !== 'closed');
    }
    return true;
  });
  return visible ? <ArtifactCard payload={payload} openFile={openFile} openPreview={openPreview} t={t} /> : null;
}

/** 为工具调用渲染主卡片，并附上等待工具持久化的答复记录。 */
function ToolCard(props: any) {
  const { phase, block, callId, toolName, t, useChat = noChat } = props;
  const receipts = toolName === 'cheso_wait' && phase === 'result' ? questionReceiptsOf(block?.meta) : undefined;
  return (
    <>
      {receipts ? <SettledQuestionReceipts receipts={receipts} callId={callId} useChat={useChat} t={t} /> : null}
      <ToolCardContent {...props} />
    </>
  );
}

/** 在答复记录尚未移到回合末尾时，将它们附在工具结果区。 */
function SettledQuestionReceipts({ receipts, callId, useChat, t }: TranslatedProps & {
  receipts: QuestionReceipt[];
  callId: string;
  useChat: UseChat;
}) {
  const shownInTurnTail = useChat(snapshot =>
    Array.from(snapshot.timeline.turns.values()).some(turn =>
      turn.status === 'closed' && turn.data.get(ARTIFACTS_TURN_KEY)?.receipts.has(callId)));
  return shownInTurnTail ? null : <QuestionReceipts receipts={receipts} t={t} />;
}

/** 按工具类型和调用阶段渲染 Cheso 进度、错误或结果卡。 */
function ToolCardContent(props: any) {
  const { phase, block, toolName, openFile, openPreview } = props;
  const t: Translate = props.t;
  const projectQuery = toolName === 'cheso_project_files';
  if (phase !== 'result') {
    // 创建主要负责返回任务 ID，生成进度由等待工具统一呈现。
    if (projectQuery || toolName === 'cheso_create') return null;
    if (toolName === 'cheso_wait') return phase === 'start' ? (
      <WaitProgress key={props.callId} block={block} callId={props.callId} useChat={props.useChat ?? noChat} t={t} />
    ) : null;
    return (
      <div style={styles.card} data-tool="cheso">
        <div style={styles.head}>
          <span style={styles.dot} />
          <span style={styles.title}>Cheso</span>
          <span style={styles.status}>{t(phase === 'preparing' ? 'preparing' : 'generating')}</span>
        </div>
      </div>
    );
  }
  if (block?.isError) {
    if (projectQuery && !projectCardRequested(block.call?.argsRaw)) return null;
    const detail = errorText(block);
    return (
      <div style={styles.card} data-tool="cheso">
        <div style={styles.head}>
          <span style={{ ...styles.dot, background: '#dc2626' }} />
          <span style={styles.title}>{t('toolFailed')}</span>
        </div>
        {detail ? <div style={styles.error}>{detail}</div> : null}
      </div>
    );
  }
  const payload = parseCard(block);
  if (!payload) {
    if (projectQuery) return null;
    return (
      <div style={styles.card} data-tool="cheso">
        <div style={styles.head}>
          <span style={styles.dot} />
          <span style={styles.title}>Cheso</span>
        </div>
      </div>
    );
  }
  if (payload.task_id && payload.status && ACTIVE_TASK_STATUSES.has(payload.status) && !payload.artifacts?.length) {
    return null;
  }
  if (!isLoginCard(payload) && (payload.artifacts?.length || isProjectListing(payload))) {
    return (
      <ToolResultArtifact payload={payload} openFile={openFile} openPreview={openPreview}
        callId={block.callId} useChat={props.useChat ?? noChat} t={t} />
    );
  }
  return <ArtifactCard payload={payload} openFile={openFile} openPreview={openPreview} t={t} />;
}

/** 展示指定站点的授权链接和设备码，并支持重新发起授权或检查结果。 */
function LoginCard({ payload, t }: TranslatedProps & { payload: CardPayload }) {
  const [challenge, setChallenge] = useState<CardPayload>();
  const [busy, setBusy] = useState<'start' | 'check'>();
  const [notice, setNotice] = useState<MessageKey>();
  const [error, setError] = useState<MessageKey>();
  const [signedIn, setSignedIn] = useState(false);
  const [expiredAt, setExpiredAt] = useState(0);
  // 用户从卡片重新发起登录时，以新授权链接和有效期覆盖历史工具结果。
  const login = challenge ?? payload;
  const site = login.base_url && URL.canParse(login.base_url) ? new URL(login.base_url).host : undefined;
  const expiresAt = login.expires_at ?? 0;
  const href = expiresAt > Math.max(expiredAt, Date.now()) ? authorizationUrl(login) : undefined;
  useEffect(() => {
    if (!href) return;
    const expiry = setTimeout(() => setExpiredAt(expiresAt), Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(expiry);
  }, [href, expiresAt]);

  /** 处理卡片所属站点的登录操作，并更新授权链接、过期时间或提示文案。 */
  async function act(action: 'start' | 'check') {
    setBusy(action);
    setError(undefined);
    setNotice(undefined);
    try {
      const response = await fetch('/api/cheso/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, site: login.base_url }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result) {
        switch (result?.code) {
          case 'unknown_cheso_site':
            setError('loginUnknownSite');
            break;
          case 'login_expired':
            setExpiredAt(expiresAt);
            break;
          case 'login_denied':
          case 'login_incomplete':
            setExpiredAt(expiresAt);
            setError(result.code === 'login_denied' ? 'loginDenied' : 'loginIncomplete');
            break;
          default:
            setError('loginFailed');
        }
        return;
      }
      if (result.status === 'login_pending' && authorizationUrl(result)) {
        setChallenge(result);
      } else if (result.status === 'signed_in') {
        setSignedIn(true);
      } else if (result.status === 'waiting') {
        setNotice('loginWaiting');
      } else if (result.status === 'login_required') {
        setNotice('loginNotStarted');
        setExpiredAt(expiresAt);
      } else {
        setError('loginInvalidLink');
      }
    } catch {
      setError('loginFailed');
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <div style={styles.card} data-tool="cheso-login">
      <div style={styles.head}>
        <span style={styles.dot} />
        <span style={styles.title}>{t('loginTitle')}</span>
        {site ? <span style={styles.status}>{site}</span> : null}
      </div>
      {signedIn ? (
        <div role="status">{t('loginSignedIn')}</div>
      ) : (
        <>
          {!(error && !href) ? <div>{t(href ? 'loginInstructions' : expiresAt ? 'loginExpired' : 'loginRequired')}</div> : null}
          {href && login.user_code ? <div>{t('loginEnterCode')} <code>{login.user_code}</code></div> : null}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {href ? (
              <>
                <a href={href} target="_blank" rel="noopener noreferrer" style={{ ...styles.button, textDecoration: 'none' }}>{t('loginAuthorize')}</a>
                <button type="button" style={styles.button} disabled={!!busy} onClick={() => void act('check')}>
                  {t(busy === 'check' ? 'loginChecking' : 'loginCheck')}
                </button>
              </>
            ) : (
              <button type="button" style={styles.button} disabled={!!busy} onClick={() => void act('start')}>
                {t(busy === 'start' ? 'loginGettingLink' : expiresAt ? 'loginGetNewLink' : 'loginGetLink')}
              </button>
            )}
          </div>
          {notice ? <div role="status" style={{ marginTop: 6 }}>{t(notice)}</div> : null}
          {error ? <div role="alert" style={{ ...styles.error, marginTop: 6 }}>{t(error)}</div> : null}
        </>
      )}
    </div>
  );
}

/** 渲染任务状态、文件列表与项目入口，登录状态交由授权卡展示。 */
function ArtifactCard({ payload, openFile, openPreview, t }: ArtifactCardProps) {
  if (isLoginCard(payload)) return <LoginCard payload={payload} t={t} />;
  const status = payload.status ?? 'running';
  const artifacts = payload.artifacts ?? [];
  const scrollable = artifacts.length > MAX_VISIBLE_ARTIFACT_ROWS;
  return (
    <div style={styles.card} data-tool="cheso" data-status={status}>
      <div style={styles.head}>
        <span style={{ ...styles.dot, background: status === 'failed' ? '#dc2626' : '#3b82f6' }} />
        <span style={styles.title}>{payload.project_url ? t('artifacts') : payload.task_id ? t('taskId', { id: payload.task_id }) : t('task')}</span>
        <span style={styles.status}>{statusLabel(t, status, artifacts.length)}</span>
      </div>
      {payload.message && status !== 'insufficient_credits' ? (
        <div style={status === 'interact' || status === 'queued' ? styles.message : styles.error}>{payload.message}</div>
      ) : null}
      {artifacts.length > 0 && (
        <div
          style={scrollable ? styles.scrollableList : undefined}
          tabIndex={scrollable ? 0 : undefined}
          role={scrollable ? 'region' : undefined}
          aria-label={scrollable ? t('fileList') : undefined}
        >
          {artifacts.map((artifact, index) => (
            <ArtifactRow
              key={`${artifact.file_id ?? artifact.name}-${index}`}
              artifact={artifact}
              payload={payload}
              openFile={openFile}
              openPreview={openPreview}
              t={t}
            />
          ))}
        </div>
      )}
      {payload.project_url ? (
        <div style={{ marginTop: 6 }}>
          <a href={payload.project_url} target="_blank" rel="noreferrer" style={styles.link}>
            {t('openInCheso')}
          </a>
        </div>
      ) : null}
    </div>
  );
}

/** 将任务状态转换为本地化文案，完成时附上文件数量。 */
function statusLabel(t: Translate, status: string, count: number): string {
  if (status === 'queued') return t('taskQueued');
  if (ACTIVE_TASK_STATUSES.has(status)) return t('taskRunning');
  switch (status) {
    case 'completed': return t('taskCompleted', { count });
    case 'insufficient_credits': return t('lowCredits');
    case 'failed': return t('taskFailed');
    case 'terminated': return t('taskStopped');
    case 'rolled_back': return t('taskRolledBack');
    case 'interact': return t('taskNeedsReply');
    case 'unknown': return t('taskUnknown');
    default: return status;
  }
}

/** 为单个文件选择可用操作，包括内嵌预览、在 Cheso 打开和打开本地文件。 */
function ArtifactRow({ artifact, payload, openFile, openPreview, t }: ArtifactRowProps) {
  const [previewError, setPreviewError] = useState(false);
  const { file_id: fileId, format, path } = artifact;
  const canPreview = fileId && (payload.project_url || payload.embed_base_url)
    && isEmbedFormat(format);
  const fileUrl = fileId ? chesoFileUrl(payload.project_url, fileId) : undefined;
  const localPath = path && /^(?:\/|[A-Za-z]:[\\/]|\\\\)/.test(path) ? path : undefined;
  /** 打开侧栏预览，捕获打开失败并在文件行下方显示提示。 */
  const handlePreview = () => {
    try {
      openPreview(artifact, payload);
      setPreviewError(false);
    } catch {
      setPreviewError(true);
    }
  };
  return (
    <>
      <div style={styles.row}>
        <FileIcon format={format} />
        <span style={styles.name} title={artifact.path ?? artifact.name}>
          {artifact.name}
        </span>
        {artifact.category === 'result' ? <span style={styles.resultBadge}>{t('resultBadge')}</span> : null}
        {canPreview ? (
          <button type="button" style={styles.button} onClick={handlePreview}>
            {t('preview')}
          </button>
        ) : fileUrl ? (
          <a href={fileUrl} target="_blank" rel="noreferrer" style={{ ...styles.button, textDecoration: 'none' }}>
            {t('openInCheso')}
          </a>
        ) : localPath ? (
          <button type="button" style={styles.button} onClick={() => openFile(localPath)}>
            {t('open')}
          </button>
        ) : null}
      </div>
      {previewError ? <div role="alert" style={styles.error}>{t('previewOpenFailed')}</div> : null}
    </>
  );
}

interface ChesoTurnState {
  callIds: ReadonlySet<string>;
  cards: ReadonlyMap<string, { callId: string; payload: CardPayload }>;
  receipts: ReadonlyMap<string, QuestionReceipt[]>;
}

/** 从工具元数据提取答复记录，校验每题的标签和答案格式。 */
function questionReceiptsOf(meta: unknown): QuestionReceipt[] | undefined {
  if (!meta || typeof meta !== 'object' || !('cheso_question_receipts' in meta)) return;
  const receipts = meta.cheso_question_receipts;
  if (Array.isArray(receipts) && receipts.length && receipts.every(receipt =>
    Array.isArray(receipt?.answers) && receipt.answers.every((answer: any) =>
      typeof answer?.label === 'string' && Array.isArray(answer.values)
      && answer.values.every((value: unknown) => typeof value === 'string'),
    ),
  )) return receipts;
}

/** 识别带项目 ID 且无任务 ID 的已完成文件查询。 */
function isProjectListing(payload: CardPayload): boolean {
  return payload.status === 'completed' && !!payload.project_id && !payload.task_id;
}

/** 为产物卡生成去重键，已完成的项目结果按项目链接和文件集合识别。 */
function artifactCardKey(payload: CardPayload, callId: string): string {
  if (payload.status === 'completed' && payload.project_url) {
    // 任务结果和项目文件列表可能包含同一批文件，排列顺序可能不同。
    const files = [...new Set(payload.artifacts?.map(file => file.file_id ?? file.name))].sort();
    return JSON.stringify([payload.project_url, files]);
  }
  return payload.task_id ?? payload.project_id ?? callId;
}

type ChesoEvent =
  | { type: 'tool/call'; data: { turn: number; callId: string; name: string } }
  | { type: 'tool/result'; surfaceOp?: unknown; data: {
      turn: number;
      meta?: unknown;
      message: { source: { callId: string }; isError?: boolean; content: readonly unknown[] };
    } }
  | { type: 'other' };

// 当前回合和 DSH 重放历史时都读取同一份已保存的工具结果。
const artifactTurnDefinition = {
  kind: ARTIFACTS_TURN_KEY,
  /** 识别需要纳入回合状态的工具调用或持久化结果。 */
  match(event: ChesoEvent) {
    if (event.type === 'tool/call' && CARD_TOOLS.includes(event.data.name)) {
      return { id: String(event.data.turn), role: 'start' };
    }
    if (event.type === 'tool/result' && event.surfaceOp === 'append'
      && (parseCard(event.data.message) || questionReceiptsOf(event.data.meta))) {
      return { id: String(event.data.turn), role: 'start' };
    }
    return null;
  },
  /** 初始化回合内的工具调用、卡片与答复记录。 */
  start(_context: unknown, { event }: { event: ChesoEvent }): ChesoTurnState {
    return {
      callIds: new Set(event.type === 'tool/call' ? [event.data.callId] : []),
      cards: new Map(),
      receipts: new Map(),
    };
  },
  /** 将工具事件归入当前回合，合并答复记录并对登录卡和产物卡去重。 */
  update({ state }: { state: ChesoTurnState }, { event }: { event: ChesoEvent }): ChesoTurnState {
    if (event.type === 'tool/call') {
      return { ...state, callIds: new Set([...state.callIds, event.data.callId]) };
    }
    if (event.type !== 'tool/result') return state;
    const { message } = event.data;
    if (!state.callIds.has(message.source.callId)) return state;
    const receipts = questionReceiptsOf(event.data.meta);
    if (receipts) state = { ...state, receipts: new Map(state.receipts).set(message.source.callId, receipts) };
    if (message.isError) return state;
    const payload = parseCard(message);
    if (!payload) return state;
    const callId = message.source.callId;
    const card = { callId, payload };
    const loginKey = `login:${payload.base_url ?? ''}`;
    if (isLoginCard(payload)) {
      // 同一站点已有授权链接时，后续的未登录结果不覆盖它。
      if (payload.status === 'login_required' && state.cards.get(loginKey)?.payload.status === 'login_pending') return state;
      return { ...state, cards: new Map(state.cards).set(loginKey, card) };
    }
    // 产物生成前先保留项目链接，供正在运行的等待工具展示。
    const isActiveTask = payload.task_id && payload.status && ACTIVE_TASK_STATUSES.has(payload.status);
    if (!payload.artifacts?.length && !isProjectListing(payload) && !(isActiveTask && payload.project_url)) return state;
    const key = artifactCardKey(payload, callId);
    if (payload.status === 'completed' && state.cards.get(key)?.payload.status === 'completed') return state;
    return { ...state, cards: new Map(state.cards).set(key, card) };
  },
  /** 将非空状态发布到回合位置，并复用未变化的视图数据。 */
  buildLocationData(
    { id, state }: { id: string; state?: ChesoTurnState },
    scope: string,
    previous: { value: ChesoTurnState } | null,
  ) {
    if (scope !== 'turn' || !state || (!state.cards.size && !state.receipts.size)) return null;
    if (previous?.value === state) return previous;
    return { kind: 'turn', turn: Number(id), key: ARTIFACTS_TURN_KEY, value: state };
  },
};

interface TurnArtifactsProps extends Omit<ArtifactCardProps, 'payload'> {
  turn: ChesoTurnLocation;
}

/** 在回合末尾显示已收录的卡片，并在回合结束后显示答复记录。 */
function TurnArtifacts({ turn, openFile, openPreview, t }: TurnArtifactsProps) {
  const state = turn.data.get(ARTIFACTS_TURN_KEY);
  if (!state) return null;
  const cards = Array.from(state.cards, ([key, { payload }]) => {
    if (payload.task_id && payload.status && ACTIVE_TASK_STATUSES.has(payload.status) && !payload.artifacts?.length) return null;
    return <ArtifactCard key={key} payload={payload} openFile={openFile} openPreview={openPreview} t={t} />;
  });
  return (
    <>
      {turn.status === 'closed' ? Array.from(state.receipts, ([key, receipts]) => (
        <QuestionReceipts key={key} receipts={receipts} t={t} />
      )) : null}
      {cards}
    </>
  );
}

type PreviewFileRef = { file_id: string } & Pick<CardPayload, 'embed_base_url' | 'project_url'>;
type PreviewParams = PreviewFileRef & Pick<Artifact, 'name' | 'format'>;
type PreviewTabProps = TranslatedProps & {
  useTabInfo: () => { tab: { navigation: { address: string; params?: PreviewParams; revision: number } } };
};

// DSH 会保存资源地址，页面重新加载时会创建新的导航记录。
function savedPreview(address: string): PreviewParams | undefined {
  try {
    const raw = localStorage.getItem(PREVIEW_STORAGE_PREFIX + address);
    if (!raw) return;
    const params: Partial<PreviewParams> | null = JSON.parse(raw);
    if (!params) return;
    const { file_id, name, format, project_url, embed_base_url } = params;
    if (typeof file_id !== 'string' || typeof name !== 'string' || typeof format !== 'string'
      || (project_url !== undefined && typeof project_url !== 'string')
      || (embed_base_url !== undefined && typeof embed_base_url !== 'string')) return;
    const siteUrl = project_url || embed_base_url;
    if (file_id && siteUrl && previewAddress(siteUrl, file_id) === address) {
      return { file_id, name, format, project_url, embed_base_url };
    }
  } catch {
    // 本地存储可能已被禁用，或者保存了无效的预览记录。
  }
}

function previewAddress(siteUrl: string, fileId: string): string {
  // 用站点和文件 ID 标识标签，同一来源的同一文件复用已打开的标签。
  const site = new URL(siteUrl).origin;
  return `${RESOURCE_PREFIX}${encodeURIComponent(site)}/${encodeURIComponent(fileId)}`;
}

interface PreviewContent {
  content_url: string;
  version?: number;
  expires_at?: string;
  embed_url: string;
}

class PreviewError extends Error {
  constructor(readonly key: MessageKey, readonly params?: MessageParams) {
    super(key);
  }
}

/** 向宿主端查询最新或指定版本的临时预览地址，并校验文件 URL。 */
async function requestContent(
  { file_id, project_url, embed_base_url }: PreviewFileRef,
  signal?: AbortSignal,
  version?: number,
): Promise<PreviewContent> {
  const query = new URLSearchParams({ file_id });
  if (version) query.set('version', String(version));
  if (project_url) query.set('project_url', project_url);
  if (embed_base_url) query.set('embed_base_url', embed_base_url);
  const response = await fetch(`/api/cheso/preview?${query.toString()}`, { signal, cache: 'no-store' });
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    // Cheso 未授权和 DSH 会话失效都可能返回 401，通过响应错误码区分。
    if (result?.error === 'cheso_login_required') throw new PreviewError('previewLoginRequired');
    if (result?.error === 'cheso_file_forbidden') throw new PreviewError('previewForbidden');
    if (result?.error === 'unknown_cheso_site') throw new PreviewError('previewUnknownSite');
    if (response.status === 401) throw new PreviewError('previewSessionExpired');
    throw new PreviewError('previewUrlRequestFailed', { status: response.status });
  }
  const data: PreviewContent = await response.json();
  const url = URL.canParse(data?.content_url) ? new URL(data.content_url) : undefined;
  if (!url || !['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new PreviewError('previewInvalidFileUrl');
  }
  return data;
}

/** 优先使用路径末尾的文件名，依次回退到文件 ID 和默认预览标题。 */
function previewFileName(t: Translate, params?: PreviewParams): string {
  return params?.name?.split(/[\\/]/).pop() || params?.file_id || t('previewTitle');
}

/** 从当前导航或本地保存的参数恢复预览标签标题。 */
function PreviewTitle({ useTabInfo, t }: PreviewTabProps) {
  const { tab } = useTabInfo();
  const { address, params } = tab.navigation;
  const fileName = previewFileName(t, params ?? savedPreview(address));
  return <span title={fileName}>{fileName}</span>;
}

/** 恢复预览参数并渲染文件预览及 Cheso 编辑入口。 */
function PreviewBody({ useTabInfo, t }: PreviewTabProps) {
  const { tab } = useTabInfo();
  const { address, revision } = tab.navigation;
  const params = tab.navigation.params ?? savedPreview(address);
  if (!params) return <div role="status" style={{ padding: 16 }}>{t('previewReopen')}</div>;
  const fileName = previewFileName(t, params);
  const fileUrl = chesoFileUrl(params.project_url, params.file_id);
  const content = isEmbedFormat(params.format)
    ? <ChesoPreviewFrame params={params} revision={revision} t={t} />
    : <div style={{ padding: 16 }}>{t('previewUnsupported')}</div>;
  return (
    <div style={styles.preview}>
      <header style={styles.previewHeader}>
        <span style={styles.previewFileName} title={params.name}>{fileName}</span>
        {fileUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            style={{ ...styles.button, color: 'inherit', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            {t('editInCheso')}
          </a>
        ) : null}
      </header>
      <div style={styles.previewBody}>{content}</div>
    </div>
  );
}

/** 从有效项目链接生成文件入口。指定文件时清除版本参数，以打开最新版本。 */
function chesoFileUrl(projectUrl: string | undefined, fileId: string | undefined): string | undefined {
  if (!projectUrl) return undefined;
  try {
    const url = new URL(projectUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return undefined;
    if (fileId) {
      url.searchParams.set('file', fileId);
      url.searchParams.delete('version');
    }
    return url.href;
  } catch {
    return undefined;
  }
}

/** 管理内嵌预览的握手、版本更新和临时地址续签。 */
function ChesoPreviewFrame({ params, revision, t }: TranslatedProps & { params: PreviewParams; revision: number }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const readyRef = useRef(false);
  // 临时文件地址留在内存，localStorage 只保存恢复标签所需的文件和站点信息。
  const contentRef = useRef<PreviewContent | null>(null);
  const [error, setError] = useState<PreviewError | string>();
  const [embedUrl, setEmbedUrl] = useState('');
  const embedOrigin = embedUrl ? new URL(embedUrl).origin : '';
  const { file_id, project_url, embed_base_url } = params;

  /** 记录当前 iframe，并在元素切换时重置就绪状态。 */
  const bindFrame = useCallback((frame: HTMLIFrameElement | null) => {
    iframeRef.current = frame;
    readyRef.current = false;
  }, []);

  /** 向已完成握手的 iframe 发送文件信息和临时访问地址。 */
  const sendLoad = useCallback(() => {
    // 文件地址和 iframe 就绪信号可能先后到达，两者都拿到后才发送加载消息。
    const frame = iframeRef.current;
    const content = contentRef.current;
    if (!frame?.contentWindow || !content || !readyRef.current) return;
    frame.contentWindow.postMessage(
      {
        type: 'cheso.preview.load',
        file: {
          file_id: params.file_id,
          version: content.version ?? 0,
          name: params.name ?? `${params.file_id}.${params.format}`,
          format: params.format,
        },
        content_url: content.content_url,
        expires_at: content.expires_at,
        ...(params.format === 'vppt' ? { vppt_layout: 'scroll' } : {}),
      },
      new URL(content.embed_url).origin,
    );
  }, [params.file_id, params.name, params.format]);

  /** 查询文件的预览信息，并验证内嵌页地址使用 HTTP 或 HTTPS。 */
  const fetchContent = useCallback(async (signal: AbortSignal, version?: number) => {
    const data = await requestContent({ file_id, project_url, embed_base_url }, signal, version);
    if (!URL.canParse(data.embed_url) || !/^https?:$/.test(new URL(data.embed_url).protocol)) {
      throw new PreviewError('previewInvalidEmbedUrl');
    }
    return data;
  }, [file_id, project_url, embed_base_url]);

  /** 保存预览信息。内嵌页地址变化时重载 iframe，同页的版本变化或续签通过消息通知。 */
  const updateContent = useCallback((data: PreviewContent, refreshExpired = false) => {
    const previous = contentRef.current;
    contentRef.current = data;
    if (previous?.embed_url !== data.embed_url) {
      setEmbedUrl(data.embed_url);
    } else if (refreshExpired || data.version === undefined || previous.version !== data.version) {
      // 重新打开文件时检查版本，版本相同时保留当前预览。
      sendLoad();
    }
  }, [sendLoad]);

  useEffect(() => {
    // DSH 每次打开同一资源都会更新导航版本号，触发最新版本查询。
    const controller = new AbortController();
    setError(undefined);
    fetchContent(controller.signal).then(
      (data) => { if (!controller.signal.aborted) updateContent(data); },
      (reason) => {
        if (!controller.signal.aborted) setError(reason instanceof PreviewError ? reason : new PreviewError('previewLoadFailed'));
      },
    );
    return () => controller.abort();
  }, [fetchContent, revision, updateContent]);

  useEffect(() => {
    if (!embedOrigin || error) return;
    const controller = new AbortController();
    let requesting = false;
    /** 给当前预览版本续签临时地址，合并同时到达的续签请求。 */
    const refresh = () => {
      if (requesting) return;
      requesting = true;
      const previous = contentRef.current;
      // 续签期间如果预览内容已更新，丢弃旧地址，避免覆盖新的预览。
      const stillCurrent = () => !controller.signal.aborted && previous === contentRef.current;
      fetchContent(controller.signal, previous?.version).then(
        (next) => { if (stillCurrent()) updateContent(next, true); },
        (reason) => { if (stillCurrent()) setError(reason instanceof PreviewError ? reason : new PreviewError('previewLoadFailed')); },
      ).finally(() => { requesting = false; });
    };
    // 浏览器拦截 iframe 时可能不向外层页面发出错误事件，所以用超时检测握手失败。
    const readyTimeout = readyRef.current ? undefined
      : setTimeout(() => setError(new PreviewError('previewTimedOut')), 10_000);
    /** 仅处理当前 iframe 和预览来源发来的就绪、过期或错误消息。 */
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.origin !== embedOrigin) return;
      const data = event.data as any;
      if (data?.type === 'cheso.preview.ready') {
        readyRef.current = true;
        clearTimeout(readyTimeout);
        sendLoad();
      } else if (data?.type === 'cheso.preview.expired') {
        refresh();
      } else if (data?.type === 'cheso.preview.error') {
        setError(typeof data.message === 'string' && data.message ? data.message : new PreviewError('previewLoadFailed'));
      }
    };
    window.addEventListener('message', onMessage);
    return () => {
      controller.abort();
      clearTimeout(readyTimeout);
      window.removeEventListener('message', onMessage);
    };
  }, [embedUrl, embedOrigin, error, sendLoad, fetchContent, updateContent]);

  if (error) {
    return (
      <div style={{ padding: 16, fontSize: 13, lineHeight: 1.6 }}>
        <div style={styles.error}>{typeof error === 'string' ? error : t(error.key, error.params)}</div>
        {params.file_id ? (
          <p style={{ marginTop: 12, opacity: 0.75 }}>
            {t('previewFileStored', { name: params.name ?? params.file_id })}
          </p>
        ) : null}
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div role="status" style={{ display: 'grid', height: '100%', placeContent: 'center', opacity: 0.7 }}>{t('previewLoading')}</div>
    );
  }

  return (
    <iframe
      key={embedUrl}
      ref={bindFrame}
      title={params.name ?? t('previewTitle')}
      src={embedUrl}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
      allow="fullscreen; autoplay"
      referrerPolicy="no-referrer"
      style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
    />
  );
}

/** 为插件注入共享样式，并返回对应的清理函数。 */
function ensureStyles(): () => void {
  const id = 'dsh-cheso-design-style';
  if (document.getElementById(id)) return () => {};
  const style = document.createElement('style');
  style.id = id;
  style.dataset.plugin = 'dsh-cheso-design';
  style.textContent = [
    '.cheso-hidden{display:none}',
    // Match the DSH detail document's height limit so the gallery fits shorter windows.
    '[data-detail-document] img[src*="path=previews%2Fcheso-gallery-"]{max-height:min(560px,60vh);margin-inline:auto}',
    '.cheso-account-secondary{box-sizing:border-box;height:28px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l2,rgba(127,127,127,.3));border-radius:var(--dsw-radius-sm,8px);background:transparent;color:var(--dsw-alias-label-primary,inherit);font-family:inherit;font-size:12px;line-height:18px;cursor:pointer}',
    '.cheso-account-primary,.cheso-account-secondary{transition:background-color .15s ease}',
    '.cheso-account-primary:disabled,.cheso-account-secondary:disabled{opacity:.6;cursor:default}',
    '.cheso-account-primary:focus-visible,.cheso-account-secondary:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#3b82f6);outline-offset:2px}',
    '@media(hover:hover){',
    '.cheso-account-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,#2563eb)}',
    '.cheso-account-secondary:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.08))}',
    '}',
  ].join('');
  document.head.appendChild(style);
  return () => style.remove();
}

/** 注册客户端的本地化、设置页、对话卡片和侧栏预览。 */
export function apply(ctx: any): void {
  const t: Translate = ctx.locale.bind(localeNamespace);
  const settings: SettingsForm = ctx.configForms.get('cheso');
  ctx.effect(() => ctx.locale.register(localeNamespace, dictionaries), 'cheso: dictionaries');
  ctx.effect(() => ensureStyles(), 'cheso:styles');
  ctx.slots.inject('plugins.bundle.config', () =>
    ctx.slots.register({ name: 'plugins.bundle.config', key: 'dsh-cheso-design', locale: localeNamespace }, (props: TranslatedProps) => (
      <ChesoSettings {...props} form={settings} />
    )),
  );

  /** 按站点和文件 ID 打开或复用侧栏标签，并保存恢复标签所需的参数。 */
  const openPreview: ArtifactCardProps['openPreview'] = (artifact, payload) => {
    const siteUrl = payload.project_url || payload.embed_base_url;
    if (!artifact.file_id || !siteUrl) return;
    const address = previewAddress(siteUrl, artifact.file_id);
    const params: PreviewParams = {
      file_id: artifact.file_id,
      name: artifact.name,
      format: artifact.format,
      embed_base_url: payload.embed_base_url,
      project_url: payload.project_url,
    };
    try {
      localStorage.setItem(PREVIEW_STORAGE_PREFIX + address, JSON.stringify(params));
    } catch {
      // 本地存储不可用时，仍使用当前参数打开预览。
    }
    // DSH 会显示该资源的标签页并重新导航，以查询最新版本。
    ctx.sidebarRight.openResource(address, { kind: TAB_KIND, params });
  };

  for (const tool of CARD_TOOLS) {
    ctx.slots.inject('tool.call.toolview', () =>
      ctx.slots.register({ name: 'tool.call.toolview', key: tool, locale: localeNamespace }, (props: any) => (
        <ToolCard {...props} toolName={tool} openPreview={openPreview} />
      )),
    );
  }

  ctx.uiConversation.events.register(artifactTurnDefinition);
  ctx.slots.inject('conversation.chat.turnTail', () =>
    ctx.slots.register({ name: 'conversation.chat.turnTail', id: ARTIFACTS_TURN_KEY, locale: localeNamespace }, (props: TurnArtifactsProps) => (
      <TurnArtifacts {...props} openPreview={openPreview} />
    )),
  );

  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: TAB_ID,
    kind: TAB_KIND,
    patterns: [`${RESOURCE_PREFIX}**`],
    // 切到其他标签时保留 iframe，避免回来时丢失当前预览位置。
    keepMounted: true,
    title: (address: string) => previewFileName(t, savedPreview(address)),
  }), 'cheso:tab');
  ctx.slots.inject('sidebar.right.pane.tab', () =>
    ctx.slots.register({ name: 'sidebar.right.pane.tab', key: TAB_ID, locale: localeNamespace }, PreviewBody),
  );
  ctx.slots.inject('sidebar.right.pane.tab.title', () =>
    ctx.slots.register({ name: 'sidebar.right.pane.tab.title', key: TAB_ID, locale: localeNamespace }, PreviewTitle),
  );
}
