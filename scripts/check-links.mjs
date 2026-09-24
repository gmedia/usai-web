#!/usr/bin/env node
/**
 * Internal link check over the built site (dist/). Every same-site href must
 * resolve to a built page, and every #fragment to an element id on it.
 * External links are not fetched (CI must not depend on the network).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = new URL('../dist', import.meta.url).pathname;
if (!existsSync(dist)) {
  console.error('dist/ not found — run the build first');
  process.exit(1);
}

const pages = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.html')) pages.push(p);
  }
};
walk(dist);

const idsCache = new Map();
const idsOf = (file) => {
  if (!idsCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    idsCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idsCache.get(file);
};

const fileFor = (pathname) => {
  const clean = decodeURIComponent(pathname).replace(/\/+$/, '');
  const candidates = [join(dist, clean, 'index.html'), join(dist, clean), join(dist, `${clean}.html`)];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile());
};

let broken = 0;
const seen = new Set();
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const pagePath = '/' + relative(dist, page).replace(/index\.html$/, '');
  for (const m of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
    let href = m[1].replace(/&amp;/g, '&');
    if (/^(mailto:|tel:|javascript:)/.test(href)) continue;
    if (/^https?:\/\//.test(href)) {
      const u = new URL(href);
      if (u.host !== 'usai.sakala.dev') continue;
      href = u.pathname + u.hash;
    }
    const [pathPart, hash] = href.split('#');
    const target = pathPart === '' ? page : fileFor(new URL(pathPart, `https://x${pagePath}`).pathname);
    const key = `${pagePath} → ${href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!target) {
      broken++;
      console.error(`✗ ${pagePath}  →  ${href}  (no such page)`);
      continue;
    }
    if (hash && target.endsWith('.html') && !idsOf(target).has(decodeURIComponent(hash))) {
      broken++;
      console.error(`✗ ${pagePath}  →  ${href}  (no #${hash} on the page)`);
    }
  }
}

if (broken) {
  console.error(`\n${broken} broken internal link(s) across ${pages.length} pages.`);
  process.exit(1);
}
console.log(`✓ internal links OK (${pages.length} pages, ${seen.size} unique links)`);
