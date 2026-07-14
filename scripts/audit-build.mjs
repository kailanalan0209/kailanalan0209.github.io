import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const controlledRoot = process.env.AUDIT_DIR;
const root = path.resolve(controlledRoot || 'dist');
const auditOrigin = new URL('https://audit.invalid');
const publishableTextExtensions = new Set(['.html', '.css', '.js', '.mjs', '.json', '.xml', '.txt', '.svg']);
const sourceTextExtensions = new Set([...publishableTextExtensions, '.astro', '.ts', '.tsx', '.md', '.mdx', '.yaml', '.yml']);
const sensitive = [
  /04231613/,
  /\/Users\//,
  /API_KEY\s*=/,
  /sk-[A-Za-z0-9]/,
  /BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY/,
];

async function walk(directory, extensions) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target, extensions) : [target];
  }));
  return files.flat().filter((file) => extensions.has(path.extname(file).toLowerCase()));
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
const scanRoots = controlledRoot
  ? [{ directory: root, extensions: publishableTextExtensions, label: root }]
  : [
      { directory: root, extensions: publishableTextExtensions, label: root },
      { directory: path.resolve('src'), extensions: sourceTextExtensions, label: path.resolve() },
      { directory: path.resolve('public'), extensions: sourceTextExtensions, label: path.resolve() },
    ];
const files = (await Promise.all(scanRoots.map(async (scanRoot) => (
  await walk(scanRoot.directory, scanRoot.extensions)
).map((file) => ({ ...scanRoot, file }))))).flat();
for (const { file, label } of files) {
  const content = await readFile(file, 'utf8');
  for (const pattern of sensitive) {
    if (pattern.test(content)) errors.push(path.relative(label, file) + ': sensitive match ' + pattern);
  }
  if (!file.endsWith('.html') || !file.startsWith(root + path.sep)) continue;
  for (const match of content.matchAll(/href=["']([^"']+)["']/g)) {
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
const htmlCount = files.filter(({ file }) => file.endsWith('.html') && file.startsWith(root + path.sep)).length;
console.log('Build audit passed: ' + htmlCount + ' HTML files checked. ' + files.length + ' text files scanned.');
