# Data sources

Every number on the site comes from a file in [`gmedia/usai`](https://github.com/gmedia/usai). This table maps site data to its origin. Update both sides together.

| Site data | Upstream | Notes |
|---|---|---|
| `throughput`, `cost`, `laravelRatio`, `probe` in `src/data/benchmarks.ts` | `docs/measurements/2026-09-23-sweep.md` (commit `8acb9ed`) | Copied verbatim; PHP rows from the same-day re-run |
| `efficiency` | `docs/measurements/2026-09-20-p8e-efficiency.md` §5 (density, idle); floors from `SUPPORTED.md` @ v0.0.9 and `2026-09-23-floor-accounting.md` | ≈30 MiB PSS / 0.00 % CPU per idle app at N = 50 (bare processes, unaffected by the correction). Floors re-measured on a box charged for its own page cache: **192 MiB · 1 vCPU** supported, **64 MiB** technical. The 48 MiB · 0.25 vCPU of 2026-09-20 is **void** — never quote it |
| `saturation` | `docs/measurements/2026-09-23-saturation-and-queue.md` | Usai only, c = 64 → 512; `'refused'` = 503 by the overload contract |
| `reliability` | `docs/STATUS.md`, `docs/measurements/2026-09-18-p5-p6-qualification.md`, `-fuzzing.md`, `-threat-verification.md` | "0 × 502" is the **two-replica** rolling restart; a single replica has a restart window. Threat probes: **42/42** at v0.0.10 (39 at v0.0.9, 35 at v0.0.8). The 24 h row is the **bounded soak** (`2026-09-24-bounded-soak.md`, 124.5 M requests, no throughput decay), which replaced the older 35.0 M soak on the site; memory rows are the container's cgroup charge, not process RSS. Fuzzing: 78 M on the first three targets; two more targets (guest bridge, SQL parameters) since |
| `researchLineage` | `docs/RESEARCH-REFERENCE.md` | Public research numbers only; research page carries the caveats |
| `snippets` | `README.md`, `examples/hello`, `docs/GUIDE.md` §5–§10, §15 | The counter snippet is illustrative (labelled as such) |
| `snippets.antiPatternError` | `crates/usai-runtime/src/world.rs` (`LifecycleViolation::detached_work`), checked against a real log line in `scripts/qualification/threat/out/*/server.log` | Line-wrapped for the page. `GOAL.md` §17 shows an older design wording; do not use it |
| Version, release date | the synced tag — `src/data/docs-source.json` | `src/config/site.ts` reads it |
| Platforms | `SUPPORTED.md` | Quickstart section |

## Known upstream discrepancies

- **Sweep, "The short version":** it says Usai is "ahead [of one Node process] from c = 8 up on every class". The sweep's own table shows class D (insert) behind one Node process at every concurrency (e.g. 2 385 vs 2 818 at c = 64), and class B level at c = 16 (8 331 vs 8 354). The site follows the table: "at c = 64, ahead on five of six classes; behind on the insert".
- **README vs STATUS:** the P5 failure campaign is "broken eleven ways" in the README and 13 in STATUS. The site does not quote either number.
- `docs/measurements/2026-09-19-comparative-hello.md` is marked superseded upstream. Do not cite it.
