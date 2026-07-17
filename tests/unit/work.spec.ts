import { describe, expect, it } from 'vitest';
import { getWorkCategoryLabel, getWorkPreviewSrc } from '../../src/lib/work';

describe('work presentation helpers', () => {
  it('labels photography and film in both languages', () => {
    expect(getWorkCategoryLabel('photography', 'zh')).toBe('摄影');
    expect(getWorkCategoryLabel('photography', 'en')).toBe('Photography');
    expect(getWorkCategoryLabel('video', 'zh')).toBe('影像');
    expect(getWorkCategoryLabel('video', 'en')).toBe('Film');
  });

  it('maps a full-size JPEG to its web preview', () => {
    expect(getWorkPreviewSrc('/images/work/aviation/01.jpg'))
      .toBe('/images/work/aviation/01-1280.jpg');
  });
});
