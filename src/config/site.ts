/**
 * Facts about the project that the site repeats in many places.
 * Every value here must be verifiable in gmedia/usai (see docs/DATA-SOURCES.md).
 * Bump `usai.version`/`usai.released` when a new usai release ships.
 */
export const site = {
  url: 'https://usai.sakala.dev',
  name: 'Usai',
  repoWeb: 'https://github.com/gmedia/usai-web',
} as const;

export const usai = {
  version: '0.0.8',
  released: '2026-09-23',
  status: 'alpha',
  license: 'Apache-2.0',
  repo: 'https://github.com/gmedia/usai',
  releases: 'https://github.com/gmedia/usai/releases',
  issues: 'https://github.com/gmedia/usai/issues',
  npm: 'https://www.npmjs.com/package/@sakaladev/usai',
  npmCreate: 'https://www.npmjs.com/package/@sakaladev/create-usai',
  docker: 'https://hub.docker.com/r/sakaladev/usai',
  guide: 'https://github.com/gmedia/usai/blob/main/docs/GUIDE.md',
  sdk: 'https://github.com/gmedia/usai/tree/main/docs/sdk',
  status_doc: 'https://github.com/gmedia/usai/blob/main/docs/STATUS.md',
  supported: 'https://github.com/gmedia/usai/blob/main/SUPPORTED.md',
  roadmap: 'https://github.com/gmedia/usai/blob/main/docs/ROADMAP.md',
  governance: 'https://github.com/gmedia/usai/blob/main/GOVERNANCE.md',
  security: 'https://github.com/gmedia/usai/blob/main/SECURITY.md',
  contracts: 'https://github.com/gmedia/usai/blob/main/docs/LIFECYCLE-CONTRACTS.md',
  glossary: 'https://github.com/gmedia/usai/blob/main/docs/GLOSSARY.md',
  openQuestions: 'https://github.com/gmedia/usai/blob/main/docs/OPEN-QUESTIONS.md',
  researchReference: 'https://github.com/gmedia/usai/blob/main/docs/RESEARCH-REFERENCE.md',
  brand: 'https://github.com/gmedia/usai/tree/main/docs/brand',
  p7: 'https://github.com/gmedia/usai/blob/main/docs/P7-EXTERNAL-VALIDATION.md',
} as const;

/** Link to a file in gmedia/usai. */
export const usaiFile = (path: string) => `${usai.repo}/blob/main/${path}`;

export const sources = {
  sweep: usaiFile('docs/measurements/2026-09-23-sweep.md'),
  benchmarks: usaiFile('docs/measurements/BENCHMARKS.md'),
  efficiency: usaiFile('docs/measurements/2026-09-20-p8e-efficiency.md'),
  reliability: usaiFile('docs/measurements/2026-09-18-p5-p6-qualification.md'),
  fuzzing: usaiFile('docs/measurements/2026-09-20-fuzzing.md'),
  threat: usaiFile('docs/measurements/2026-09-23-threat-verification.md'),
  status: usaiFile('docs/STATUS.md'),
  supported: usaiFile('SUPPORTED.md'),
  researchReference: usaiFile('docs/RESEARCH-REFERENCE.md'),
  readme: usaiFile('README.md'),
} as const;

export const install = {
  create: 'pnpm dlx @sakaladev/create-usai my-app',
  createNpm: 'npm create @sakaladev/usai@latest my-app',
  dev: 'cd my-app && pnpm install && pnpm dev',
  docker: 'docker compose up',
} as const;
