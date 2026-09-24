# AGENTS.md — working agreement for usai-web

This file is the working agreement for any coding agent (Claude Code, Codex, Gemini CLI, Cursor) and any human contributor working in `gmedia/usai-web`. `CLAUDE.md` is a symlink to this file, so there is one source of truth for every tool.

Read order for a new session:

1. this file;
2. `docs/ARCHITECTURE.md`: how the site is put together;
3. `docs/CONTENT-RULES.md`: what the site may and may not say;
4. `docs/I18N.md`: before touching copy;
5. `docs/DATA-SOURCES.md`: before touching a number;
6. `docs/PUBLISHING.md`: before writing a blog post.

---

## 1. What this repository is

`gmedia/usai-web` is the public website of **Usai**, served at **https://usai.sakala.dev**. Usai is an open-source **workload-native application runtime** (persistent Rust host, immutable application definition, fresh execution world per unit of work, TypeScript surface). The runtime itself lives in [`gmedia/usai`](https://github.com/gmedia/usai). This repository contains no runtime code.

The site has one job: **make the model understandable, and make the evidence verifiable.** Visuals and motion serve that job. If a flourish makes an idea harder to understand, remove it.

---

## 2. Commands

```bash
pnpm install           # Node ≥ 22.12 (CI uses 24), pnpm 12
pnpm dev               # http://localhost:4321
pnpm build             # static output in dist/
pnpm preview           # serve dist/
pnpm check             # astro check (types, templates) + claims/brand check
pnpm verify            # check + build + search index + claims check + internal link check (CI runs this)
pnpm sync:docs --ref vX.Y.Z [--from ../usai]   # re-render the runtime docs from a release tag
```

When an agent starts the dev server, it runs in background mode: `astro dev --background`, managed with `astro dev stop | status | logs`.

`pnpm` enforces a minimum release age. A dependency published less than a day ago is rejected. **Do not relax the policy.** Pin the previous version instead. For example, `astro` is pinned `~7.3.3` for this reason.

---

## 3. Map

```text
src/
  config/site.ts         URLs and facts repeated across the site (version, repo links, sources)
  data/benchmarks.ts     every number, copied verbatim from gmedia/usai docs/measurements
  data/snippets.ts       code shown on the site (from the usai README, examples, GUIDE, runtime source)
  content/blog/<lang>/   blog posts (Markdown); schema + evidence box in src/content.config.ts
  content/docs/          GENERATED: gmedia/usai docs at a release tag (scripts/sync-docs.mjs) — never edit
  data/docs-source.json  which tag/commit the docs (and the site's version) come from
  data/docs-nav.ts       the /docs sidebar, grouped by reader (maintainer docs collapsed), with a one-line blurb per page (EN/ID)
  i18n/en.ts             English copy, the source of truth for shape (Dict)
  i18n/id.ts             Bahasa Indonesia, same shape (TypeScript enforces it)
  i18n/index.ts          locales, localePath(), parseRich() ([[term]] **bold** `code`)
  layouts/Base.astro     <html>, SEO, header, footer, global scripts
  components/            Seo, Header, Footer, Term (glossary popover), Rich, CodeWindow, …
  components/home/       one file per home-page section
  components/islands/    React islands: CounterProbe, BenchmarkChart
  views/                 one view per page, rendered for each locale
  pages/                 thin wrappers: /x.astro → <View lang="en">, /id/x.astro → <View lang="id">
  pages/blog/, pages/id/blog/  blog index, posts ([slug].astro), rss.xml.ts
  pages/docs/            /docs index + [...slug].astro for every synced page (English only; /id/docs is the index)
  middleware.ts          external links get target="_blank" rel="noopener" on the rendered HTML
  pages/og/[slug].png.ts build-time Open Graph images (satori + resvg), one per page and post
  pages/llms.txt.ts, robots.txt.ts, manifest.webmanifest.ts
  scripts/               motion.ts (Lenis + IO reveals), hero-scene.ts (WebGL), ui.ts (copy, tabs)
  styles/global.css      Tailwind v4 @theme brand tokens + base components
scripts/check-content.mjs  claims & brand guard (CI)
scripts/check-links.mjs    every internal link and #anchor in dist/ resolves (CI)
scripts/sync-docs.mjs      docs sync from gmedia/usai; .github/workflows/sync-docs.yml opens a PR on each release
public/                  brand assets, favicons, CNAME
```

