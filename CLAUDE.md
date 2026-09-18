# CLAUDE.md — Budget Line

Read `PRD.md` before starting. Read `TASKS.md` for the build order.

## What this is

A voice-first web app for querying Nigerian government budgets. Users ask out
loud what has been budgeted in their local government area; the app answers
from official approved budget documents and shows the page each figure came
from.

Hackathon proof of concept. **Ships Saturday 19 September.** Three days.
Optimise for a working, honest, good-looking demo — not for extensibility.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Vapi web SDK (`@vapi-ai/web`) for voice
- `fuse.js` for fuzzy matching LGA and project names
- Data: per-state JSON files, loaded lazily, cached in memory
- Deploy: Vercel

## Hard constraints

- **No database.** No Prisma, no Postgres, no SQLite, no Turso. JSON files.
- **No auth, no accounts, no user records.**
- **No cron jobs, no background work.**
- **No state management library.** React state + URL search params +
  `localStorage` for the remembered LGA.
- **Use libraries.** Do not hand-roll fuzzy matching, number-to-words, date
  formatting, or CSV parsing.
- **Keep it simple.** If a feature needs a new dependency and an abstraction
  layer, it is out of scope. Prefer the boring solution.

## Non-negotiable product rules

These are correctness requirements, not preferences. A violation of any of
them is a bug.

1. **No invented data anywhere.** Every project name, amount, LGA, ministry
   and page number rendered or spoken must come from the dataset. No
   placeholder projects, no illustrative figures, no rounded-off examples.
2. **No fake capability.** No phone number, no USSD code, no SMS, no export
   that does not work. Unbuilt features are labelled `PLANNED` and are inert.
3. **The agent never states a figure that did not come from a tool result.**
4. **The UI renders from tool results, never from parsed speech.**
5. **Every displayed amount carries its source page.** No exceptions.
6. **Never claim the dataset is partial.** All 1,523 Niger rows are extracted
   and reconcile to the official state total within two kobo. Do not write copy
   like "verified rows shown" or "still being checked".

## Data contract

```ts
type Project = {
  id: string;              // "niger-2026-p0412"
  state: string;           // "niger"
  project: string;
  lga: string;             // "BIDA"
  lgaLabel: string;        // "Bida LGA"
  mda: string;
  sector: string;          // derived from func_code
  tier: "STATE" | "FEDERAL";
  approved2026: number;
  approved2025: number;
  spent2025: number;
  unspent2025: boolean;
  display: string;         // "₦75,000,000"
  plain: string;           // "75 million naira"
  spoken: string;          // "seventy-five million naira"
  page: number;
};
```

`display`, `plain` and `spoken` are generated at build time by
`scripts/build-data.ts`, never computed in a request handler or by the model.

Access the data only through `lib/data.ts`. Do not import JSON files directly
from components or route handlers.

## Layout

```
app/
  page.tsx                     # first run / home
  ask/page.tsx                 # listening + answer
  project/[id]/page.tsx        # detail
  source/[state]/[page]/page.tsx  # source verification
  browse/page.tsx
  api/
    projects/route.ts          # Vapi tool: projects_by_lga
    project/route.ts           # Vapi tool: project_detail
    summary/route.ts           # Vapi tool: lga_summary
    coverage/route.ts          # Vapi tool: state_coverage
lib/
  data.ts                      # the only data access module
  vapi.ts                      # client init, assistant config, event wiring
  format.ts                    # naira display / plain / spoken
components/
  ResultCard.tsx               # the core component
  MicButton.tsx
  SourceViewer.tsx
  ShareCard.tsx
data/
  states.json
  states/niger-2026.json
public/pages/niger-2026/069.webp   # pre-rendered budget pages
scripts/
  extract.py                   # PDF → CSV (already written, keep as provenance)
  build-data.ts                # CSV → JSON with derived fields
  render-pages.sh              # PDF pages → WebP
```

## Design system

Follow the approved design in `design/` (PDF export). Summary:

- **Palette:** warm cream base, deep clay for the voice rail and headers,
  marigold as the single accent. Marigold means *verifiable* — use it on
  source lines, the cited-row highlight, and the primary action. Nowhere else.
- **Type:** strong display hierarchy; `font-variant-numeric: tabular-nums` on
  every figure.
- **Amounts:** exact figure as the headline, plain-words reading directly
  beneath it in small quiet type (`₦75,000,000` / `75 million naira`).
- **The ₦0 case:** a warm inset panel with a spend bar filled to 0% — never a
  red badge, never an alert. It is a fact on a record.
- **Mic:** a real microphone glyph inside the disc, with the expanding rings
  originating from it. The mic button is always the largest object on screen.
- **Motion:** result cards rise 16px and fade in, staggered 90ms; amounts count
  up from zero over 600ms with digits locked by tabular figures.

Write all UI copy carefully — check word spacing. The design PDFs contain
spacing defects ("The biggestis", "ofAdditional"); do not reproduce them.

## Commands

```bash
npm run dev
npm run build
npm run data      # rebuild data/states/*.json from the CSV
npm run pages     # re-render budget page images
```

## Environment

```
NEXT_PUBLIC_VAPI_PUBLIC_KEY=
VAPI_PRIVATE_KEY=
NEXT_PUBLIC_VAPI_ASSISTANT_EN=
NEXT_PUBLIC_VAPI_ASSISTANT_HA=
```

`.env.example` must be committed. The app must render and allow browsing with
no Vapi keys present — voice degrades to a clear "voice unavailable" state
rather than crashing, so a judge can always see the app.

## Git

Small, frequent, descriptive commits. This repo is judged; the history should
read as a project built this week. Do not copy code from other repositories.

Commit messages: short and simple. Subject in the imperative, under 60
characters; body of two to four plain lines saying what changed and why. Not
one word, not a file list, no links, no Co-Authored-By or "Generated with"
trailers.

## When unsure

Ask rather than invent. Inventing data is the one failure mode that discredits
this entire product.
