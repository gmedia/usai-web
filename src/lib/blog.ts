import { getCollection, type CollectionEntry } from 'astro:content';
import { locales, localePath, type Lang } from '../i18n';

export type Post = CollectionEntry<'blog'>;

/** "en/why-request-state" -> "why-request-state" */
export const postSlug = (post: Post) => post.id.split('/').slice(1).join('/');

export const postPath = (post: Post) => localePath(post.data.lang, `/blog/${postSlug(post)}/`);

/** Published posts of one locale, newest first. Drafts only in `astro dev`. */
export async function getPosts(lang: Lang): Promise<Post[]> {
  const posts = await getCollection('blog', (p) => p.data.lang === lang && (import.meta.env.DEV || !p.data.draft));
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Locales in which this post exists (same translationKey), for hreflang. */
export async function translationsOf(post: Post): Promise<Partial<Record<Lang, Post>>> {
  const all = await getCollection('blog', (p) => p.data.translationKey === post.data.translationKey && (import.meta.env.DEV || !p.data.draft));
  const out: Partial<Record<Lang, Post>> = {};
  for (const l of locales) {
    const hit = all.find((p) => p.data.lang === l);
    if (hit) out[l] = hit;
  }
  return out;
}

export function readingMinutes(body: string | undefined): number {
  const words = (body ?? '').replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date);
}
