import type { Locale } from './site';

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(date);
}
