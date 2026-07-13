import { describe, expect, it } from 'vitest';
import { formatDate } from '../../src/lib/date';

declare const process: { env: Record<string, string | undefined> };

describe('date formatting', () => {
  it('keeps a content date on July 14 outside UTC', () => {
    const originalTimeZone = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    try {
      expect(formatDate(new Date('2026-07-14'), 'zh')).toBe('2026年7月14日');
    } finally {
      if (originalTimeZone === undefined) delete process.env.TZ;
      else process.env.TZ = originalTimeZone;
    }
  });
});
