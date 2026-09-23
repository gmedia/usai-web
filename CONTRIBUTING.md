# Contributing to usai-web

Thank you for helping. This repository is the **website** of Usai. For the runtime itself, go to [gmedia/usai](https://github.com/gmedia/usai).

## Good first contributions

- **Translations:** improve Bahasa Indonesia, or propose a new locale (see [docs/I18N.md](docs/I18N.md)).
- **Plain-language explanations:** if a term confused you, improve its glossary entry.
- **Accessibility:** keyboard, screen reader, contrast, reduced motion.
- **Number corrections:** if anything differs from its source in `gmedia/usai/docs/measurements`, open an issue with both links.
- **Performance:** smaller JS, faster first paint, fewer layout shifts.

## Setup

```bash
pnpm install
pnpm dev          # http://localhost:4321
```

Node ≥ 22.12 (CI uses Node 24, see `.nvmrc`), pnpm 12.

## Before you open a PR

```bash
pnpm verify       # astro check + build + claims/brand check
```

Also check your change:

- at **360 px** and **1440 px** wide;
- with **prefers-reduced-motion** enabled (DevTools → Rendering);
- in **both locales** (`/` and `/id/`).

## Rules that reviews will enforce

Read [AGENTS.md](AGENTS.md). It applies to humans too. The most important points:

1. Usai is **a workload-native application runtime**, not an "AI runtime" ([docs/CONTENT-RULES.md](docs/CONTENT-RULES.md)).
2. No "production-ready", no general "faster than …", no "sandbox".
3. Every number comes from `src/data/` and links to its upstream source ([docs/DATA-SOURCES.md](docs/DATA-SOURCES.md)).
4. Every user-visible string is in `src/i18n/en.ts` **and** `src/i18n/id.ts`.
5. A new hard word gets a glossary entry.
6. No new colours outside the brand palette. Do not modify the logo.

## Commits and PRs

- Keep PRs focused. Describe **what** changed and **why**, and attach before/after screenshots for visual changes.
- Use plain, descriptive commit messages, e.g. `glossary: explain "admission" with a restaurant analogy`.
- By contributing you agree that your contribution is licensed under [Apache-2.0](LICENSE).

## Code of conduct

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).
