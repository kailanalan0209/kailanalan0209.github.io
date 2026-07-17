import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

const staticPaths = [
  '/', '/about/', '/projects/', '/works/', '/posts/',
  '/en/', '/en/about/', '/en/projects/', '/en/works/',
];

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('Astro site is required to build sitemap.xml');

  const projects = await getCollection('projects');
  const posts = await getCollection('posts');
  const works = await getCollection('works');
  const paths = new Set(staticPaths);

  for (const project of projects) {
    paths.add(project.data.lang === 'zh'
      ? `/projects/${project.id}/`
      : `/en/projects/${project.data.translationKey}/`);
  }
  for (const post of posts) {
    if (post.data.lang === 'zh' && !post.data.draft) paths.add(`/posts/${post.id}/`);
  }
  for (const work of works) {
    paths.add(work.data.lang === 'zh'
      ? `/works/${work.data.translationKey}/`
      : `/en/works/${work.data.translationKey}/`);
  }

  const urls = [...paths]
    .sort()
    .map((path) => `  <url><loc>${escapeXml(new URL(path, site).href)}</loc></url>`)
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
