/**
 * Sidebar of /docs. Slugs are those produced by scripts/sync-docs.mjs
 * (lower-cased upstream path, README → its folder). Pages not listed here are
 * still built and linked from their section's index (sdk/*, adr/*, runbooks/*,
 * measurements/*); `section` makes the sidebar expand for them.
 */
export type NavGroup = { key: 'start' | 'reference' | 'operate' | 'project' | 'decisions'; items: NavItem[] };
export type NavItem = { slug: string; label: string; section?: string };

export const docsNav: NavGroup[] = [
  {
    key: 'start',
    items: [
      { slug: 'guide', label: 'Developer guide' },
      { slug: 'supported', label: 'Supported platforms' },
      { slug: 'changelog', label: 'Changelog' },
    ],
  },
  {
    key: 'reference',
    items: [
      { slug: 'sdk', label: 'SDK reference', section: 'sdk/' },
      { slug: 'environment', label: 'Environment variables' },
      { slug: 'control-api', label: 'Control API' },
      { slug: 'lifecycle-contracts', label: 'Lifecycle contracts' },
      { slug: 'glossary', label: 'Glossary' },
      { slug: 'guest-abi', label: 'Guest ABI' },
    ],
  },
  {
    key: 'operate',
    items: [
      { slug: 'runbooks', label: 'Runbooks', section: 'runbooks/' },
      { slug: 'threat-model', label: 'Threat model' },
      { slug: 'security', label: 'Security policy' },
    ],
  },
  {
    key: 'project',
    items: [
      { slug: 'status', label: 'Status' },
      { slug: 'roadmap', label: 'Roadmap' },
      { slug: 'contract-freeze', label: 'Contract freeze' },
      { slug: 'open-questions', label: 'Open questions' },
      { slug: 'acceptance-audit', label: 'Acceptance audit' },
      { slug: 'p7-external-validation', label: 'External validation (P7)' },
      { slug: 'governance', label: 'Governance' },
    ],
  },
  {
    key: 'decisions',
    items: [
      { slug: 'adr', label: 'Decision records (ADRs)', section: 'adr/' },
      { slug: 'measurements', label: 'Measurements', section: 'measurements/' },
      { slug: 'research-reference', label: 'Research reference' },
      { slug: 'upstream', label: 'Upstream patches', section: 'upstream/' },
    ],
  },
];

/** Linear reading order for previous/next links. */
export const docsOrder = docsNav.flatMap((g) => g.items.map((i) => i.slug));
