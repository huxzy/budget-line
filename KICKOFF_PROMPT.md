# Kickoff prompt for Claude Code

Put `PRD.md`, `CLAUDE.md`, `TASKS.md`, the CSV (at `data/raw/`), `extract.py`
(at `scripts/`) and the design PDFs (at `design/`) in the repo first. Then paste
this.

---

Read `CLAUDE.md`, `PRD.md` and `TASKS.md` in full before writing any code. Look
at the design files from Claude Design in `design/` — the visual direction there is approved and
should be followed.

We are building Budget Line: a voice-first web app for querying Nigerian
government budget data, with a verifiable source page attached to every figure.
It ships Saturday for a hackathon. Three days total.

Start with **Phase 1 (Data) only**. Do not scaffold screens, do not touch Vapi,
do not write components yet.

For Phase 1 specifically:

1. Write `scripts/build-data.ts` converting `data/raw/niger_2026_capital_projects.csv`
   into `data/states/niger-2026.json`, adding the derived fields defined in the
   data contract in `CLAUDE.md` (`id`, `sector`, `display`, `plain`, `spoken`,
   `unspent2025`, `lgaLabel`, `tier`).
2. The `sector` mapping comes from `func_code`. Inspect the actual distinct
   values in the CSV first and propose the mapping to me before hardcoding it —
   do not guess.
3. Include a hard assertion that the 2026 approved total equals
   ₦783,694,704,491 within ₦1, and fail the build if it does not. This
   reconciliation is the product's central integrity claim.
4. Write `data/states.json` with Niger as `live` (real counts from the data) and
   all 36 other states plus `federal` as `pending`.
5. Write `lib/data.ts` with the five access functions from the PRD: lazy
   per-state loading, in-memory cache, and prebuilt indexes by LGA and by
   LGA+sector.
6. Write `lib/format.ts` for the naira display / plain / spoken formatting. Use
   `number-to-words` for English. For Hausa use a small explicit lookup for
   scale words (dubu, miliyan, biliyan) — do not attempt full Hausa number
   grammar.

Then show me, by running it:

- the reconciliation result
- `getProjects("niger", { lga: "BIDA", sector: "health" })`
- `getLgaSummary("niger", "BIDA")`
- the three formatted strings for ₦75,000,000 and ₦20,000,000,000

Constraints to hold throughout:

- No database. JSON files only.
- Use libraries rather than hand-rolling.
- Never invent a project, amount, LGA or page number. Everything comes from
  the CSV.
- Keep it simple; this is a three-day build.

Stop after Phase 1 and show me the output. We will move to Phase 2 together.
