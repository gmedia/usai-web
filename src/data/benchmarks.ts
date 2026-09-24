/**
 * Numbers copied verbatim from gmedia/usai docs/measurements/2026-09-23-sweep.md
 * (commit 8acb9ed, VM 47: Xeon E5-2680 v4, server pinned to 8 cpus,
 * PostgreSQL 18, 20 s per cell). Requests per second unless noted.
 *
 * Do not round, "improve" or extrapolate these. If the upstream document
 * changes, change this file in the same PR and update `measuredAt`.
 */

export const measuredAt = '2026-09-23';

export type ClassId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type Conc = 1 | 16 | 64;
export type Runtime =
  | 'usai'
  | 'node'
  | 'nodeCluster'
  | 'bun'
  | 'deno'
  | 'axum'
  | 'phpTuned'
  | 'laravel';

export const classIds: ClassId[] = ['A', 'B', 'C', 'D', 'E', 'F'];
export const concurrencies: Conc[] = [1, 16, 64];

export const runtimeLabels: Record<Runtime, string> = {
  usai: 'Usai',
  node: 'Node (1 process)',
  nodeCluster: 'Node × 8 (cluster)',
  bun: 'Bun',
  deno: 'Deno',
  axum: 'Rust axum',
  phpTuned: 'PHP-FPM (tuned)',
  laravel: 'Laravel 12',
};

/** What each class asks the server to do (route in the harness). */
export const classRoutes: Record<ClassId, string> = {
  A: 'GET /hello/world',
  B: 'POST /orders/quote',
  C: 'GET /users/:id',
  D: 'POST /users',
  E: 'POST /orders/:id/pay',
  F: 'GET /me',
};

type Row = Partial<Record<Runtime, number>>;

/** Scoreboard + the PHP re-run + Laravel (c=64 only). */
export const throughput: Record<ClassId, Record<Conc, Row>> = {
  A: {
    1: { usai: 1319, node: 3250, nodeCluster: 3137, bun: 3592, deno: 3573, axum: 3828, phpTuned: 690 },
    16: { usai: 15172, node: 12587, nodeCluster: 87587, bun: 27908, deno: 26300, axum: 116891, phpTuned: 10925 },
    64: { usai: 14843, node: 12730, nodeCluster: 106449, bun: 30322, deno: 27730, axum: 164721, phpTuned: 12684, laravel: 2089 },
  },
  B: {
    1: { usai: 851, node: 1935, nodeCluster: 1723, bun: 2143, deno: 2120, axum: 2412, phpTuned: 755 },
    16: { usai: 8331, node: 8354, nodeCluster: 59392, bun: 14059, deno: 13603, axum: 98598, phpTuned: 10770 },
    64: { usai: 8614, node: 8360, nodeCluster: 62101, bun: 15227, deno: 11494, axum: 164665, phpTuned: 12643, laravel: 1469 },
  },
  C: {
    1: { usai: 663, node: 1495, nodeCluster: 1462, bun: 1842, deno: 1650, axum: 2082, phpTuned: 593 },
    16: { usai: 7539, node: 6202, nodeCluster: 14340, bun: 9143, deno: 8750, axum: 27266, phpTuned: 6249 },
    64: { usai: 7023, node: 6327, nodeCluster: 13971, bun: 8785, deno: 8934, axum: 25480, phpTuned: 5908, laravel: 1727 },
  },
  D: {
    1: { usai: 173, node: 194, nodeCluster: 203, bun: 215, deno: 191, axum: 207, phpTuned: 168 },
    16: { usai: 1392, node: 1573, nodeCluster: 1493, bun: 1743, deno: 1701, axum: 1609, phpTuned: 1384 },
    64: { usai: 2385, node: 2818, nodeCluster: 2680, bun: 2652, deno: 2938, axum: 2892, phpTuned: 2385, laravel: 1316 },
  },
  E: {
    1: { usai: 142, node: 165, nodeCluster: 175, bun: 161, deno: 162, axum: 183, phpTuned: 158 },
    16: { usai: 3032, node: 2980, nodeCluster: 4394, bun: 1929, deno: 1854, axum: 5268, phpTuned: 2612 },
    64: { usai: 4216, node: 2607, nodeCluster: 5145, bun: 3949, deno: 3393, axum: 7265, phpTuned: 2738, laravel: 1327 },
  },
  F: {
    1: { usai: 442, node: 1005, nodeCluster: 1011, bun: 1280, deno: 1014, axum: 1171, phpTuned: 467 },
    16: { usai: 5145, node: 4594, nodeCluster: 7378, bun: 5909, deno: 2434, axum: 11692, phpTuned: 3343 },
    64: { usai: 5344, node: 4449, nodeCluster: 6797, bun: 6395, deno: 3833, axum: 12205, phpTuned: 2961, laravel: 1673 },
  },
};

