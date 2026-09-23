import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Blog posts: src/content/blog/<lang>/<slug>.md
 *
 * Every post carries an `evidence` block (the site's editorial signature):
 * what was measured, on what, what the evidence supports, what it does not,
 * and where the data lives. It is rendered at the top of the article.
 * A post may set `evidence: false` only when it makes no factual claims
 * about Usai's behaviour or performance (e.g. an announcement).
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(200),
    /** Same value across translations of one post; drives hreflang. */
    translationKey: z.string(),
    lang: z.enum(['en', 'id']),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: z.string().default('Sakala maintainers'),
    tags: z.array(z.string()).default([]),
    /** Drafts render in `astro dev` only. */
    draft: z.boolean().default(false),
    series: z.object({ name: z.string(), part: z.number() }).optional(),
    evidence: z.union([
      z.literal(false),
      z.object({
        status: z.string(),
        setup: z.string().optional(),
        supports: z.array(z.string()).min(1),
        doesNotSupport: z.array(z.string()).min(1),
        sources: z.array(z.object({ label: z.string(), url: z.url() })).min(1),
      }),
    ]),
  }),
});

export const collections = { blog };
