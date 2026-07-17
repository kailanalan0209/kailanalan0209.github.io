import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.heic', '.tif', '.tiff', '.webp', '.avif', '.gif']);
const VIDEO_EXTENSIONS = new Set(['.mov', '.mp4', '.m4v', '.avi', '.mkv', '.mts', '.m2ts', '.webm']);
const RAW_EXTENSIONS = new Set(['.arw', '.dng', '.cr2', '.cr3', '.nef', '.raf', '.rw2', '.orf']);
const PROTECTED_DIRECTORIES = new Set([
  '$RECYCLE.BIN',
  'Catalyst Browse',
  'Lightroom',
  'Nik 6 Perspective Samples',
  'Photo Booth图库',
  'Phocus Captures.localized',
]);

export function shouldSkipDirectory(name) {
  return name.startsWith('.')
    || PROTECTED_DIRECTORIES.has(name)
    || name.endsWith('.photoslibrary')
    || name.endsWith('.lrdata')
    || name.endsWith('.lrcat-data');
}

export function classifyMedia(filename) {
  const extension = path.extname(filename).toLowerCase();
  if (IMAGE_EXTENSIONS.has(extension)) return 'image';
  if (VIDEO_EXTENSIONS.has(extension)) return 'video';
  if (RAW_EXTENSIONS.has(extension)) return 'raw';
  return null;
}

export function suggestCategory(relativePath) {
  if (/航展|J-?35/i.test(relativePath)) return '航空';
  if (/高铁|铁路|火车|列车/i.test(relativePath)) return '城市交通';
  if (/DJI|航拍|无人机/i.test(relativePath)) return '航拍';
  if (/人像|工作证|三下乡/i.test(relativePath)) return '人像纪实';
  if (/截图|静帧|修图|素材/i.test(relativePath)) return '工作素材';
  return '待分类';
}

