import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.env.AUDIT_DIR || 'dist');
const auditOrigin = new URL('https://audit.invalid');
const sensitive = [
  /04231613/,
  /\/Users\//,
  /API_KEY\s*=/,
  /sk-[A-Za-z0-9]/,
  /BEGIN PRIVATE KEY/,
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  }));
  return files.flat().filter((file) => file.endsWith('.html'));
}

function toTarget(href) {
  if (!href.startsWith('/') || href.startsWith('//')) return null;

  let rawPathname;
  let url;
  try {
    rawPathname = decodeURIComponent(href.split(/[?#]/, 1)[0]).replaceAll('\\', '/');
    url = new URL(href, auditOrigin);
  } catch {
    return { error: 'invalid internal link ' + href };
  }
  if (url.origin !== auditOrigin.origin || rawPathname.split('/').includes('..')) {
    return { error: 'invalid internal link ' + href };
  }

  const pathname = decodeURIComponent(url.pathname);
  const relativePath = pathname.replace(/^\//, '');
  const target = path.resolve(root, relativePath, pathname.endsWith('/') ? 'index.html' : '');
  const relativeTarget = path.relative(root, target);
  if (relativeTarget === '..' || relativeTarget.startsWith('..' + path.sep) || path.isAbsolute(relativeTarget)) {
    return { error: 'invalid internal link ' + href };
  }
  return { target };
}

const errors = [];
const files = await walk(root);
for (const file of files) {
  const html = await readFile(file, 'utf8');
  for (const pattern of sensitive) {
    if (pattern.test(html)) errors.push(path.relative(root, file) + ': sensitive match ' + pattern);
  }
  for (const match of html.matchAll(/href=["']([^"']+)["']/g)) {
    const result = toTarget(match[1]);
    if (!result) continue;
    if (result.error) {
      errors.push(path.relative(root, file) + ': ' + result.error);
      continue;
    }
    try { await access(result.target); }
    catch { errors.push(path.relative(root, file) + ': broken link ' + match[1]); }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Build audit passed: ' + files.length + ' HTML files checked.');
