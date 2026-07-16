import { describe, expect, it } from 'vitest';
import { experienceSchema, postSchema, projectSchema } from '../../src/content.config';

const validEvidence = {
  version: '1.0.0',
  verifiedAt: '2026-07-16',
  environment: 'macOS on Apple silicon',
  checks: ['Syntax check passed'],
  disclosure: 'Owner-verified record; source and internal configuration remain private.',
};

describe('content schemas', () => {
  it('defaults an omitted project cover to the project fallback', () => {
    const result = projectSchema.parse({
      title: 'Example',
      summary: 'Summary',
      role: 'Builder',
      date: new Date('2026-01-01'),
      technologies: ['Astro'],
      status: '已完成产品',
      outcome: 'Outcome',
      lang: 'zh',
      translationKey: 'example',
      evidence: validEvidence,
    });

    expect(result.cover).toBe('/images/project-fallback.svg');
    expect(result.coverFit).toBe('cover');
  });

  it('accepts contain for a project cover', () => {
    const result = projectSchema.parse({
      title: 'Example',
      summary: 'Summary',
      role: 'Builder',
      date: new Date('2026-01-01'),
      technologies: ['Astro'],
      cover: '/images/example.png',
      coverFit: 'contain',
      status: '已完成产品',
      outcome: 'Outcome',
      lang: 'zh',
      translationKey: 'example',
      evidence: validEvidence,
    });

    expect(result.coverFit).toBe('contain');
  });

  it('defaults an omitted post cover to the article fallback', () => {
    const result = postSchema.parse({
      title: '文章',
      summary: '摘要',
      publishedAt: new Date('2026-07-14'),
      tags: ['开发记录'],
      lang: 'zh',
      translationKey: 'article',
      readingMinutes: 2,
    });

    expect(result.cover).toBe('/images/article-fallback.svg');
  });

  it('rejects an unsupported project status', () => {
    const result = projectSchema.safeParse({
      title: 'Example',
      summary: 'Summary',
      role: 'Builder',
      date: new Date('2026-01-01'),
      technologies: ['Astro'],
      cover: '/images/project-fallback.svg',
      status: '进行中',
      outcome: 'Outcome',
      lang: 'zh',
      translationKey: 'example',
      featured: true,
    });
    expect(result.success).toBe(false);
  });

  it('requires verification evidence for every project', () => {
    const result = projectSchema.safeParse({
      title: 'Example',
      summary: 'Summary',
      role: 'Builder',
      date: new Date('2026-01-01'),
      technologies: ['Astro'],
      status: '已完成产品',
      outcome: 'Outcome',
      lang: 'zh',
      translationKey: 'example',
    });

    expect(result.success).toBe(false);
  });

  it('preserves a complete project verification record', () => {
    const result = projectSchema.parse({
      title: 'Example',
      summary: 'Summary',
      role: 'Builder',
      date: new Date('2026-01-01'),
      technologies: ['Astro'],
      status: '已完成产品',
      outcome: 'Outcome',
      lang: 'zh',
      translationKey: 'example',
      evidence: validEvidence,
    });

    expect(result.evidence).toEqual(validEvidence);
  });

  it('rejects an invalid verification date or an empty check list', () => {
    const baseProject = {
      title: 'Example',
      summary: 'Summary',
      role: 'Builder',
      date: new Date('2026-01-01'),
      technologies: ['Astro'],
      status: '已完成产品',
      outcome: 'Outcome',
      lang: 'zh',
      translationKey: 'example',
    };

    expect(projectSchema.safeParse({
      ...baseProject,
      evidence: { ...validEvidence, verifiedAt: '16/07/2026' },
    }).success).toBe(false);
    expect(projectSchema.safeParse({
      ...baseProject,
      evidence: { ...validEvidence, verifiedAt: '2026-13-40' },
    }).success).toBe(false);
    expect(projectSchema.safeParse({
      ...baseProject,
      evidence: { ...validEvidence, checks: [] },
    }).success).toBe(false);
  });

  it('accepts a Chinese post without an English translation', () => {
    expect(postSchema.safeParse({
      title: '文章',
      summary: '摘要',
      publishedAt: new Date('2026-07-14'),
      tags: ['开发记录'],
      cover: '/images/article-fallback.svg',
      lang: 'zh',
      translationKey: 'article',
      readingMinutes: 2,
      draft: false,
    }).success).toBe(true);
  });

  it('requires a personal contribution for experience', () => {
    expect(experienceSchema.safeParse({
      title: '比赛',
      date: '2024',
      outcome: '完成研究',
      type: '团队项目',
      lang: 'zh',
      translationKey: 'contest',
    }).success).toBe(false);
  });
});
