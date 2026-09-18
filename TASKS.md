# TASKS — Budget Line

Three days. Friday 18 → submit Saturday 19 night. Sunday is buffer only.
Work top to bottom. Do not start a later phase until the checkpoint passes.

---

## Phase 0 — Before any code (do first, 30 min)

- [ ] Complete the hackathon signup and submission form
- [ ] Check Intron Sahara docs: is there a **streaming WebSocket** endpoint?
      - Yes → it can be Vapi's custom transcriber
      - No → use Deepgram Nova 3 (Multi) for the live path, Sahara out of scope
- [ ] New empty repo, first commit with `PRD.md`, `CLAUDE.md`, `TASKS.md`
- [ ] `npx create-next-app` (TypeScript, Tailwind, App Router)

---

## Phase 1 — Data (Friday)

- [ ] Commit `niger_2026_capital_projects.csv` to `data/raw/`
- [ ] Commit `scripts/extract.py` (provenance — do not modify)
- [ ] `scripts/build-data.ts`: CSV → `data/states/niger-2026.json`
      - stable `id` per row
      - `sector` from `func_code` (health, roads and works, education, water,
        agriculture, other)
      - `display`, `plain`, `spoken` (use `number-to-words`; Hausa scale words
        via a small lookup: dubu / miliyan / biliyan)
      - `unspent2025` flag
      - `lgaLabel` title-cased from `lga_name`
- [ ] Assert on build: 2026 total === 783,694,704,491 ± ₦1. **Fail the build if
      it does not.** This is the integrity claim.
- [ ] `data/states.json`: Niger live with real counts; all 36 other states plus
      `federal` as `status: "pending"`
- [ ] `lib/data.ts` implementing the five functions in the PRD, with lazy
      per-state loading, in-memory cache, and LGA / LGA+sector indexes
- [ ] `lib/format.ts` for naira display / plain / spoken

**Checkpoint:** a script prints health projects in Bida with correct amounts,
plain readings, spoken strings and page numbers.

---

## Phase 2 — Tool endpoints (Friday)

- [ ] `POST /api/projects` → `projects_by_lga` (state, lga, sector?,
      unspent_only?, limit default 5)
- [ ] `POST /api/project` → `project_detail`
- [ ] `POST /api/summary` → `lga_summary`
- [ ] `POST /api/coverage` → `state_coverage` (answers "do you cover Kaduna?"
      from the registry)
- [ ] Fuzzy LGA resolution with `fuse.js`: "Bidda", "Bida LGA", "bida local
      government" all resolve to BIDA
- [ ] Every response includes `spoken`, `display`, `plain`, `page`, `id`
- [ ] Unknown LGA → structured "not found" with the nearest matches, never a 500

**Checkpoint:** all four endpoints answer your 15 test questions correctly via
curl.

---

## Phase 3 — Voice (Friday night / Saturday early)

- [ ] `lib/vapi.ts`: client init, start/stop call, event subscriptions
- [ ] English assistant configured with the four tools
- [ ] System prompt enforcing the six agent rules in the PRD
- [ ] Subscribe to transcript events (live caption) and **tool-result events
      (card rendering)**
- [ ] Configure a fallback transcriber
- [ ] Graceful degradation: no keys or mic denied → clear non-crashing state

**Checkpoint:** one full spoken exchange — "health projects in Bida" → correct
spoken answer → cards appear from the tool result, not from parsed speech.

Placeholder prompt wording is fine here. The real script comes after the app
works.

---

## Phase 4 — Screens (Saturday, the bulk of the day)

Build in this order. Stop when the clock says stop; earlier screens matter more.

- [ ] `components/ResultCard.tsx` — all states: default, approved-but-unspent,
      no-prior-record, loading skeleton at final height, pressed
- [ ] **Source verification** — `scripts/render-pages.sh` (pdftoppm → WebP for
      pages 68–101), page image with highlight box on the cited row, claim card
      beside it, "how it was matched" list, text-only fallback
- [ ] Answer screen — spoken answer as text, cards below, conversation rail
- [ ] Home / idle — area summary, mic button, starter questions
- [ ] Listening state — waveform, live transcript
- [ ] Project detail — figures, history, source link
- [ ] First run — LGA picker (27 live + pending states), then language picker
- [ ] No result — honest copy, search counts, nearest match
- [ ] Browse LGA — sector groups, unspent filter
- [ ] Share card — portrait 1080×1350, legible at 176px, with the source line

**Checkpoint:** the demo path runs start to finish without touching code:
pick Bida → ask for health → see cards → open the source page → share.

---

## Phase 5 — Freeze (Saturday, hard stop early evening)

- [ ] Proofread every string; fix word spacing
- [ ] Verify no invented data, no fake number, no fake USSD anywhere
- [ ] Apply `PLANNED` markers to Saved, Phone access, export, federal, and
      non-live languages; confirm they are inert
- [ ] Responsive pass at 360px
- [ ] Dark mode sanity check
- [ ] `README.md`: what it is, the extraction pipeline, the reconciliation
      claim, credit to BudgIT / openstates.ng, how to run
- [ ] `.env.example` committed
- [ ] Deploy to Vercel, test on a fresh browser

**FEATURE FREEZE.** Anything unfinished becomes a PLANNED line in the deck.

---

## Phase 6 — Deliverables (Saturday night, no code)

- [ ] Demo video — lead with a real question, land on the source page
- [ ] Pitch deck — problem, who it's for, the reconciliation claim, the access
      layer thesis with BudgIT credited, architecture covering 36 states,
      roadmap
- [ ] Written summary
- [ ] Submit

---

## If time runs short, cut in this order

1. Browse screen (link to a simple list instead)
2. Hausa assistant → mark PLANNED, ship English + Pidgin
3. Share card → static image in the deck rather than in-app generation
4. First-run flow → default to Bida with a change control

**Never cut:** source verification, the reconciliation assert, the citation on
every amount.

---

## Do not do

- Do not attempt the federal 77 MB PDF. Out of scope this week.
- Do not add a database.
- Do not build Saved, SMS, USSD, or export.
- Do not write code on Saturday night.
