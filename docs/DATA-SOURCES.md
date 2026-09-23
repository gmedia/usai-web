# Data sources

Every number on the site comes from a file in [`gmedia/usai`](https://github.com/gmedia/usai). This table maps site data to its origin. Update both sides together.

| Site data | Upstream | Notes |
|---|---|---|
| `throughput`, `cost`, `laravelRatio`, `probe` in `src/data/benchmarks.ts` | `docs/measurements/2026-09-23-sweep.md` (commit `8acb9ed`) | Copied verbatim; PHP rows from the same-day re-run |
| `efficiency` | `docs/measurements/2026-09-20-p8e-efficiency.md` | ≈30 MiB PSS / 0.00 % CPU per idle app at N = 50; floors 48 MiB·0.25 vCPU (technical), 192 MiB·1 vCPU (supported, `SUPPORTED.md`) |
| `reliability` | `docs/STATUS.md`, `docs/measurements/2026-09-18-p5-p6-qualification.md`, `-fuzzing.md`, `-threat-verification.md` | "0 × 502" is the **two-replica** rolling restart; a single replica has a restart window |
| `researchLineage` | `docs/RESEARCH-REFERENCE.md` | Public research numbers only; research page carries the caveats |
| `snippets` | `README.md`, `examples/hello`, `docs/GUIDE.md` §5–§10, §15 | The counter snippet is illustrative (labelled as such) |
| Version, release date | `Cargo.toml`, `CHANGELOG.md` | `src/config/site.ts` |
| Platforms | `SUPPORTED.md` | Quickstart section |

## Known upstream discrepancies

- **Sweep, "The short version":** it says Usai is "ahead [of one Node process] from c = 8 up on every class". The sweep's own table shows class D (insert) behind one Node process at every concurrency (e.g. 2 385 vs 2 818 at c = 64), and class B level at c = 16 (8 331 vs 8 354). The site follows the table: "at c = 64, ahead on five of six classes; behind on the insert".
- **README vs STATUS:** the P5 failure campaign is "broken eleven ways" in the README and 13 in STATUS. The site does not quote either number.
- `docs/measurements/2026-09-19-comparative-hello.md` is marked superseded upstream. Do not cite it.
