import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.env.AUDIT_DIR || 'dist');
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
  const pathname = href.split('#')[0].split('?')[0];
  if (!pathname.startsWith('/')) return null;
  if (pathname === '/') return path.join(root, 'index.html');
  if (pathname.endsWith('/')) return path.join(root, pathname, 'index.html');
  return path.join(root, pathname.replace(/^\//, ''));
}

const errors = [];
const files = await walk(root);
for (const file of files) {
  const html = await readFile(file, 'utf8');
  for (const pattern of sensitive) {
    if (pattern.test(html)) errors.push(path.relative(root, file) + ': sensitive match ' + pattern);
  }
  for (const match of html.matchAll(/href=["']([^"']+)["']/g)) {
    const target = toTarget(match[1]);
    if (!target) continue;
    try { await access(target); }
    catch { errors.push(path.relative(root, file) + ': broken link ' + match[1]); }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Build audit passed: ' + files.length + ' HTML files checked.');
