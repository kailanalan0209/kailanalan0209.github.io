export function getWorkCategoryLabel(
  category: 'photography' | 'video',
  locale: 'zh' | 'en',
) {
  if (category === 'photography') {
    return locale === 'zh' ? '摄影' : 'Photography';
  }
  return locale === 'zh' ? '影像' : 'Film';
}

export function getWorkPreviewSrc(src: string) {
  return src.replace(/\.jpg$/i, '-1280.jpg');
}
