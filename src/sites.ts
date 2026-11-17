export const CHESO_SITES = {
  global: 'https://cheso.ai',
} as const;

export const CHESO_SITE_OPTIONS = ['configured', 'global'] as const;
export type ChesoSite = (typeof CHESO_SITE_OPTIONS)[number];

export interface SiteOptions {
  configuredHost?: string;
  previewHost?: string;
  configuredIsGlobal: boolean;
  lockedByStartupConfig: boolean;
}
