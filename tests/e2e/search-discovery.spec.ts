import { expect, test } from '@playwright/test';

const origin = 'https://kailanalan0209.github.io';

test('robots allows crawling and points to the production sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/plain');
  expect(await response.text()).toBe(
    `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
  );
});

test('sitemap exposes real static and collection-backed routes only', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/xml');
  const xml = await response.text();
  for (const path of [
    '/', '/about/', '/projects/', '/posts/', '/en/', '/en/about/', '/en/projects/',
    '/projects/api-pulse/', '/projects/macos-setup-assistant/',
    '/en/projects/api-pulse/', '/en/projects/macos-setup-assistant/',
    '/posts/api-key-privacy/', '/posts/macos-setup-workflow/',
  ]) {
    expect(xml).toContain(`<loc>${origin}${path}</loc>`);
  }
  expect(xml).not.toContain('/404');
  expect(xml).not.toContain('notice=zh-only');
  expect(xml).not.toContain('localhost');
});
