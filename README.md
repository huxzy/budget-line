# Budget Line

Ask out loud what government has budgeted where you live. Every figure comes
back with the page of the approved budget it was read from.

Budget Line is a voice-first web app over the **Niger State 2026 Approved
Budget**. A caller picks their local government, presses the microphone and
asks a question in plain words. The answer is spoken and shown as cards; each
card links to the page of the official document with the cited row
highlighted, so the caller — or a journalist — can check it independently.

Built for the OSF × Andela invention sprint, Transparency & Accountability
track. A proof of concept, not a production launch.

## What it does today

- **Voice** in English, in the browser, via Vapi. The assistant can only speak
  figures returned by four tools over the dataset; it never formats or
  computes a number itself.
- **Every amount carries its page.** Cards, the ledger, project detail and the
  share card all cite the page of the PDF; the source screen shows that page
  with a band over the cited row, plus a text-only fallback.
- **Browse** a local government by sector, filter to "approved for 2025,
  nothing recorded as spent".
- **Share** a 1080 × 1350 card to WhatsApp with a factual caption.
- Renders and browses with no Vapi keys; voice shows as unavailable.

Planned and clearly labelled as such in the UI, with no code behind them:
Nigerian Pidgin, Hausa, Nupe, Yoruba and Igbo assistants; saved projects;
CSV export; the federal tier and other states; phone, USSD and SMS access.

## The data and the integrity claim

Eight states are live: Niger, Plateau, Bauchi, Ogun, Sokoto, Borno, Anambra
and Ebonyi — 17,807 capital projects in all. Each state's rows are extracted
from its 2026 approved budget PDF by `scripts/extract_ncoa.py` (column
positions detected per document; `scripts/states.config.json` records the
page range, amount columns and official capital total per state), and
`npm run data` fails the build unless every state reconciles to its own
document's capital expenditure total within ₦1. States whose documents do
not reconcile stay pending, with the reason recorded in the config.

Niger, the reference: `data/raw/niger_2026_capital_projects.csv` holds **1,523 capital projects**
extracted from pages 68–101 of the 399-page Niger State 2026 Approved Budget
(published 8 January 2026) by `scripts/extract_niger_budget.py`, using
`pdfplumber`. Each row keeps its project name, ministry, local government,
COFOG function code, the 2024 actual, 2025 revised, 2025 January–September
performance and 2026 approved amounts, the page it was read from, and the
row's vertical position on that page.

The 2026 column sums to **₦783,694,704,490.98** against the official state
capital total of **₦783,694,704,491.00** — a two-kobo rounding difference.
`npm run data` rebuilds the app's JSON from the CSV and **fails the build** if
that total drifts by more than ₦1. The dataset accounts for the whole capital
budget; nothing is sampled or partial.

446 projects carry ₦0 for 2026. 1,023 had money approved for 2025 with nothing
recorded as spent by September. 25 local governments; 517 rows are state-wide
and are reported alongside an LGA's answer, never folded into it.

Sectors are derived from COFOG codes: health (707), roads and works (7045),
education (709), water (70631), agriculture (70421–70423, 70482); everything
else is "other".

Credit: the approved budget is published by the Niger State Government. The
idea of making budgets browsable follows BudgIT's Tracka and openstates.ng;
Budget Line is the voice and citation layer over the same public data.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 — browsing works with no keys
```

Voice needs a Vapi public key and, because Vapi's servers call this app's
`/api` tools, a public URL:

```bash
cp .env.example .env.local
# NEXT_PUBLIC_VAPI_PUBLIC_KEY=...
# NEXT_PUBLIC_APP_URL=https://<your deployment or tunnel>
```

Other commands:

```bash
npm run data           # CSV → data/states/niger-2026.json, with the reconciliation assert
npm run data:check     # print Bida health projects, the LGA summary and formatted figures
npm run pages          # render PDF pages 68–101 to public/pages (needs pdftoppm, cwebp, the PDF)
bash scripts/smoke-api.sh   # 18 curl questions against the four tool endpoints
npx tsx scripts/dump-assistant.ts [--prompt]   # the assistant config as sent to Vapi
```

## How it is built

Next.js App Router, TypeScript, Tailwind. No database: per-state JSON loaded
lazily and cached in memory. `src/app` is routing only; features live in
`src/modules/*` (atlas, budget, tools, voice, results, source, ask, browse,
project, share, prefs). Routes: `/` the Nigeria view, `/s/niger` the state
expanded, `/s/niger/bida` the area page, plus `/browse`, `/project/[id]`,
`/source/[state]/[page]` and `/share/[id]`. See `CLAUDE.md` for the conventions and the product
rules.

```
prompts/            the assistant's system prompt and per-language blocks
scripts/            extractor (provenance), data build, page render, smoke test
data/raw/           the CSV
data/states/        built JSON, one file per state
data/states.json    registry: Niger live, 35 states and the federal tier pending
public/pages/       the rendered budget pages
```
