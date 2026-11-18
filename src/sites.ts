export const CHESO_SITES = {
  global: 'https://cheso.ai',
} as const;

export const CHESO_SITE_OPTIONS = ['configured', 'global'] as const;
export type ChesoSite = (typeof CHESO_SITE_OPTIONS)[number];

/** 旧卡片没有 base_url，使用项目链接还原站点地址。 */
export function projectSite(projectUrl: unknown): string | undefined {
  if (typeof projectUrl !== 'string') return undefined;
  return projectUrl.match(/^(.*)\/agent\/[A-Za-z0-9_-]+\/?$/)?.[1];
}

export interface SiteOptions {
  configuredHost?: string;
  previewHost?: string;
  configuredIsGlobal: boolean;
  lockedByStartupConfig: boolean;
}
