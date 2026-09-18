#!/usr/bin/env bash
# Phase 2 checkpoint: 15 questions against the four tool endpoints.
#   npm run dev   (in another terminal)
#   bash scripts/smoke-api.sh [base-url]
set -euo pipefail
BASE="${1:-http://localhost:3000}"
q() { # q "<question>" <route> '<json>' '<jq filter>'
  printf '\n\033[1m%s\033[0m\n  POST %s %s\n' "$1" "$2" "$3"
  curl -sS -X POST "$BASE/api/$2" -H 'content-type: application/json' -d "$3" | jq -c "$4"
}
P='{found, lga, sector, total, returned, sw: .stateWide.projects, first: (.projects[0] // null | if . then {display, plain, page, project} else null end)}'
q "1. Health projects in Bida"                 projects '{"lga":"Bida","sector":"health"}' "$P"
q "2. Bidda (misspelt)"                        projects '{"lga":"Bidda","sector":"health","limit":2}' "$P"
q "3. Bida LGA"                                projects '{"lga":"Bida LGA","sector":"health","limit":1}' "$P"
q "4. bida local government"                   projects '{"lga":"bida local government","limit":1}' "$P"
q "5. Roads in Bida (alias: road)"             projects '{"lga":"Bida","sector":"road"}' "$P"
q "6. Schools in Bida (alias: school)"         projects '{"lga":"Bida","sector":"school"}' "$P"
q "7. Bida, approved 2025 but nothing spent"   projects '{"lga":"Bida","unspent_only":true}' "$P"
q "8. Water in Chanchaga, limit 3"             projects '{"lga":"Chanchaga","sector":"water","limit":3}' "$P"
q "9. Health in Konta gora (spaced)"           projects '{"lga":"Konta gora","sector":"health","limit":1}' "$P"
q "10. Unknown LGA: Zaria (Kaduna, not Niger)" projects '{"lga":"Zaria"}' '{found, reason, query, nearest: [.nearest[].lga]}'
q "11. Summary for Bida"                       summary  '{"lga":"Bida"}' '{found, lgaLabel, projects, zero2026, unspent2025, display, plain, sectors: [.bySector[] | {sector, projects, display}], stateWide: .stateWide.note}'
q "12. Project detail p0045"                   project  '{"id":"niger-2026-p0045"}' '{found, p: (.project | {project, display, plain, spoken, page, approved2025, spent2025, unspent2025})}'
q "13. Unknown project id"                     project  '{"id":"niger-2026-p9999"}' '.'
q "14. Do you cover Kaduna?"                   coverage '{"state":"Kaduna"}' '{found, covered, state: .state.name, status: .state.status, live: [.live[].name]}'
q "15. Do you cover Niger? / what is live"     coverage '{}' '{found, live: [.live[] | {name, projects, lgas}], pendingCount}'
q "16. Kaduna projects → not_live, never a 500" projects '{"state":"Kaduna","lga":"Zaria"}' '{found, reason, state: .state.name, covered: [.covered[].name]}'
q "17. Vapi envelope round-trip"               projects '{"message":{"type":"tool-calls","toolCallList":[{"id":"call_1","name":"projects_by_lga","arguments":{"lga":"Bida","sector":"health","limit":1}}]}}' '{toolCallId: .results[0].toolCallId, result: (.results[0].result | fromjson | {found, lga, first: .projects[0].display, page: .projects[0].page})}'
q "18. Garbage body"                           projects 'not json' '{found, reason}'