---

## 4. Copy & claims: non-negotiable

These rules come from the runtime repository (`AGENTS.md` §6, ADR-0008, `docs/brand/README.md`). `scripts/check-content.mjs` enforces the mechanical part in CI.

- The descriptor is **"A workload-native application runtime"**. Usai is **not an "AI runtime"**. The old brand-sheet lines "a world-scale, native AI runtime" and "a world where positive AI transforms humanity" are wrong and must never appear.
- The manifesto is **"A program should live only as long as its work requires."**
- The site must **not** say:
  - "production-ready";
  - "internet-scale";
  - "faster than Node / Bun / Deno / PHP / Rust" as a general claim;
  - "sandbox", "secure isolation" or "tenant isolation". A fresh world is *semantic* isolation, a correctness property.
- **Every number traces to a source.** Numbers live in `src/data/benchmarks.ts` (or `config/site.ts`), each block cites its upstream file, and the page links the source next to the number. Never round up, extrapolate or invent. When upstream prose disagrees with an upstream table, the **table wins**, and you record the discrepancy in `docs/DATA-SOURCES.md`. Example: the sweep's "ahead from c = 8 on every class" versus class D.
- **Show losses the same way as wins.** The benchmark sections show where Usai is behind (CPU per request, Node × 8, axum, pure validation, c = 1).
- The research repository is **private**. Never name it, link it, or quote numbers that are only in it. Say "the research programme". Research numbers may appear only if `gmedia/usai` publishes them (`docs/RESEARCH-REFERENCE.md`), inside a research section, with their caveats (single core; full envelope through c = 16).
- Keep engine internals out of the main copy: Wasmtime, Wizer, copy-on-write pages, R1/R2/R3. The model is the message. The substrate is an implementation detail that may change.
- Governance: Usai is maintained by the **Sakala maintainers**; gmedia is a **sponsor, not the author**. Nothing on the site speaks in gmedia's name.
- Voice: **precise, honest, calm, technical**. No hype, no exclamation marks, no "revolutionary".
- Blog posts carry an **evidence box** (status, setup, supports, does not support, sources). A claim that is not in `supports` does not belong in the post. See `docs/PUBLISHING.md`.
- Runtime output shown on the site (error messages, CLI banners) is quoted from the runtime source or a real log, never from design documents.
- **Link to the docs on this site**, not to `.md` files on GitHub: use `docsPath()` / `sources.*` from `src/config/site.ts`. GitHub is for the repository, releases, issues and non-Markdown files.
- The synced docs are the runtime repository's own words and are exempt from the claims check; fix them upstream, never here.

## 5. Hard words must be solved on the page

A visitor who has never heard of "lease", "p99" or "admission" must be able to follow along.

- Every non-obvious term has an entry in `glossary.terms` (both locales) with a **plain one-liner**, an **everyday analogy** and a **technical definition**.
- In copy, mark the first use in a section with `[[key]]` or `[[key|label]]`. `Rich.astro` turns it into an inline `Term` popover and links it to `/glossary/#key`. Use a lower-case label mid-sentence (`[[lease|lease]]`).
- If you introduce a new hard word, add the glossary entry in the same change. `Term.astro` throws at build time on unknown keys.

## 6. Brand

- The source of truth is `gmedia/usai` `docs/brand/`, mirrored to `public/brand/`. Do not redraw, recolour, stretch, outline or add effects to the mark. The wordmark is a drawing: never retype "USAI" in a font.
- Colour roles on this dark site, as Tailwind tokens in `src/styles/global.css`:
  - `deep` #083D3A: surfaces;
  - `teal` #0E7A72: buttons and links;
  - `mint` #2DD4BF: glow, highlight, "Usai" in charts;
  - `caution` #F2C572: costs, limits and negatives, used sparingly.
