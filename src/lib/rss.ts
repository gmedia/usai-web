import rss from '@astrojs/rss';
import { t, localePath, type Lang } from '../i18n';
import { getPosts, postPath } from './blog';

/** RSS 2.0 feed of the published posts of one locale. */
export async function blogFeed(lang: Lang, site: URL) {
  const d = t(lang);
  const posts = (await getPosts(lang)).filter((p) => !p.data.draft);
  return rss({
    title: d.blog.meta.title,
    description: d.blog.meta.description,
    site: new URL(localePath(lang, '/blog/'), site).href,
    customData: `<language>${lang === 'id' ? 'id-ID' : 'en'}</language>`,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: postPath(p),
      categories: p.data.tags,
      author: p.data.author,
    })),
  });
}
