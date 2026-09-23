/**
 * Open Graph images, rendered at build time (satori -> resvg -> PNG), one per
 * page and locale: /og/en-home.png, /og/id-benchmarks.png, …
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { locales, t, type Lang } from '../../i18n';
import { getPosts, postSlug } from '../../lib/blog';
import { usai } from '../../config/site';
import logoRaw from '../../assets/brand/usai-logo-white-no-tagline.svg?raw';

const pages = ['home', 'benchmarks', 'research', 'glossary', 'brand', 'blog'] as const;
type Page = (typeof pages)[number];
type OgProps = { lang: Lang; page: Page; post?: { title: string; kicker: string } };

export const getStaticPaths: GetStaticPaths = async () => {
  const fixed = locales.flatMap((lang) => pages.map((page) => ({ params: { slug: `${lang}-${page}` }, props: { lang, page } })));
  const posts = (await Promise.all(locales.map((l) => getPosts(l)))).flat();
  const postPaths = posts.map((p) => ({
    params: { slug: `${p.data.lang}-blog-${postSlug(p)}` },
    props: {
      lang: p.data.lang,
      page: 'blog',
      post: { title: p.data.title, kicker: p.data.series ? `${p.data.series.name} · #${p.data.series.part}` : 'Blog' },
    },
  }));
  return [...fixed, ...postPaths];
};

const require = createRequire(import.meta.url);
const font = (pkg: string, file: string) => readFile(require.resolve(`${pkg}/files/${file}`));

let fontsPromise: Promise<{ name: string; data: Buffer; weight: 400 | 500 | 700 | 800; style: 'normal' }[]> | undefined;
function fonts() {
  fontsPromise ??= Promise.all([
    font('@fontsource/plus-jakarta-sans', 'plus-jakarta-sans-latin-800-normal.woff'),
    font('@fontsource/plus-jakarta-sans', 'plus-jakarta-sans-latin-700-normal.woff'),
    font('@fontsource/inter', 'inter-latin-400-normal.woff'),
    font('@fontsource/inter', 'inter-latin-500-normal.woff'),
  ]).then(([j800, j700, i400, i500]) => [
    { name: 'Jakarta', data: j800, weight: 800, style: 'normal' },
    { name: 'Jakarta', data: j700, weight: 700, style: 'normal' },
    { name: 'Inter', data: i400, weight: 400, style: 'normal' },
    { name: 'Inter', data: i500, weight: 500, style: 'normal' },
  ]);
  return fontsPromise;
}

function ridges(): string {
  // Deterministic layered silhouettes in the hero's palette.
  const W = 1200;
  const layers = [
    { base: 380, amp: 60, f: 0.006, ph: 0.4, fill: '#083d3a', rim: '#2dd4bf', o: 0.55 },
    { base: 430, amp: 55, f: 0.009, ph: 2.1, fill: '#062c29', rim: '#2dd4bf', o: 0.45 },
    { base: 485, amp: 45, f: 0.012, ph: 4.0, fill: '#041d1b', rim: '#4ebfaa', o: 0.35 },
    { base: 540, amp: 35, f: 0.016, ph: 1.3, fill: '#021110', rim: '#4ebfaa', o: 0.25 },
  ];
  const paths = layers
    .map((l) => {
      const pts: string[] = [];
      for (let x = 0; x <= W; x += 20) {
        const y = l.base - l.amp * (0.6 * Math.sin(x * l.f + l.ph) + 0.4 * Math.sin(x * l.f * 2.3 + l.ph * 1.7));
        pts.push(`${x},${y.toFixed(1)}`);
      }
      const line = `M${pts.join(' L')}`;
      return `<path d="${line} L${W},630 L0,630 Z" fill="${l.fill}"/><path d="${line}" fill="none" stroke="${l.rim}" stroke-opacity="${l.o}" stroke-width="2"/>`;
    })
    .join('');
  const ribbons = [0, 1, 2]
    .map((i) => {
      const pts: string[] = [];
      for (let x = 300; x <= W; x += 20) {
        const y = 200 + i * 26 + 50 * Math.sin(x * 0.005 + i) + 18 * Math.sin(x * 0.013 - i);
        pts.push(`${x},${y.toFixed(1)}`);
      }
      return `<path d="M${pts.join(' L')}" fill="none" stroke="#2dd4bf" stroke-opacity="${0.35 - i * 0.09}" stroke-width="${2 - i * 0.4}"/>`;
    })
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">${ribbons}${paths}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

const logo = `data:image/svg+xml;base64,${Buffer.from(logoRaw).toString('base64')}`;
const background = ridges();

function titleFor(lang: Lang, page: Page) {
  const d = t(lang);
  switch (page) {
    case 'home':
      return { kicker: d.meta.tagline, title: d.meta.manifesto };
    case 'benchmarks':
      return { kicker: d.benchmarks.eyebrow, title: d.benchmarks.title };
    case 'research':
      return { kicker: d.research.eyebrow, title: d.research.title };
    case 'glossary':
      return { kicker: d.glossary.eyebrow, title: d.glossary.title };
    case 'brand':
      return { kicker: d.brand.eyebrow, title: d.brand.title };
    case 'blog':
      return { kicker: d.blog.eyebrow, title: d.blog.title };
  }
}

export const GET: APIRoute = async ({ props }) => {
  const { lang, page, post } = props as OgProps;
  const { kicker, title } = post ?? titleFor(lang, page);
  const d = t(lang);

  const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}) => ({
    type,
    props: { style, children, ...extra },
  });

  const tree = h(
    'div',
    {
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 72px',
      backgroundColor: '#03110f',
      backgroundImage: 'radial-gradient(circle at 80% 30%, rgba(45,212,191,0.22), rgba(3,17,15,0) 55%)',
      fontFamily: 'Inter',
      color: '#fafbfc',
      position: 'relative',
    },
    [
      h('img', { position: 'absolute', left: 0, top: 0, width: '1200px', height: '630px' }, undefined, { src: background, width: 1200, height: 630 }),
      h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
        h('img', { height: '46px' }, undefined, { src: logo, height: 46, width: 160 }),
        h(
          'div',
          {
            display: 'flex',
            fontSize: '20px',
            color: '#2dd4bf',
            border: '1px solid rgba(45,212,191,0.4)',
            borderRadius: '999px',
            padding: '6px 16px',
          },
          `v${usai.version} · ${d.common.status}`,
        ),
      ]),
      h('div', { display: 'flex', flexDirection: 'column', maxWidth: '980px' }, [
        h('div', { display: 'flex', fontSize: '24px', letterSpacing: '3px', wordSpacing: '6px', textTransform: 'uppercase', color: '#2dd4bf', fontWeight: 500 }, kicker),
        h(
          'div',
          { display: 'flex', marginTop: '18px', fontFamily: 'Jakarta', fontWeight: 800, fontSize: title.length > 70 ? '54px' : title.length > 48 ? '62px' : '76px', lineHeight: 1.06, letterSpacing: '-1.5px' },
          title,
        ),
      ]),
      h('div', { display: 'flex', justifyContent: 'space-between', fontSize: '22px', color: '#a3bcb7' }, [
        h('div', { display: 'flex' }, 'usai.sakala.dev'),
        h('div', { display: 'flex' }, `Open source · ${usai.license}`),
      ]),
    ],
  );

  const svg = await satori(tree as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts: await fonts() });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