- **Add no new hues.**
- Type: Plus Jakarta Sans (headings), Inter (body), JetBrains Mono (code/eyebrows). All are self-hosted via Fontsource.

## 7. i18n

- Locales: `en` (default, no prefix) and `id` (`/id/…`). The configuration is in `astro.config.mjs` and `src/i18n/index.ts`.
- All user-visible strings live in `src/i18n/{en,id}.ts`. `id.ts` is typed as `Dict`, so a missing or extra key fails `astro check`.
- A new page needs a view in `src/views/`, two wrappers (`src/pages/x.astro`, `src/pages/id/x.astro`), an OG entry in `pages/og/[slug].png.ts`, and a nav/footer link if it is primary.
- Build every internal link with `localePath(lang, '/path/')`, never by hand.
- See `docs/I18N.md` for tone and terminology per language.

## 8. SEO

Every page goes through `Base.astro` → `Seo.astro`, which emits:

- title, description and canonical;
- `hreflang` for each locale plus `x-default`;
- Open Graph and Twitter tags with a per-page, per-locale OG image;
- JSON-LD (`WebSite`, `Organization`, `WebPage`, plus page nodes: `SoftwareSourceCode`, `Dataset`, `DefinedTermSet`, `BreadcrumbList`).

`@astrojs/sitemap` emits an i18n-aware sitemap. `robots.txt` and `llms.txt` are generated.

Keep one `<h1>` per page and headings in order.

## 9. Motion, performance, accessibility

- **Mobile first.** Check 360 px. There must be no horizontal page scroll; `.grid > *` and `.flex > *` have `min-width: 0` for this reason.
- JavaScript budget:
  - Astro ships zero JS by default.
  - React only for islands that need state (`client:visible`).
  - The hero is one raw WebGL fragment shader. We chose not to use three.js because it is ~120 KB for a background.
  - Lenis and the IntersectionObserver reveals run site-wide and are skipped under `prefers-reduced-motion`. Reveals must not read layout: no per-element ScrollTrigger (it cost ~2 s of mobile style/layout).
  - The hero shader skips software GL (SwiftShader, llvmpipe) and uses sine-free hashes with `highp` so low-precision GPUs do not break the noise into steps. `?hero-force` renders it anyway for QA.
- Content must be fully readable **without JavaScript**. `[data-reveal]` hides content only when `html.js-motion` is set, and a 2.5 s safety timer removes that class if motion never starts.
- Canvas and animation pause off-screen and in background tabs. DPR is capped (1 on phones, 1.5 elsewhere).
- Accessibility:
  - visible focus (mint outline);
  - skip link;
  - tabs with arrow keys;
  - `aria-live` on the counter demo;
  - charts have a table view;
  - popovers are native (`popover`), dismissable with Esc;
  - colour contrast AA against `ink` (#03110F).

## 10. Astro 7 notes

- The compiler (Rust) is strict: unclosed tags fail the build and markup is not auto-corrected. JSX whitespace rules apply: a newline between inline elements does **not** render a space.
- `Term.astro` renders on one line on purpose so no stray whitespace appears around terms.

## 11. When gmedia/usai releases

1. `pnpm sync:docs --ref vX.Y.Z` (the `sync-docs` workflow does this and opens a PR). The site's version and release date come from `src/data/docs-source.json`, so this also bumps them.
2. Read what changed in `SUPPORTED.md`, `docs/STATUS.md` and `docs/measurements/` since the previous tag (`git diff vA vB -- docs SUPPORTED.md`). Update `src/data/benchmarks.ts` **verbatim**, then the copy that cites it, in both locales. Corrections upstream (e.g. the voided 48 MiB floor in v0.0.9) must reach the site in the same PR.
3. Check `src/data/snippets.ts` against the current SDK (`/docs/sdk/`).
4. `pnpm verify`.

## 12. Definition of done

- `pnpm verify` passes: types, build and the claims check.
- Both locales are updated; new hard words are in the glossary.
- The change was checked at 360 px and 1440 px, with and without reduced motion.
- New numbers cite their source in code **and** on the page.

## 13. Astro documentation

Full documentation: https://docs.astro.build. Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
