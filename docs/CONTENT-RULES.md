# Content rules

What the site may say about Usai, and how. These rules are derived from the runtime repository (`AGENTS.md` §6 "Claims discipline", ADR-0008 security wording, `docs/brand/README.md`) and the brand guidelines. `scripts/check-content.mjs` enforces the mechanical part.

## Names and lines

| Use | Text |
|---|---|
| Descriptor | A workload-native application runtime |
| Manifesto | A program should live only as long as its work requires. |
| Supporting | Ephemeral by default. Persistent by intent. |
| Also allowed | Build what lives for what matters. · Build what's next. On demand. |
| Name | "Usai" in prose. "USAI" appears only in the logo drawing. |
| Meaning | *usai*, Indonesian for finished, over, done |

**Never:**

- "AI runtime";
- "a world-scale, native AI runtime";
- "a world where positive AI transforms humanity";
- "a more capable AI runtime for a more open world".

These came from early generated brand sheets and are wrong.

## Claims

Allowed, because the evidence supports them:

- A fresh execution world per unit of work: the module-level counter answers `1 1 1 1 1 1 1 1 1 1` (sweep).
- Measured reliability, idle cost, density and fuzzing numbers, each with its source.
- Relative results *with their conditions*, for example "ahead of one Node process on five of six classes at c = 64", or "1.8–7× ahead of Laravel 12".

Not allowed:

- "production-ready". The status is alpha with production qualification in progress.
- "faster than Node / Bun / Deno / PHP / Rust" as a general statement.
- "internet-scale proven", "handles every backend workload".
- "sandbox", "secure isolation", "tenant isolation". Worlds are *semantic* isolation, a correctness property and not a security boundary.
- Any number without a source, or any rounding in Usai's favour.

## Honesty pattern

When the site shows a strength, the matching cost is within one scroll:

- throughput → CPU per request and memory;
- idle efficiency → the CPU cost under burst;
- research results → "what this does not establish".

## The research programme

The research repository is private to maintainers.

- Do not name or link it.
- Refer to it as "the research programme".
- Only publish numbers that `gmedia/usai` already publishes (`docs/RESEARCH-REFERENCE.md`), inside the research page, with the caveats: single server core, full envelope through c = 16, fixes credited as a bundle.
- Keep research-era labels (R1/R2/R3, EXP-ids beyond EXP-012B, incarnation) out of copy.

## Voice

Precise, honest, calm, technical. Short sentences. No exclamation marks, no superlatives, no hype.

- ✅ "Usai starts your workload when it's needed and stops it when the work is done."
- ❌ "The revolutionary runtime that changes everything!"
