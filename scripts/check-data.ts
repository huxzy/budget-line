/**
 * Phase 1 checkpoint: exercise lib/data.ts and lib/format.ts from the CLI.
 *   npm run data:check
 */
import { getProjects, getLgaSummary, getState } from "../lib/data";
import { formatNaira } from "../lib/format";

const niger = getState("niger");
console.log("registry: niger =", JSON.stringify(niger));

console.log('\ngetProjects("niger", { lga: "BIDA", sector: "health" })');
for (const p of getProjects("niger", { lga: "BIDA", sector: "health" })) {
  console.log(`  ${p.id}  ${p.display.padStart(16)}  p${p.page}  ${p.project}`);
  console.log(`  ${"".padEnd(16)}  plain:  ${p.plain}`);
  console.log(`  ${"".padEnd(16)}  spoken: ${p.spoken}`);
  console.log(`  ${"".padEnd(16)}  2025: ${p.approved2025} approved, ${p.spent2025} spent, unspent2025=${p.unspent2025}`);
}

console.log('\ngetLgaSummary("niger", "BIDA")');
console.log(JSON.stringify(getLgaSummary("niger", "BIDA"), null, 2));

console.log("\nformatNaira");
for (const n of [75_000_000, 20_000_000_000]) {
  console.log(`  ${n}: en`, formatNaira(n));
  console.log(`  ${n}: ha`, formatNaira(n, "ha"));
}
