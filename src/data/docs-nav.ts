/**
 * Sidebar and index of /docs, organised by *who is reading*.
 *
 * Slugs are those produced by scripts/sync-docs.mjs (lower-cased upstream
 * path, README → its folder). `href` marks a page written on this site rather
 * than synced. Pages not listed here are still built and reachable from
 * their section's index (sdk/*, adr/*, runbooks/*, measurements/*); `section`
 * makes the sidebar expand for them.
 *
 * `blurb` answers "what is this page for?" in one line, in both locales; it
 * shows under the page title and on the docs index.
 */
export type GroupKey = 'start' | 'reference' | 'operate' | 'evidence' | 'maintainers';
export type NavItem = {
  slug: string;
  label: string;
  href?: string;
  section?: string;
  blurb: { en: string; id: string };
};
export type NavGroup = { key: GroupKey; collapsed?: boolean; items: NavItem[] };

export const docsNav: NavGroup[] = [
  {
    key: 'start',
    items: [
      {
        slug: 'start',
        href: '/docs/start/',
        label: 'Start here',
        blurb: { en: 'Install, your first endpoint, and the five ideas you need — in ten minutes.', id: 'Install, endpoint pertama, dan lima ide yang perlu kamu tahu — dalam sepuluh menit.' },
      },
      {
        slug: 'guide',
        label: 'Developer guide',
        blurb: { en: 'The full manual: every kind of work, PostgreSQL, queues, sockets, testing and operating.', id: 'Manual lengkap: semua jenis pekerjaan, PostgreSQL, queue, socket, testing, dan operasional.' },
      },
      {
        slug: 'supported',
        label: 'Supported platforms',
        blurb: { en: 'Which OS, versions and machine sizes are supported — and what is not, before 1.0.', id: 'OS, versi, dan ukuran mesin yang didukung — serta yang belum, sebelum 1.0.' },
      },
      {
        slug: 'changelog',
        label: 'Changelog',
        blurb: { en: 'What changed in each release, and what behaves differently after upgrading.', id: 'Apa yang berubah di setiap rilis, dan apa yang berperilaku berbeda setelah upgrade.' },
      },
    ],
  },
  {
    key: 'reference',
    items: [
      {
        slug: 'sdk',
        label: 'SDK reference',
        section: 'sdk/',
        blurb: { en: 'Every export of @sakaladev/usai, /test and /config, with its signature and an example.', id: 'Setiap export @sakaladev/usai, /test, dan /config, lengkap dengan signature dan contoh.' },
      },
      {
        slug: 'environment',
        label: 'Environment variables',
        blurb: { en: 'Every USAI_* variable the runtime, the CLI and the launcher read.', id: 'Setiap variabel USAI_* yang dibaca runtime, CLI, dan launcher.' },
      },
      {
        slug: 'glossary',
        label: 'Glossary',
        blurb: { en: 'The runtime’s vocabulary. For plain-language explanations, see the site glossary.', id: 'Kosakata runtime. Untuk penjelasan sederhana, lihat glosarium situs.' },
      },
      {
        slug: 'lifecycle-contracts',
        label: 'Lifecycle contracts',
        blurb: { en: 'The rules the runtime promises to keep (C1–C18) — the “why” behind its behaviour.', id: 'Aturan yang dijanjikan runtime (C1–C18) — “kenapa” di balik perilakunya.' },
      },
      {
        slug: 'control-api',
        label: 'Control API',
        blurb: { en: 'For orchestrators: install, activate, drain and stop revisions over HTTP.', id: 'Untuk orkestrator: install, aktifkan, drain, dan hentikan revisi lewat HTTP.' },
      },
    ],
  },
  {
    key: 'operate',
    items: [
      {
        slug: 'runbooks',
        label: 'Runbooks',
        section: 'runbooks/',
        blurb: { en: 'What to do when something is wrong in production — one page per incident.', id: 'Apa yang harus dilakukan saat ada masalah di produksi — satu halaman per insiden.' },
      },
      {
        slug: 'threat-model',
        label: 'Threat model',
        blurb: { en: 'What the runtime defends against, and what it does not — read before deploying.', id: 'Apa yang dilindungi runtime, dan apa yang tidak — baca sebelum deploy.' },
      },
      {
        slug: 'security',
        label: 'Security policy',
        blurb: { en: 'How to report a vulnerability, and what is in scope.', id: 'Cara melaporkan kerentanan, dan apa yang termasuk cakupannya.' },
      },
    ],
  },
  {
    key: 'evidence',
    items: [
      {
        slug: 'measurements',
        label: 'Measurements',
        section: 'measurements/',
        blurb: { en: 'The dated benchmark and qualification reports behind every number on this site.', id: 'Laporan benchmark dan kualifikasi bertanggal di balik setiap angka di situs ini.' },
      },
      {
        slug: 'adr',
        label: 'Decision records',
        section: 'adr/',
        blurb: { en: 'Why the runtime is built the way it is, one decision per page.', id: 'Kenapa runtime dibangun seperti ini, satu keputusan per halaman.' },
      },
    ],
  },
  {
    key: 'maintainers',
    collapsed: true,
    items: [
      {
        slug: 'status',
        label: 'Status',
        blurb: { en: 'The maintainers’ working log: where every gate stands. Dense by design.', id: 'Log kerja maintainer: posisi setiap gerbang. Memang padat.' },
      },
      {
        slug: 'roadmap',
        label: 'Roadmap',
        blurb: { en: 'The phases to a stable release and what each must prove.', id: 'Tahapan menuju rilis stabil dan apa yang harus dibuktikan tiap tahap.' },
      },
      {
        slug: 'contract-freeze',
        label: 'Contract freeze',
        blurb: { en: 'What 1.0 would freeze, surface by surface.', id: 'Apa yang akan dibekukan di 1.0, per permukaan.' },
      },
      {
        slug: 'open-questions',
        label: 'Open questions',
        blurb: { en: 'Design questions that are still undecided.', id: 'Pertanyaan desain yang belum diputuskan.' },
      },
      {
        slug: 'acceptance-audit',
        label: 'Acceptance audit',
        blurb: { en: 'Which acceptance items have automated evidence, and which are gaps.', id: 'Item penerimaan mana yang punya bukti otomatis, dan mana yang masih celah.' },
      },
      {
        slug: 'p7-external-validation',
        label: 'External validation (P7)',
        blurb: { en: 'How developers outside the project are invited to test Usai from the docs alone.', id: 'Cara developer dari luar proyek diundang menguji Usai hanya dari dokumentasi.' },
      },
      {
        slug: 'research-reference',
        label: 'Research reference',
        blurb: { en: 'Map from the runtime’s contracts to the research evidence behind them.', id: 'Peta dari kontrak runtime ke bukti riset di baliknya.' },
      },
      {
        slug: 'guest-abi',
        label: 'Guest ABI',
        blurb: { en: 'The internal contract between the host and the JavaScript inside a world.', id: 'Kontrak internal antara host dan JavaScript di dalam world.' },
      },
      {
        slug: 'upstream',
        label: 'Upstream patches',
        section: 'upstream/',
        blurb: { en: 'Changes contributed to the engine the runtime builds on.', id: 'Perubahan yang dikontribusikan ke engine yang dipakai runtime.' },
      },
      {
        slug: 'governance',
        label: 'Governance',
        blurb: { en: 'Who maintains Usai and how decisions are made.', id: 'Siapa yang mengelola Usai dan bagaimana keputusan dibuat.' },
      },
    ],
  },
];

export const allNavItems = docsNav.flatMap((g) => g.items.map((i) => ({ ...i, group: g.key })));

/** Linear reading order for previous/next links (synced pages only). */
export const docsOrder = allNavItems.filter((i) => !i.href).map((i) => i.slug);

/** The nav item a doc slug belongs to (itself, or the section that contains it). */
export function navItemFor(slug: string) {
  return allNavItems.find((i) => i.slug === slug) ?? allNavItems.find((i) => i.section && slug.startsWith(i.section));
}