export async function buildCatalog(sourceRoot) {
  const items = [];
  const protectedDirectories = [];

  async function scan(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const absolutePath = path.join(directory, entry.name);
      const relativePath = path.relative(sourceRoot, absolutePath);

      if (entry.isDirectory()) {
        if (shouldSkipDirectory(entry.name)) {
          protectedDirectories.push(relativePath);
        } else {
          await scan(absolutePath);
        }
        continue;
      }

      if (!entry.isFile()) continue;
      const type = classifyMedia(entry.name);
      if (!type) continue;
      const details = await stat(absolutePath);
      items.push({
        relativePath,
        absolutePath,
        folder: path.dirname(relativePath) === '.' ? 'root' : path.dirname(relativePath),
        filename: entry.name,
        extension: path.extname(entry.name).slice(1).toLowerCase(),
        type,
        sizeBytes: details.size,
        modifiedAt: details.mtime.toISOString(),
        status: '待筛选',
        suggestedCategory: suggestCategory(relativePath),
      });
    }
  }

  await scan(sourceRoot);
  items.sort((left, right) => left.relativePath.localeCompare(right.relativePath, 'zh-CN'));
  protectedDirectories.sort((left, right) => left.localeCompare(right, 'zh-CN'));
  return {
    sourceRoot,
    generatedAt: new Date().toISOString(),
    protectedDirectories,
    items,
  };
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export async function writeCatalogFiles(catalog, outputRoot, options = {}) {
  const thumbnails = options.thumbnails !== false;
  await mkdir(outputRoot, { recursive: true });
  const items = catalog.items.map((item) => ({ ...item }));

  if (thumbnails) {
    const { default: sharp } = await import('sharp');
    const thumbnailRoot = path.join(outputRoot, 'thumbnails');
    await mkdir(thumbnailRoot, { recursive: true });
    for (const [index, item] of items.entries()) {
      if (item.type !== 'image') continue;
      const filename = `${String(index + 1).padStart(5, '0')}.jpg`;
      try {
        await sharp(item.absolutePath)
          .rotate()
          .resize({ width: 360, height: 240, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 72, progressive: true })
          .toFile(path.join(thumbnailRoot, filename));
        item.thumbnail = `thumbnails/${filename}`;
      } catch {
        item.thumbnail = null;
      }
    }
  }

  const outputCatalog = { ...catalog, items };
  await writeFile(
    path.join(outputRoot, 'catalog.json'),
    `${JSON.stringify(outputCatalog, null, 2)}\n`,
  );

  const csvColumns = [
    'relativePath', 'type', 'suggestedCategory', 'status', 'extension',
    'sizeBytes', 'modifiedAt', 'absolutePath',
  ];
  const csv = [
    csvColumns.map(csvCell).join(','),
    ...items.map((item) => csvColumns.map((column) => csvCell(item[column] ?? '')).join(',')),
  ].join('\n');
  await writeFile(path.join(outputRoot, 'catalog.csv'), `${csv}\n`);

  const categories = [...new Set(items.map((item) => item.suggestedCategory))].sort();
  const cards = items.map((item) => `
    <article class="card" data-type="${escapeHtml(item.type)}" data-category="${escapeHtml(item.suggestedCategory)}" data-search="${escapeHtml(item.relativePath.toLowerCase())}">
      ${item.thumbnail
        ? `<a href="${escapeHtml(new URL(`file://${item.absolutePath}`).href)}"><img src="${escapeHtml(item.thumbnail)}" alt="" loading="lazy"></a>`
        : `<div class="placeholder">${escapeHtml(item.type.toUpperCase())}</div>`}
      <div class="body">
        <strong title="${escapeHtml(item.filename)}">${escapeHtml(item.filename)}</strong>
        <span>${escapeHtml(item.folder)}</span>
        <small>${escapeHtml(item.suggestedCategory)} · ${escapeHtml(item.status)}</small>
      </div>
    </article>`).join('');
  const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>摄影素材索引</title>
<style>
body{margin:0;background:#171512;color:#f4eee5;font:15px system-ui,sans-serif}.shell{width:min(1400px,calc(100% - 32px));margin:auto}
header{padding:40px 0 24px}h1{margin:0 0 8px;font-size:clamp(30px,5vw,54px)}p{color:#bdb3a5}
.toolbar{position:sticky;top:0;z-index:2;display:flex;gap:10px;flex-wrap:wrap;padding:14px 0;background:#171512eF}
input,select{min-height:42px;border:1px solid #4a4238;border-radius:8px;background:#211e1a;color:inherit;padding:0 12px}
input{flex:1;min-width:220px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;padding-bottom:48px}
.card{overflow:hidden;border:1px solid #3b352d;border-radius:10px;background:#211e1a}.card[hidden]{display:none}
img,.placeholder{display:block;width:100%;height:180px;object-fit:cover;background:#2d2923}.placeholder{display:grid;place-items:center;color:#8e8477;font-weight:700}
.body{display:grid;gap:5px;padding:12px}.body strong,.body span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.body span,.body small{color:#aa9f91}
</style></head><body><main class="shell"><header><h1>摄影素材索引</h1>
<p>共 ${items.length} 项；保护并跳过 ${catalog.protectedDirectories.length} 个软件管理目录。此页面仅保存在本机。</p></header>
<div class="toolbar"><input id="search" type="search" placeholder="搜索文件名或目录">
<select id="type"><option value="">全部格式</option><option value="image">图片</option><option value="video">视频</option><option value="raw">RAW</option></select>
<select id="category"><option value="">全部分类</option>${categories.map((category) => `<option>${escapeHtml(category)}</option>`).join('')}</select></div>
<section class="grid">${cards}</section></main>
<script>
const cards=[...document.querySelectorAll('.card')],search=document.querySelector('#search'),type=document.querySelector('#type'),category=document.querySelector('#category');
function filter(){const query=search.value.trim().toLowerCase();for(const card of cards)card.hidden=!(card.dataset.search.includes(query)&&(!type.value||card.dataset.type===type.value)&&(!category.value||card.dataset.category===category.value))}
search.addEventListener('input',filter);type.addEventListener('change',filter);category.addEventListener('change',filter);
</script></body></html>`;
  await writeFile(path.join(outputRoot, 'index.html'), html);
  return outputCatalog;
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  const sourceRoot = path.resolve(process.argv[2] ?? '');
  const outputRoot = path.resolve(process.argv[3] ?? 'media-catalog');
  if (!process.argv[2]) {
    console.error('Usage: node scripts/build-media-catalog.mjs <source-directory> [output-directory]');
    process.exitCode = 1;
  } else {
    const catalog = await buildCatalog(sourceRoot);
    await writeCatalogFiles(catalog, outputRoot);
    console.log(`Indexed ${catalog.items.length} media files in ${outputRoot}`);
    console.log(`Protected directories skipped: ${catalog.protectedDirectories.length}`);
  }
}
