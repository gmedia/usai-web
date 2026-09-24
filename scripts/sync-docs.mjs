#!/usr/bin/env node
/**
 * Sync the runtime's documentation from gmedia/usai into this site.
 *
 *   pnpm sync:docs --ref v0.0.9                    # download the tag from GitHub
 *   pnpm sync:docs --ref v0.0.9 --from ../usai     # read a local clone (git archive)
 *
 * The docs are written and versioned next to the code in gmedia/usai. This
 * script copies one *release tag* of them into src/content/docs/ so the site
 * renders them in its own design, and rewrites links so readers stay here:
 *
 *   - a link to another synced .md            -> /docs/<slug>/
 *   - `docs/GUIDE.md`-style inline references -> the same, as a link
 *   - anything else in the repository          -> GitHub at the same tag
 *
 * Output is committed (the build never needs the network). Never edit the
 * generated files by hand; fix the source upstream and re-sync.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix, relative } from 'node:path';

const REPO = 'gmedia/usai';
const root = new URL('..', import.meta.url).pathname;
const OUT = join(root, 'src/content/docs');
const META = join(root, 'src/data/docs-source.json');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]?.startsWith('--') ? true : all[i + 1] ?? true]] : acc), []),
);
const ref = args.ref;
if (!ref || ref === true) {
  console.error('usage: pnpm sync:docs --ref <tag> [--from <path to a gmedia/usai clone>]');
  process.exit(1);
}

// 1. Fetch the tree at `ref` into a temp directory.
const tmp = mkdtempSync(join(tmpdir(), 'usai-docs-'));
const wanted = ['docs', 'SUPPORTED.md', 'CHANGELOG.md', 'SECURITY.md', 'GOVERNANCE.md'];
let commit = '';
let released = '';
if (args.from && args.from !== true) {
  const archive = execFileSync('git', ['-C', args.from, 'archive', ref, ...wanted], { maxBuffer: 1 << 28 });
  execFileSync('tar', ['-x', '-C', tmp], { input: archive });
  commit = execFileSync('git', ['-C', args.from, 'rev-list', '-n', '1', ref]).toString().trim();
  // UTC, to match GitHub's release dates.
  released = execFileSync('git', ['-C', args.from, 'log', '-1', '--date=format-local:%Y-%m-%d', '--format=%cd', ref], { env: { ...process.env, TZ: 'UTC' } }).toString().trim();
} else {
  const res = await fetch(`https://codeload.github.com/${REPO}/tar.gz/refs/tags/${ref}`);
  if (!res.ok) throw new Error(`download ${ref}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  execFileSync('tar', ['-xz', '-C', tmp, '--strip-components=1', ...wanted.map((w) => `usai-${ref.replace(/^v/, '')}/${w}`)], { input: buf });
  const api = await fetch(`https://api.github.com/repos/${REPO}/commits/${ref}`, { headers: { accept: 'application/vnd.github.sha' } });
  commit = api.ok ? (await api.text()).trim() : '';
  const rel = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/${ref}`);
  released = rel.ok ? String((await rel.json()).published_at ?? '').slice(0, 10) : '';
}

// 2. Collect the Markdown files we publish.
const EXCLUDE = [/^docs\/brand\//, /^docs\/README\.md$/];
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(join(tmp, dir))) {
    const rel = posix.join(dir, name);
    if (statSync(join(tmp, rel)).isDirectory()) walk(rel);
    else if (rel.endsWith('.md') && !EXCLUDE.some((re) => re.test(rel))) files.push(rel);
  }
};
walk('docs');
for (const f of wanted.slice(1)) if (existsSync(join(tmp, f))) files.push(f);

/** Upstream path -> site slug: docs/sdk/index/README.md -> sdk/index, SUPPORTED.md -> supported */
const slugOf = (path) =>
  path
    .replace(/^docs\//, '')
    .replace(/(^|\/)README\.md$/, '')
    .replace(/\.md$/, '')
    .toLowerCase() || 'index';
const bySource = new Map(files.map((f) => [f, slugOf(f)]));

/** Plain-text title: drop Markdown links, emphasis, code ticks and escapes. */
const cleanTitle = (t) =>
  t
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]/g, '')
    .replace(/\\([<>|[\]])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
const dirIndex = new Map(); // "docs/runbooks" -> slug of its README
for (const f of files) if (/(^|\/)README\.md$/.test(f)) dirIndex.set(posix.dirname(f), slugOf(f));

const blob = (p) => `https://github.com/${REPO}/blob/${ref}/${p}`;
const tree = (p) => `https://github.com/${REPO}/tree/${ref}/${p}`;
const docUrl = (slug, hash = '') => `/docs/${slug}/${hash}`;

/** Resolve a link target written in `fromFile` to a site or GitHub URL. */
function resolveLink(fromFile, target) {
  if (/^([a-z]+:|#|\/\/)/i.test(target)) return target;
  const [pathPart, hash = ''] = target.split('#');
  const anchor = hash ? `#${hash.toLowerCase()}` : '';
  const abs = posix.normalize(posix.join(posix.dirname(fromFile), pathPart)).replace(/\/$/, '');
  if (bySource.has(abs)) return docUrl(bySource.get(abs), anchor);
  if (dirIndex.has(abs)) return docUrl(dirIndex.get(abs), anchor);
  if (bySource.has(`${abs}/README.md`)) return docUrl(bySource.get(`${abs}/README.md`), anchor);
  if (abs === 'docs/measurements') return docUrl('measurements', anchor);
  if (abs.startsWith('..')) return target;
  const isDir = pathPart.endsWith('/') || !/\.[a-z0-9]+$/i.test(abs);
  return (isDir ? tree(abs) : blob(abs)) + (hash ? `#${hash}` : '');
}

/** `docs/GUIDE.md` §16 style references (inline code) -> links, when the file is synced. */
function linkInlineRefs(line, fromFile) {
  return line.replace(/(?<!\[)`((?:\.\.\/)*(?:docs\/)?[A-Za-z0-9_./-]+\.md)(#[a-z0-9-]+)?`(?!\])/g, (m, p, h = '') => {
    const candidates = [p, `docs/${p}`, posix.normalize(posix.join(posix.dirname(fromFile), p))];
    const hit = candidates.find((c) => bySource.has(c));
    return hit ? `[\`${p}${h}\`](${docUrl(bySource.get(hit), h.toLowerCase())})` : m;
  });
}

/** GitHub-style heading slug (matches the ids Astro renders). */
const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s/g, '-');

// The guide refers to its own sections as "§4"; map numbers to heading anchors.
const guideSections = new Map();
{
  const guideSrc = existsSync(join(tmp, 'docs/GUIDE.md')) ? readFileSync(join(tmp, 'docs/GUIDE.md'), 'utf8') : '';
  for (const m of guideSrc.matchAll(/^## (\d+)\.\s+(.+)$/gm)) guideSections.set(m[1], slugify(`${m[1]}. ${m[2]}`));
}
/** Apply `fn` only outside inline code spans. */
const outsideCode = (line, fn) => line.split(/(`[^`]*`)/).map((part, i) => (i % 2 ? part : fn(part))).join('');

function linkGuideSections(line, file) {
  if (!guideSections.size) return line;
  // "[`docs/GUIDE.md`](/docs/guide/) §16" -> one link to the section
  line = line.replace(/\[([^\]]*GUIDE(?:\.md)?[^\]]*)\]\(\/docs\/guide\/\) §(\d+)/g, (m, label, n) =>
    guideSections.has(n) ? `[${label} §${n}](/docs/guide/#${guideSections.get(n)})` : m,
  );
  return outsideCode(line, (text) =>
    file === 'docs/GUIDE.md'
      ? text.replace(/(?<![\[\w])§(\d+)(?![\d\]])/g, (m, n) => (guideSections.has(n) ? `[§${n}](#${guideSections.get(n)})` : m))
      : text.replace(/\bGUIDE §(\d+)/g, (m, n) => (guideSections.has(n) ? `[GUIDE §${n}](/docs/guide/#${guideSections.get(n)})` : m)),
  );
}

// 3. Write each file with frontmatter and rewritten links.
rmSync(OUT, { recursive: true, force: true });
let count = 0;
for (const file of files) {
  let src = readFileSync(join(tmp, file), 'utf8').replace(/\r\n/g, '\n');
  // Title from the first H1; the page renders it, so drop it from the body.
  const h1 = /^#\s+(.+)$/m.exec(src);
  const title = cleanTitle(h1?.[1] ?? slugOf(file).split('/').pop());
  if (h1) src = src.replace(h1[0], '').replace(/^\s*\n/, '');

  let inFence = false;
  const body = src
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
      if (inFence) return line;
      let out = line
        .replace(/\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (_m, t, titlePart = '') => `](${resolveLink(file, t)}${titlePart})`)
        .replace(/\b(href|src)="([^"]+)"/g, (_m, attr, t) => `${attr}="${resolveLink(file, t)}"`);
      out = linkInlineRefs(out, file);
      out = linkGuideSections(out, file);
      return out;
    })
    .join('\n');

  const slug = bySource.get(file);
  const fm = [
    '---',
    `# GENERATED by scripts/sync-docs.mjs from ${REPO}@${ref}:${file} — do not edit; fix upstream and re-sync.`,
    `title: ${JSON.stringify(title)}`,
    `slug: ${JSON.stringify(slug)}`,
    `source: ${JSON.stringify(file)}`,
    '---',
    '',
  ].join('\n');
  const outPath = join(OUT, `${slug === 'index' ? '_index' : slug}.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, fm + body.trimStart() + '\n');
  count++;
}

// 4. Directories with pages but no README get a generated index.
const dirs = new Set(files.filter((f) => f.startsWith('docs/')).map((f) => posix.dirname(f)).filter((d) => d !== 'docs'));
for (const dir of dirs) {
  if (dirIndex.has(dir)) continue;
  const slug = slugOf(`${dir}/README.md`);
  const children = files
    .filter((f) => posix.dirname(f) === dir)
    // Undated pages (BENCHMARKS.md) first, then dated reports newest first.
    .sort((x, y) => (/\/\d{4}-/.test(x) ? 1 : 0) - (/\/\d{4}-/.test(y) ? 1 : 0) || y.localeCompare(x))
    .map((f) => {
      const t = cleanTitle(/^#\s+(.+)$/m.exec(readFileSync(join(tmp, f), 'utf8'))?.[1] ?? posix.basename(f));
      return `- [${t.replace(/</g, '&lt;').replace(/\[|\]/g, '')}](${docUrl(bySource.get(f))})`;
    });
  const name = dir.split('/').pop();
  const title = name.charAt(0).toUpperCase() + name.slice(1);
  const fm = ['---', `# GENERATED index for ${dir}/ (no README upstream).`, `title: ${JSON.stringify(title)}`, `slug: ${JSON.stringify(slug)}`, `source: ${JSON.stringify(dir + '/')}`, '---', ''].join('\n');
  const outPath = join(OUT, `${slug}.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, fm + children.join('\n') + '\n');
  count++;
}

writeFileSync(META, JSON.stringify({ repo: REPO, ref, commit, released, files: count, syncedAt: new Date().toISOString().slice(0, 10) }, null, 2) + '\n');
rmSync(tmp, { recursive: true, force: true });
console.log(`✓ synced ${count} pages from ${REPO}@${ref}${commit ? ` (${commit.slice(0, 7)})` : ''} into ${relative(root, OUT)}`);
