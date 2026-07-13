import { describe, expect, it } from 'vitest';
import { getFallbackPath, getLocalePath } from '../../src/lib/site';

describe('locale routing', () => {
  it('keeps Chinese at the root', () => {
    expect(getLocalePath('zh', '/about/')).toBe('/about/');
  });
  it('prefixes English paths', () => {
    expect(getLocalePath('en', '/about/')).toBe('/en/about/');
  });
  it('falls back from untranslated Chinese content to English home', () => {
    expect(getFallbackPath('en', false)).toBe('/en/?notice=zh-only');
  });
  it('uses a translated path when one exists', () => {
    expect(getFallbackPath('en', true, '/en/projects/api-pulse/')).toBe('/en/projects/api-pulse/');
  });
});
