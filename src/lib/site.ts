export type Locale = 'zh' | 'en';

export const site = {
  name: 'WKL',
  zhDescription: '把好奇心做成看得见的项目与文章。',
  enDescription: 'Projects and notes shaped by curiosity.',
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
