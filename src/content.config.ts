import { defineCollection } from 'astro/content/config';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const language = z.enum(['zh', 'en']);
const projectStatus = z.enum(['已完成产品', '团队项目', '概念设计']);
const projectEvidence = z.object({
  version: z.string().min(1),
  verifiedAt: z.iso.date(),
  environment: z.string().min(1),
  checks: z.array(z.string().min(1)).min(1),
  disclosure: z.string().min(1),
});

export const projectSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  role: z.string().min(1),
  date: z.coerce.date(),
  technologies: z.array(z.string().min(1)).min(1),
  cover: z.string().startsWith('/').default('/images/project-fallback.svg'),
  coverFit: z.enum(['cover', 'contain']).default('cover'),
  status: projectStatus,
  outcome: z.string().min(1),
  lang: language,
  translationKey: z.string().min(1),
  featured: z.boolean().default(false),
  evidence: projectEvidence,
});

export const postSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  publishedAt: z.coerce.date(),
  tags: z.array(z.string().min(1)).min(1),
  cover: z.string().startsWith('/').default('/images/article-fallback.svg'),
  lang: language,
  translationKey: z.string().min(1),
  readingMinutes: z.number().int().positive(),
  draft: z.boolean().default(false),
});

export const experienceSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  contribution: z.string().min(1),
  outcome: z.string().min(1),
  type: z.enum(['团队项目', '课程概念']),
  lang: language,
  translationKey: z.string().min(1),
});

const workMediaSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('image'),
    src: z.string().startsWith('/'),
    alt: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('video'),
    src: z.string().startsWith('/'),
    poster: z.string().startsWith('/'),
    alt: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
]);

export const workSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  category: z.enum(['photography', 'video']),
  year: z.number().int().min(2000),
  cover: z.string().startsWith('/'),
  media: z.array(workMediaSchema).min(1),
  lang: language,
  translationKey: z.string().min(1),
  featured: z.boolean().default(false),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: projectSchema,
});
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: postSchema,
});
const experience = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experience' }),
  schema: experienceSchema,
});
const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: workSchema,
});

export const collections = { projects, posts, experience, works };
