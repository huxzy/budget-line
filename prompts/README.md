# Prompts

The assistant's system prompt is assembled by `lib/assistant.ts`:

    system.md  +  language.<code>.md

`system.md` is the shared body: the honesty rules, tool usage and the fixed
responses. One `language.<code>.md` file per language supplies the register
and any translated fixed responses. Only `en` is live; the others are seams.

Codes follow the registry in `data/languages.json` (`en`, `pcm`, `ha`, ...).

## Dry run against the real payload

`projects_by_lga({ lga: "Bida", unspent_only: true })` → 29 projects, first is
"Consultancy Services on the Construction of Bida Ring Road", spoken "one
billion, five hundred million naira", page 81, approved2025 1500000000,
spent2025 0.

Expected answer:

"Twenty-nine projects in Bida had money approved last year with nothing
recorded as spent by September. The largest is consultancy on the Bida Ring
Road — one billion, five hundred million naira. It was approved for last year,
and nothing was recorded as spent by September."

Check: every figure from `spoken`, no total invented, no accusation, no page
number recited for a list, offer of more implied by the cards.
