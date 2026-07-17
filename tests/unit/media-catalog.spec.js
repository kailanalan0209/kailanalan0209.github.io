import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildCatalog,
  classifyMedia,
  shouldSkipDirectory,
  suggestCategory,
  writeCatalogFiles,
} from '../../scripts/build-media-catalog.mjs';

const temporaryRoots = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) =>
    rm(root, { recursive: true, force: true })
  ));
});

describe('media catalog', () => {
  it('protects software-managed libraries and utility folders', () => {
    expect(shouldSkipDirectory('Photos Library.photoslibrary')).toBe(true);
    expect(shouldSkipDirectory('Lightroom')).toBe(true);
    expect(shouldSkipDirectory('Photo Booth图库')).toBe(true);
    expect(shouldSkipDirectory('$RECYCLE.BIN')).toBe(true);
    expect(shouldSkipDirectory('LR导出')).toBe(false);
  });

  it('classifies publishable media without treating documents as media', () => {
    expect(classifyMedia('photo.jpeg')).toBe('image');
    expect(classifyMedia('clip.MOV')).toBe('video');
    expect(classifyMedia('negative.ARW')).toBe('raw');
    expect(classifyMedia('notes.txt')).toBe(null);
  });

  it('suggests broad review categories from existing folder names', () => {
    expect(suggestCategory('航展raw/DSC001.ARW')).toBe('航空');
    expect(suggestCategory('高铁/DSC002.jpg')).toBe('城市交通');
    expect(suggestCategory('散图照片/DJI系列/DJI_001.jpg')).toBe('航拍');
    expect(suggestCategory('未知目录/IMG_001.jpg')).toBe('待分类');
  });

  it('indexes ordinary media without entering a protected library', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'media-catalog-'));
    temporaryRoots.push(root);
    await mkdir(path.join(root, 'LR导出'));
    await mkdir(path.join(root, 'Photos Library.photoslibrary'));
    await writeFile(path.join(root, 'LR导出', 'selected.jpg'), 'image');
    await writeFile(path.join(root, 'Photos Library.photoslibrary', 'private.jpg'), 'image');

    const catalog = await buildCatalog(root);

    expect(catalog.items.map((item) => item.relativePath)).toEqual(['LR导出/selected.jpg']);
    expect(catalog.protectedDirectories).toEqual(['Photos Library.photoslibrary']);
  });

  it('writes private JSON, CSV, and browseable HTML outputs', async () => {
    const outputRoot = await mkdtemp(path.join(tmpdir(), 'media-catalog-output-'));
    temporaryRoots.push(outputRoot);
    await writeCatalogFiles({
      sourceRoot: '/Pictures',
      generatedAt: '2026-07-17T00:00:00.000Z',
      protectedDirectories: ['Lightroom'],
      items: [{
        relativePath: '高铁/train.jpg',
        absolutePath: '/Pictures/高铁/train.jpg',
        folder: '高铁',
        filename: 'train.jpg',
        extension: 'jpg',
        type: 'image',
        sizeBytes: 1024,
        modifiedAt: '2026-07-17T00:00:00.000Z',
        status: '待筛选',
        suggestedCategory: '城市交通',
      }],
    }, outputRoot, { thumbnails: false });

    expect(JSON.parse(await readFile(path.join(outputRoot, 'catalog.json'), 'utf8')).items).toHaveLength(1);
    expect(await readFile(path.join(outputRoot, 'catalog.csv'), 'utf8')).toContain('高铁/train.jpg');
    expect(await readFile(path.join(outputRoot, 'index.html'), 'utf8')).toContain('摄影素材索引');
  });
});
