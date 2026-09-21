# Budget Line

Ask what government has budgeted where you live. Every figure comes with the
page of the approved budget it was read from.

**Live:** https://budget-line-app.vercel.app

Budget Line is a web app over the 2026 approved budgets of eight Nigerian
states. You pick your state and local government, then ask by voice, type a
question, or browse the projects yourself. The answer is spoken or written and
shown as cards. Each card links to the page of the official document with the
cited row highlighted, so anyone can check it against the source.

Built for the OSF x Andela hackathon, Transparency and Accountability track.
A working proof of concept, not a production launch.

## What it does

- **Voice.** Press the microphone and ask in plain words. The assistant walks
  you through it one step at a time: which state, which local government,
  then your question. It answers out loud and the cards appear on screen.
- **Text.** The chat bubble on every screen goes to the same assistant, same
  rules, same tools, for anyone who would rather type.
- **Browse.** Every local government by sector, with a filter for projects
  approved for 2025 with nothing recorded as spent by September.
- **Every amount carries its page.** Cards, the ledger, the project page and
  the share card all cite the page of the PDF. The source screen shows that
  page with a band over the cited row, plus a text-only view of the rows.
- **Share.** A 1080 x 1350 card for WhatsApp with the figure, the page and a
  link to the source.
- The app renders and browses with no Vapi keys; voice and chat show as
  unavailable rather than failing.

## Information sources

The only source is the 2026 approved budget document published by each state
government. Eight states are live: Niger, Plateau, Bauchi, Ogun, Sokoto,
Borno, Anambra and Ebonyi. That is 17,807 capital project lines across 2,986
pages of documents. Each line keeps its project name, ministry, local
government, function code, the amounts approved for 2025 and 2026, the amount
recorded as spent by September 2025, and the page and row position it was read
from. Nothing is added from anywhere else.

Sectors come from the function codes: health (707), roads and works (7045),
education (709), water (70631), agriculture (70421 to 70423 and 70482). The
rest is "other". Rows the budget assigns to the whole state rather than one
local government are reported alongside an area's answer, never folded into
it.

The approved budgets are published by the state governments. The idea of
making budgets browsable follows BudgIT's Tracka and openstates.ng; Budget
Line is the voice and citation layer over the same public documents.

## Trust and accuracy

Three rules, and the code enforces them.

1. **The assistant cannot say a figure it was not given.** It has no budget
   knowledge of its own. Every answer comes from one of four lookup tools over
   the dataset. Amounts are written out in digits, plain words and spoken
   words when the data is built, and the assistant reads them as they are. It
   never rounds, converts or adds anything up.
2. **Every amount carries its page.** Each project keeps the page it was read
   from and the position of its row. The source screen shows that page with
   the row marked, so a reader can check the figure without trusting us.
3. **A state goes live only when it is complete.** `scripts/extract_ncoa.py`
   reads each PDF; `npm run data` rebuilds the JSON and fails unless every
   state's rows add up to that document's own capital total within one naira.
   States whose documents do not reconcile stay off the app, with the reason
   recorded in `scripts/states.config.json`.

When there is nothing to find, the assistant says so and does not guess. When
a project was approved last year with nothing recorded as spent, it says
exactly that and does not speculate about why. The document does not say why,
so neither does the app.

## How AI tools were used

The app was built in three days with Claude Code. It wrote the PDF extractor
and the per-state fixes for awkward layouts, the data build with the
reconciliation check, the four lookup tools, the screens from the design file,
the text chat, and a troubleshooting page (`/debug/voice`, development only)
that compared what the microphone heard with what each speech provider heard.
That page is how the transcriber was chosen.

The decisions stayed with the author: how function codes map to sectors, the
one-naira rule, guiding a caller one step at a time, which speech provider to
ship, and the wording of every fixed response. `CLAUDE.md` holds the rules the
tools worked under; `PRD.md`, `TASKS.md` and `KICKOFF_PROMPT.md` show how the
build was directed. Every change to the lookup logic was run against the 25
checks in `scripts/smoke-api.sh` before it was committed.

Inside the product, Vapi carries the voice call and the text chat, Deepgram
transcribes the caller, and OpenAI's GPT-4.1 forms the answers from the tool
results under the rules above.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000, browsing works with no keys
```

Voice and chat need Vapi keys and, because Vapi's servers call this app's
`/api` tools, a public URL:

```bash
cp .env.example .env
# NEXT_PUBLIC_VAPI_PUBLIC_KEY=   browser calls
# VAPI_PRIVATE_KEY=              text chat, server side
# NEXT_PUBLIC_APP_URL=           https://<your deployment or tunnel>
```

Other commands:

```bash
npm run data                 # rebuild data/states/*.json and the registry, with the reconciliation check
npm run data:check           # print a sample of the built data
npm run pages [state]        # render budget pages to public/pages (needs pdftoppm, cwebp and the PDFs)
bash scripts/smoke-api.sh    # 25 questions against the four tool endpoints
npx tsx scripts/dump-assistant.ts [--prompt]   # the assistant config as sent to Vapi
```

### Adding a state

Add the state to `scripts/states.config.json` with its page range, amount
columns and official capital total, run the extractor on its PDF, then
`npm run data` and `npm run pages <state>`. The build refuses to pass if the
state does not reconcile.

## About `public/pages` (77 MB)

`public/pages/<state>-<year>/NNN.webp` are the pre-rendered pages of each
state's budget PDF, only the pages that carry capital project rows (292 pages
across eight states, about 1600px wide). They are committed on purpose: the
source screen shows the actual page with the cited row highlighted, and a
clean clone must be able to do that without the PDFs (not in the repo) or a
render step.

## How it is built

Next.js App Router, TypeScript, Tailwind. No database: per-state JSON loaded
lazily and cached in memory. `src/app` is routing only; features live in
`src/modules/*` (atlas, budget, tools, voice, chat, results, source, ask,
browse, project, share, prefs, debug). Routes: `/` the Nigeria view,
`/s/niger` a state, `/s/niger/bida` an area, plus `/browse`, `/project/[id]`,
`/source/[state]/[page]` and `/share/[id]`. See `CLAUDE.md` for the
conventions and the product rules.

```
prompts/            the assistant's system prompt and context
scripts/            extractor, per-state config, data build, page render, smoke test
data/raw/           the extracted CSV per state
data/states/        built JSON, one file per state
data/states.json    registry: eight states live, the rest pending
public/pages/       the rendered budget pages
```
