import { defineMiddleware } from 'astro:middleware';

/**
 * External links open in a new tab. Done once, on the rendered HTML, so it
 * covers components, Markdown (blog, docs) and anything added later — and it
 * works without JavaScript. Runs at build time for this static site.
 *
 * A link is external when its href is absolute http(s) to another host.
 * Links that already set `target` are left alone.
 */
const SITE_HOST = 'usai.sakala.dev';
const ANCHOR = /<a\b([^>]*?)\shref="(https?:\/\/[^"]+)"([^>]*)>/gi;

function addTarget(html: string): string {
  return html.replace(ANCHOR, (tag, before: string, href: string, after: string) => {
    let host = '';
    try {
      host = new URL(href).host;
    } catch {
      return tag;
    }
    if (host === SITE_HOST || /\starget=/.test(before + after)) return tag;
    const attrs = `${before} href="${href}"${after}`;
    const rel = /\srel="([^"]*)"/.exec(attrs);
    const relValue = new Set([...(rel?.[1].split(/\s+/).filter(Boolean) ?? []), 'noopener']);
    const withoutRel = attrs.replace(/\srel="[^"]*"/, '');
    return `<a${withoutRel} target="_blank" rel="${[...relValue].join(' ')}">`;
  });
}

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  const type = response.headers.get('content-type') ?? '';
  if (!type.includes('text/html')) return response;
  const html = await response.text();
  return new Response(addTarget(html), { status: response.status, headers: response.headers });
});
