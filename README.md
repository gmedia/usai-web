<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/brand/usai-logo-on-dark.svg">
    <img src="public/brand/usai-logo.svg" alt="Usai — a workload-native application runtime" width="400">
  </picture>
</p>

<p align="center"><strong>The website of Usai</strong> · <a href="https://usai.sakala.dev">usai.sakala.dev</a></p>

> **A program should live only as long as its work requires.**

This repository is the source of **usai.sakala.dev**, the public site of [Usai](https://github.com/gmedia/usai). Usai is an open-source workload-native application runtime: a persistent Rust host, an immutable application definition, and a fresh execution world for every request, task and message.

The runtime lives in [`gmedia/usai`](https://github.com/gmedia/usai). This repository contains only the website.

## What is on the site

| Page | What it explains |
|---|---|
| `/` | The model, the request pipeline (animated), workload lifetimes, ownership, code, evidence, quickstart |
| `/benchmarks/` | Throughput across six workload classes, CPU and memory cost, the correctness probe, what is *not* measured |
| `/research/` | How the model was tested before the runtime was built, negatives included |
| `/glossary/` | Every hard term, in plain language first, then technically |
| `/brand/` | Logos, colours and usage |

Every page exists in **English** (`/`) and **Bahasa Indonesia** (`/id/`).

## Stack

- [Astro 7](https://astro.build): static output, zero JS by default
- React islands for the interactive parts (the counter probe, the benchmark explorer)
- Tailwind CSS v4 with the Usai brand tokens
- Lenis smooth scrolling and IntersectionObserver + CSS reveals, all skipped under `prefers-reduced-motion`
- A single raw WebGL shader for the hero, with no 3D library
- Build-time Open Graph images (satori + resvg), an i18n sitemap, JSON-LD, `llms.txt`
- Deployed to GitHub Pages (`.github/workflows/deploy.yml`)

## Develop

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm verify     # types + build + claims/brand check — run before opening a PR
```

Requires Node ≥ 22.12 (CI uses Node 24) and pnpm 12.

## Contributing

Contributions are welcome, especially:

- **translations**;
- **clearer explanations of hard terms**;
- **accessibility fixes**;
- **corrections to any number that does not match its source**.

Start with [CONTRIBUTING.md](CONTRIBUTING.md). [AGENTS.md](AGENTS.md) is the full working agreement and applies to humans and coding agents alike.

The short version of the content rules:

- Usai is **a workload-native application runtime**, never "an AI runtime".
- No "production-ready", no general "faster than X", no "sandbox".
- Every number links to its source in [`gmedia/usai`](https://github.com/gmedia/usai/tree/main/docs/measurements), and losses are shown like wins.

## Governance

Usai is an independent open-source project in the Sakala ecosystem, maintained by the Sakala maintainers. The repositories are hosted in the gmedia organization, which supports the project without steering it. See the runtime's [GOVERNANCE.md](https://github.com/gmedia/usai/blob/main/GOVERNANCE.md).

## License

[Apache-2.0](LICENSE). The Usai name and logo are used here under the project's brand guidelines (`/brand/`).
