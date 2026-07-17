export type Locale = 'zh' | 'en';

export const site = {
  name: 'WKL',
  zhDescription: '工具、产品、摄影与影像作品。',
  enDescription: 'Tools, products, photography, and moving-image work.',
  email: '2694421597@qq.com',
} as const;

export function getLocalePath(locale: Locale, path = '/'): string {
  const normalized = path.startsWith('/') ? path : '/' + path;
  if (locale === 'zh') return normalized;
  return normalized === '/' ? '/en/' : '/en' + normalized;
}

export function getFallbackPath(
  locale: Locale,
  hasTranslation: boolean,
  translatedPath?: string,
): string {
  if (hasTranslation && translatedPath) return translatedPath;
  return locale === 'en' ? '/en/?notice=zh-only' : '/';
}
