import { useCallback, useEffect, useId, useState, useSyncExternalStore } from 'react';
import { CHESO_SITES, type ChesoSite, type SiteOptions } from '../sites';
import { ChesoAccountStatus } from './account';
import type { TranslatedProps } from './i18n';

interface SettingsSnapshot {
  status: 'loading' | 'ready' | 'unavailable';
  value?: { site?: ChesoSite };
  revision?: number;
  writable: boolean;
}

export interface SettingsForm {
  getSnapshot: () => SettingsSnapshot;
  subscribe: (listener: () => void) => () => void;
  mutate: (operations: readonly { op: 'set'; path: string[]; value: ChesoSite }[], revision?: number) => Promise<boolean>;
}

/** 从宿主端读取站点显示信息及配置锁定状态。 */
async function loadSiteOptions(signal: AbortSignal): Promise<SiteOptions | null> {
  const response = await fetch('/api/cheso/site-options', { signal });
  return response.ok ? response.json() : null;
}

/** 订阅 DSH 配置表单，显示站点选择和所选站点的账号状态。 */
export function ChesoSettings({ form, t }: TranslatedProps & { form: SettingsForm }) {
  const subscribe = useCallback((listener: () => void) => form.subscribe(listener), [form]);
  const getSnapshot = useCallback(() => form.getSnapshot(), [form]);
  const state = useSyncExternalStore(subscribe, getSnapshot);
  const headingId = useId();
  const [options, setOptions] = useState<SiteOptions | null>();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void loadSiteOptions(controller.signal).then(result => {
      if (!controller.signal.aborted) setOptions(result);
    }).catch(() => {
      // 无法确认有多个域名时，保留当前站点并隐藏站点选择。
      if (!controller.signal.aborted) setOptions(null);
    });
    return () => controller.abort();
  }, []);

  const site = state.value?.site ?? 'configured';
  const configuredHost = options?.configuredHost;
  const previewHost = options?.previewHost;
  const lockedByStartupConfig = options?.lockedByStartupConfig;
  const ready = state.status === 'ready';
  const globalHost = new URL(CHESO_SITES.global).host;
  const showSiteSelect = ready && configuredHost && configuredHost !== globalHost;
  const showPreviewHost = ready && site === 'configured' && previewHost && previewHost !== configuredHost;

  /** 基于当前表单版本保存站点选择，并更新保存状态和失败提示。 */
  async function changeSite(site: ChesoSite) {
    setSaving(true);
    setFailed(false);
    try {
      const accepted = await form.mutate([{ op: 'set', path: ['site'], value: site }], state.revision);
      setFailed(!accepted);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby={headingId} style={styles.section}>
      <div style={styles.header}>
        <h4 id={headingId} style={styles.title}>{t('accountTitle')}</h4>
        {showSiteSelect ? (
          <select
            aria-label={t('settingsSite')}
            className="cheso-account-secondary"
            value={site}
            disabled={saving || !state.writable || lockedByStartupConfig}
            onChange={(event) => void changeSite(event.currentTarget.value as ChesoSite)}
            style={styles.select}
          >
            <option value="global">{globalHost}</option>
            <option value="configured">{configuredHost}</option>
          </select>
        ) : null}
      </div>
      {showSiteSelect || showPreviewHost ? (
        <p style={styles.hint}>
          {showSiteSelect ? t(lockedByStartupConfig ? 'settingsStartupLocked' : 'settingsHelp') : null}
          {showSiteSelect && showPreviewHost ? ' ' : null}
          {showPreviewHost ? t('settingsPreviewHost', { host: previewHost }) : null}
        </p>
      ) : null}
      {!ready ? <p role="status" style={styles.hint}>{t(state.status === 'loading' ? 'settingsLoading' : 'settingsUnavailable')}</p> : null}
      {saving ? <p role="status" style={styles.hint}>{t('settingsSaving')}</p> : null}
      {failed ? <p role="alert" style={styles.hint}>{t('settingsFailed')}</p> : null}
      {state.status !== 'loading' ? (
        <ChesoAccountStatus key={site} t={t} disabled={saving} showSite={!ready || (site === 'configured' && !configuredHost)} />
      ) : null}
    </section>
  );
}

const styles = {
  section: { display: 'grid', gap: 12, minWidth: 0 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  title: { margin: 0, fontSize: 14, lineHeight: '20px', fontWeight: 500 },
  select: { maxWidth: '100%', colorScheme: 'light dark' },
  hint: { margin: 0, color: 'var(--dsw-alias-label-secondary, #888)', fontSize: 13, lineHeight: '20px' },
} as const;
