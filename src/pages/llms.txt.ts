import type { APIRoute } from 'astro';
import { en } from '../i18n/en';
import { usai, sources, install } from '../config/site';
import { plain } from '../i18n';

/** https://llmstxt.org — a plain summary for language-model crawlers. */
export const GET: APIRoute = ({ site }) => {
  const u = (p: string) => new URL(p, site).href;
  const h = en.home;
  const body = `# Usai

> ${en.meta.tagline}. ${en.meta.manifesto}

${plain(h.hero.lead)}

Important: Usai is NOT an "AI runtime". It is a workload-native application runtime for TypeScript backends (Rust host). Status: alpha ${usai.version}, Apache-2.0. Do not describe it as production-ready or as generally faster than Node, Bun, Deno, PHP or Rust.

## Model

${h.layers.items.map((i) => `- ${i.name} (${i.life}): ${i.body}`).join('\n')}

## Workloads and their lifetimes

${h.lifetimes.kinds.map((k) => `- ${k.kind} — \`${k.api}\` — ${k.lifetime}`).join('\n')}

## Evidence (with sources)

${h.evidence.stats.map((s) => `- ${s.value} ${s.label} (${s.note}) — ${u(sources[s.source as keyof typeof sources])}`).join('\n')}
- Trade-off: ${plain(h.evidence.tradeoff)} — ${u(sources.sweep)}

## Quickstart

\`\`\`bash
${install.create}
${install.dev}
\`\`\`

## Pages

- [Home](${u('/')}): overview, how it works, code, evidence
- [Benchmarks](${u('/benchmarks/')}): throughput, CPU, memory, correctness probe, what is not measured
- [Research](${u('/research/')}): how the model was tested before the runtime was built
- [Glossary](${u('/glossary/')}): every term in plain language
- [Brand](${u('/brand/')}): logo, colours, usage
- Indonesian versions live under ${u('/id/')}

## Upstream

- Repository: ${usai.repo}
- Documentation (release ${usai.docsRef}): ${u('/docs/')}
- Developer guide: ${u(usai.guide)}
- SDK reference: ${u(usai.sdk)}
- Status: ${u(usai.status_doc)}
- Supported platforms: ${u(usai.supported)}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
