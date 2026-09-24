/**
 * Facts about the project that the site repeats in many places.
 * Every value here must be verifiable in gmedia/usai (see docs/DATA-SOURCES.md).
 * On a new usai release: bump `usai.version`/`usai.released`, then
 * `pnpm sync:docs --ref vX.Y.Z` (AGENTS.md §11).
 */
import docsSource from '../data/docs-source.json';

export const site = {
  url: 'https://usai.sakala.dev',
  name: 'Usai',
  repoWeb: 'https://github.com/gmedia/usai-web',
} as const;

/** A page of the runtime documentation rendered on this site (synced at `docsSource.ref`). */
export const docsPath = (slug: string) => `/docs/${slug}/`;

export const usai = {
  // The site describes the release its docs were synced from (pnpm sync:docs).
  version: docsSource.ref.replace(/^v/, ''),
  released: docsSource.released,
  status: 'alpha',
  license: 'Apache-2.0',
  docsRef: docsSource.ref,
  repo: 'https://github.com/gmedia/usai',
  releases: 'https://github.com/gmedia/usai/releases',
  issues: 'https://github.com/gmedia/usai/issues',
  npm: 'https://www.npmjs.com/package/@sakaladev/usai',
  npmCreate: 'https://www.npmjs.com/package/@sakaladev/create-usai',
  docker: 'https://hub.docker.com/r/sakaladev/usai',
  // Documentation now lives on this site (/docs), rendered from the release tag.
  docs: '/docs/',
  guide: docsPath('guide'),
  sdk: docsPath('sdk'),
  status_doc: docsPath('status'),
  supported: docsPath('supported'),
  roadmap: docsPath('roadmap'),
  governance: docsPath('governance'),
  security: docsPath('security'),
  contracts: docsPath('lifecycle-contracts'),
  glossary: docsPath('glossary'),
  openQuestions: docsPath('open-questions'),
  researchReference: docsPath('research-reference'),
  p7: docsPath('p7-external-validation'),
  changelog: docsPath('changelog'),
  runbooks: docsPath('runbooks'),
  // Not synced (binary assets): stays on GitHub.
  brand: 'https://github.com/gmedia/usai/tree/main/docs/brand',
} as const;

/** Link to a file in gmedia/usai at the synced release tag. */
export const usaiFile = (path: string) => `${usai.repo}/blob/${docsSource.ref}/${path}`;

/** Measurement reports and other evidence, as pages of /docs. */
export const sources = {
  sweep: docsPath('measurements/2026-09-23-sweep'),
  saturation: docsPath('measurements/2026-09-23-saturation-and-queue'),
  floors: docsPath('measurements/2026-09-23-floor-accounting'),
  benchmarks: docsPath('measurements/benchmarks'),
  efficiency: docsPath('measurements/2026-09-20-p8e-efficiency'),
  reliability: docsPath('measurements/2026-09-18-p5-p6-qualification'),
  fuzzing: docsPath('measurements/2026-09-20-fuzzing'),
  threat: docsPath('measurements/2026-09-23-threat-verification'),
  boundedSoak: docsPath('measurements/2026-09-24-bounded-soak'),
  status: docsPath('status'),
  supported: docsPath('supported'),
  researchReference: docsPath('research-reference'),
  readme: usaiFile('README.md'),
} as const;

export const install = {
  create: 'pnpm dlx @sakaladev/create-usai my-app',
  createNpm: 'npm create @sakaladev/usai@latest my-app',
  dev: 'cd my-app && pnpm install && pnpm dev',
  docker: 'docker compose up',
} as const;
