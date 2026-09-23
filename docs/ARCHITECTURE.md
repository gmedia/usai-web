# Architecture

The site is a static Astro 7 build. Every page is HTML at build time. JavaScript only adds behaviour on top.

## Rendering

```text
src/pages/benchmarks.astro      ──► <View lang="en" />   ──► /benchmarks/
src/pages/id/benchmarks.astro   ──► <View lang="id" />   ──► /id/benchmarks/
                                        │
                     src/views/Benchmarks.astro
                                        │
                  Base.astro (Seo, Header, Footer, scripts)
```

Views take a `lang` prop and read every string from `t(lang)`. Pages are one-line wrappers, so adding a locale means adding a folder of wrappers and a dictionary.

## Copy pipeline

Dictionary strings may contain a tiny markup language, parsed by `parseRich()` in `src/i18n/index.ts`:

| Markup | Renders as |
|---|---|
| `[[world]]` | glossary term, label from the glossary |
| `[[lease\|lease]]` | glossary term with a custom label |
| `**text**` | strong |
| `` `code` `` | inline code |

`Rich.astro` renders it. `Term.astro` renders a term as a button that opens a native `popover` card (plain meaning, analogy, and a link to `/glossary/#key`). The card is anchored with CSS anchor positioning where supported and falls back to a bottom sheet. It needs no JavaScript.

## Interactivity

| Piece | Tech | Why |
|---|---|---|
| Counter probe | React island, `client:visible` | Stateful demo of the sweep's correctness probe |
| Benchmark explorer | React island, `client:visible` | Class × concurrency selection, table fallback |
| Hero background | Raw WebGL fragment shader (`scripts/hero-scene.ts`), loaded on idle | Silhouettes = persistent runtime; sparks = worlds that are born and end. ≈2 KB instead of ~120 KB for three.js |
| Request pipeline | Sticky panel + `IntersectionObserver` (`Pipeline.astro`) | Step state works with reduced motion; only transitions are animated |
| Smooth scroll, reveals | Lenis + IntersectionObserver + CSS transitions (`scripts/motion.ts`) | Reveals never read layout (GSAP ScrollTrigger was measured at ~2 s of mobile style/layout work and removed). Skipped under `prefers-reduced-motion` |
| Copy buttons, tabs | Vanilla (`scripts/ui.ts`) | Tiny, accessible (arrow keys, `aria-selected`) |
| Glossary filter | Inline script in `Glossary.astro` | Filters server-rendered cards |

## SEO outputs

- `Seo.astro`:
  - canonical;
  - `hreflang` (en, id, x-default);
  - Open Graph and Twitter tags;
  - JSON-LD graph: `WebSite`, `Organization`, `WebPage`, and per page `SoftwareSourceCode`/`SoftwareApplication` (home), `Dataset` (benchmarks), `DefinedTermSet` (glossary), `BreadcrumbList` (sub-pages).
- `pages/og/[slug].png.ts`: 1200×630 PNG per page × locale, rendered at build time with satori + resvg using the brand fonts.
- `@astrojs/sitemap`: `sitemap-index.xml` with `xhtml:link` alternates.
- `robots.txt`, `llms.txt` (a plain summary for language-model crawlers), `manifest.webmanifest`.

## Deployment

GitHub Pages via `.github/workflows/deploy.yml` on push to `main`. The custom domain is `usai.sakala.dev` (`public/CNAME`). DNS: a `CNAME` record `usai` → `gmedia.github.io`. There is no base path. If the domain changes, update `site` in `astro.config.mjs`, `site.url` in `src/config/site.ts`, and `public/CNAME`.

GitHub Pages serves one `/404.html` for all paths, so the 404 page speaks both languages.
