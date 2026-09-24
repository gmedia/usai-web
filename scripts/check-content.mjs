#!/usr/bin/env node
/**
 * Guards the claims and brand rules (AGENTS.md → Copy & claims) on every
 * piece of copy the site ships: src/i18n/*.ts, src/data/*.ts, blog posts and the built
 * HTML when dist/ exists. Fails CI when a forbidden phrase appears.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

const FORBIDDEN = [
  { re: /\bAI[ -]runtime\b/i, why: 'Usai is a workload-native application runtime, never an "AI runtime".' },
  { re: /world-scale|positive AI|transforms humanity/i, why: 'Retired brand-sheet wording.' },
  { re: /production[- ]ready/i, why: 'Usai is alpha; "production-ready" is not a claim the project may make.' },
  { re: /\bfaster than (node|bun|deno|php|rust)/i, why: 'No general speed claims (AGENTS.md → claims).' },
  { re: /\bsandbox(ed)?\b/i, why: 'A fresh world is semantic isolation, not a sandbox (ADR-0008).' },
  { re: /secure isolation|tenant isolation/i, why: 'Forbidden security wording (ADR-0008).' },
  { re: /internet[- ]scale/i, why: 'Not an established claim.' },
];

// Exact sentences that name a forbidden claim in order to reject it (the
// research "does not establish" list, the brand "Please don't" list). Keep
// this list short and explicit; anything else containing a phrase fails.
const ALLOWED = [
  'That Usai is production-ready.',
  'That Usai is generally faster than Node, Bun, Deno, PHP or Rust.',
  'Bahwa Usai production-ready.',
  'Bahwa Usai secara umum lebih cepat dari Node, Bun, Deno, PHP, atau Rust.',
  'Any security boundary. A fresh world is a correctness property, not a sandbox.',
  'Batas keamanan apa pun. World yang baru adalah properti correctness, bukan sandbox.',
  'Call Usai an “AI runtime”. It is a workload-native application runtime.',
  'Menyebut Usai “AI runtime”. Usai adalah workload-native application runtime.',
  'Do not describe it as production-ready or as generally faster than Node, Bun, Deno, PHP or Rust.',
  'Important: Usai is NOT an "AI runtime".',
  'Its isolation is semantic (a correctness property), not a security boundary.',
];

const files = [];
const walk = (dir, exts) => {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, exts);
    else if (exts.some((e) => p.endsWith(e))) files.push(p);
  }
};
walk(join(root, 'src/i18n'), ['.ts']);
walk(join(root, 'src/data'), ['.ts']);
walk(join(root, 'src/content/blog'), ['.md', '.mdx']);
walk(join(root, 'src/components'), ['.astro', '.tsx']);
walk(join(root, 'src/views'), ['.astro']);
walk(join(root, 'dist'), ['.html', '.txt']);
// Upstream documentation (src/content/docs, dist/docs) is the runtime
// repository's own text, synced verbatim; its claims are governed there.
for (let i = files.length - 1; i >= 0; i--) if (/[\\/]dist[\\/]docs[\\/]|[\\/]dist[\\/]pagefind[\\/]/.test(files[i])) files.splice(i, 1);

let failures = 0;
for (const file of files) {
  let text = readFileSync(file, 'utf8');
  for (const ok of ALLOWED) text = text.split(ok).join('');
  // Built HTML is one long line; split on tags/sentences to keep context local.
  const lines = file.endsWith('.html') ? text.split(/(?<=[.!?])\s+|<\/(?:p|li|h\d|dd|dt|td|th)>/) : text.split('\n');
  lines.forEach((line, i) => {
    if (/^\s*(\*|\/\/|\/\*)/.test(line)) return; // code comments document the rules
    for (const rule of FORBIDDEN) {
      if (rule.re.test(line)) {
        failures++;
        const where = file.endsWith('.html') ? relative(root, file) : `${relative(root, file)}:${i + 1}`;
        console.error(`✗ ${where}\n  ${line.trim().slice(0, 160)}\n  → ${rule.why}\n`);
      }
    }
  });
}

if (failures) {
  console.error(`${failures} claims/brand violation(s). See AGENTS.md → Copy & claims.`);
  process.exit(1);
}
console.log(`✓ claims & brand check passed (${files.length} files)`);