/** CPU ms per request at c=16 and RSS MiB at c=64 (classes A, C, E). */
export const cost = {
  cpuMs: {
    A: { usai: 0.515, node: 0.08, nodeCluster: 0.085, bun: 0.037, deno: 0.038, axum: 0.037 },
    C: { usai: 0.993, node: 0.163, nodeCluster: 0.266, bun: 0.114, deno: 0.118, axum: 0.095 },
    E: { usai: 1.658, node: 0.317, nodeCluster: 0.524, bun: 0.288, deno: 0.413, axum: 0.205 },
  },
  rssMiB: {
    A: { usai: 77, node: 100, nodeCluster: 792, bun: 55, deno: 75, axum: 9 },
    C: { usai: 481, node: 143, nodeCluster: 877, bun: 63, deno: 135, axum: 13 },
    E: { usai: 616, node: 189, nodeCluster: 1022, bun: 69, deno: 138, axum: 14 },
  },
} as const;

/** usai ÷ laravel at c=64. */
export const laravelRatio: Record<ClassId, string> = {
  A: '7.1×',
  B: '5.9×',
  C: '4.1×',
  D: '1.8×',
  E: '3.2×',
  F: '3.2×',
};

/** The correctness probe: a module-level counter asked for ten times. */
export const probe: { server: string; answers: string; fresh: boolean }[] = [
  { server: 'Usai', answers: '1 1 1 1 1 1 1 1 1 1', fresh: true },
  { server: 'PHP-FPM (tuned)', answers: '1 1 1 1 1 1 1 1 1 1', fresh: true },
  { server: 'Node, Bun, Deno, Rust', answers: '1 2 3 4 5 6 7 8 9 10', fresh: false },
  { server: 'Node × 8 (cluster)', answers: '1 1 1 1 1 1 1 1 2 2', fresh: false },
];

/**
 * Efficiency envelope. Density/idle: 2026-09-20-p8e-efficiency.md §5 (bare
 * processes, unaffected by the 2026-09-23 accounting correction). Floors:
 * SUPPORTED.md @ v0.0.9, re-measured on a box charged for its own page cache
 * (2026-09-23-floor-accounting.md); the earlier 48 MiB / 0.25 vCPU is void.
 */
export const efficiency = {
  idlePssMiB: 30,
  idleCpu: '0.00 %',
  nodeIdlePssMiB: 36,
  nodeIdleCpu: '0.12 %',
  apps: 50,
  coldFirstMs: '11–16',
  nodeColdFirstMs: '45–62',
  burstCpuVsNode: '≈1.7×',
  technicalFloor: '64 MiB',
  supportedFloor: '192 MiB · 1 vCPU',
};

/** Reliability, STATUS.md + 2026-09-18-p5-p6-qualification.md. */
export const reliability = {
  soak72: { requests: '73.6 M', errors5xx: 0, rssFrom: 51.5, rssTo: 53.5 },
  soak24: { requests: '35.0 M', errors: 0 },
  revisions: { replacements: 1000, requests: '2.04 M', errors: 0 },
  rolling: { replicas: 2, errors502: 0 },
  fuzz: { executions: '78 M', crashes: 0 },
  threat: { probes: 39, passed: 39 },
};

/**
 * Above the sweep's ceiling, 2026-09-23-saturation-and-queue.md (Usai only,
 * one process, default --max-worlds). [req/s, p99 ms] or 'refused'.
 */
export const saturationConcs = [64, 128, 256, 512] as const;
export const saturation: Record<ClassId, ([number, number] | 'refused')[]> = {
  A: [[15238, 7.8], [15019, 17.1], [15034, 37.5], [14976, 95.2]],
  B: [[8440, 16.4], [8606, 37.2], [8640, 79.6], [8575, 99.4]],
  C: [[7469, 12.8], [7166, 25.2], [7094, 43.8], 'refused'],
  D: [[2550, 61.9], [2766, 126.2], [2630, 227.8], [2957, 379.1]],
  E: [[4218, 50.7], [4657, 70.1], [4631, 121.1], 'refused'],
  F: [[5837, 16.5], [5900, 27.1], [5599, 56.8], 'refused'],
};

/** Research lineage (public in docs/RESEARCH-REFERENCE.md). */
export const researchLineage = {
  cpuRatio: { c1: { before: 2.08, after: 1.096 }, c64: { before: 4.382, after: 1.205 } },
  p50Ratio: { c1: { before: 1.755, after: 1.123 }, c64: { before: 4.915, after: 1.34 } },
  cells: 126,
  requests: '1.26 M',
  failures: 0,
  worlds: 64,
};
