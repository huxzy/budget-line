/**
 * CSV → data/states/niger-2026.json
 *
 * Reads the extracted capital projects (scripts/extract_niger_budget.py →
 * data/raw/niger_2026_capital_projects.csv), adds the derived fields from the
 * data contract in CLAUDE.md, and writes the per-state JSON plus the registry.
 *
 * The build FAILS unless the 2026 approved column reconciles to the official
 * Niger State capital total within ₦1. That check is the product's integrity
 * claim; do not weaken it.
 *
 *   npm run data
 */
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { formatNaira } from "../lib/format";
import type { Project, Sector, StateSummary } from "../lib/data";

const ROOT = path.resolve(__dirname, "..");
const CSV = path.join(ROOT, "data/raw/niger_2026_capital_projects.csv");
const OUT = path.join(ROOT, "data/states/niger-2026.json");
const REGISTRY = path.join(ROOT, "data/states.json");

const STATE = "niger";
const YEAR = 2026;

/** Official total, Niger State 2026 Approved Budget, capital expenditure. */
const OFFICIAL_TOTAL_2026 = 783_694_704_491;
const TOLERANCE = 1;

/**
 * COFOG function code → sector. Prefix match, first hit wins.
 * Approved mapping (see PR discussion): everything not listed is "other".
 */
const SECTOR_RULES: [prefix: string, sector: Sector][] = [
  ["707", "health"],            // pharmaceutical, medical, hospital, public health
  ["7045", "roads and works"],  // road, water and air transport
  ["709", "education"],         // primary through tertiary, R&D education
  ["70631", "water"],           // water supply
  ["70421", "agriculture"],
  ["70422", "agriculture"],     // forestry
  ["70423", "agriculture"],     // fishing and hunting
  ["70482", "agriculture"],     // R&D agriculture, forestry
];

function sectorFor(funcCode: string): Sector {
  return SECTOR_RULES.find(([prefix]) => funcCode.startsWith(prefix))?.[1] ?? "other";
}

/** "BIDA" → "Bida LGA". The two non-LGA buckets get honest labels. */
function lgaLabelFor(lga: string): string {
  if (lga === "STATE WIDE") return "State-wide";
  if (lga === "OUTSIDE STATE") return "Outside the state";
  const title = lga
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
  return `${title} LGA`;
}

type Row = {
  project: string;
  mda_code: string;
  mda_name: string;
  lga_code: string;
  lga_name: string;
  econ_code: string;
  econ_name: string;
  func_code: string;
  func_name: string;
  amt_2024_actual: string;
  amt_2025_revised: string;
  amt_2025_perf_jan_sep: string;
  amt_2026_approved: string;
  source_page: string;
};

const rows: Row[] = parse(fs.readFileSync(CSV, "utf8"), {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

const projects: Project[] = rows.map((r, i) => {
  const approved2026 = Number(r.amt_2026_approved);
  const approved2025 = Number(r.amt_2025_revised);
  const spent2025 = Number(r.amt_2025_perf_jan_sep);
  for (const [k, v] of Object.entries({ approved2026, approved2025, spent2025 })) {
    if (!Number.isFinite(v)) throw new Error(`Row ${i + 1}: ${k} is not a number`);
  }
  const page = Number(r.source_page);
  if (!Number.isInteger(page) || page < 1) throw new Error(`Row ${i + 1}: bad source_page`);

  return {
    id: `${STATE}-${YEAR}-p${String(i + 1).padStart(4, "0")}`,
    state: STATE,
    project: r.project.replace(/\s+/g, " ").trim(),
    lga: r.lga_name,
    lgaLabel: lgaLabelFor(r.lga_name),
    mda: r.mda_name,
    sector: sectorFor(r.func_code),
    tier: "STATE",
    approved2026,
    approved2025,
    spent2025,
    unspent2025: approved2025 > 0 && spent2025 === 0,
    ...formatNaira(approved2026),
    page,
  };
});

// ---- reconciliation: the integrity claim ----------------------------------

const total2026 = projects.reduce((sum, p) => sum + p.approved2026, 0);
const diff = total2026 - OFFICIAL_TOTAL_2026;

console.log(`rows              ${projects.length}`);
console.log(`sum of 2026       ₦${total2026.toFixed(2)}`);
console.log(`official total    ₦${OFFICIAL_TOTAL_2026.toFixed(2)}`);
console.log(`difference        ₦${diff.toFixed(2)}`);

if (Math.abs(diff) > TOLERANCE) {
  console.error(
    `\nRECONCILIATION FAILED: 2026 total is off by ₦${diff.toFixed(2)} (tolerance ₦${TOLERANCE}). Not writing output.`,
  );
  process.exit(1);
}
console.log(`reconciliation    OK (within ₦${TOLERANCE})\n`);

// ---- write per-state file --------------------------------------------------

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(projects));
console.log(`wrote ${path.relative(ROOT, OUT)} (${projects.length} projects)`);

// ---- registry: Niger live with real counts, everyone else pending ----------

// Real LGAs only; "STATE WIDE" and "OUTSIDE STATE" are buckets, not places.
const lgas = new Set(projects.map((p) => p.lga)).size - 2;

const niger: StateSummary = {
  code: "NG-NI",
  slug: "niger",
  name: "Niger",
  status: "live",
  year: YEAR,
  projects: projects.length,
  total_2026: OFFICIAL_TOTAL_2026,
  document: "Niger State 2026 Approved Budget",
  pages: 399,
  published: "2026-01-08",
  lgas,
};

// ISO 3166-2:NG. The 35 other states; FCT has no state budget and is not listed.
const PENDING: [code: string, name: string][] = [
  ["AB", "Abia"], ["AD", "Adamawa"], ["AK", "Akwa Ibom"], ["AN", "Anambra"],
  ["BA", "Bauchi"], ["BY", "Bayelsa"], ["BE", "Benue"], ["BO", "Borno"],
  ["CR", "Cross River"], ["DE", "Delta"], ["EB", "Ebonyi"], ["ED", "Edo"],
  ["EK", "Ekiti"], ["EN", "Enugu"], ["GO", "Gombe"], ["IM", "Imo"],
  ["JI", "Jigawa"], ["KD", "Kaduna"], ["KN", "Kano"], ["KT", "Katsina"],
  ["KE", "Kebbi"], ["KO", "Kogi"], ["KW", "Kwara"], ["LA", "Lagos"],
  ["NA", "Nasarawa"], ["OG", "Ogun"], ["ON", "Ondo"], ["OS", "Osun"],
  ["OY", "Oyo"], ["PL", "Plateau"], ["RI", "Rivers"], ["SO", "Sokoto"],
  ["TA", "Taraba"], ["YO", "Yobe"], ["ZA", "Zamfara"],
];

const registry: StateSummary[] = [
  niger,
  ...PENDING.map(([code, name]) => ({
    code: `NG-${code}`,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    status: "pending" as const,
  })),
  { code: "NG", slug: "federal", name: "Federal", status: "pending" },
];

fs.writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n");
console.log(`wrote ${path.relative(ROOT, REGISTRY)} (${registry.length} entries, 1 live)`);

// ---- summary ---------------------------------------------------------------

const bySector = new Map<Sector, number>();
for (const p of projects) bySector.set(p.sector, (bySector.get(p.sector) ?? 0) + 1);
console.log("\nsectors:");
for (const [s, n] of [...bySector.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${s.padEnd(16)} ${n}`);
}
console.log(`\nLGAs: ${lgas} (plus STATE WIDE and OUTSIDE STATE buckets)`);
console.log(`₦0 in 2026: ${projects.filter((p) => p.approved2026 === 0).length}`);
console.log(`approved 2025, nothing spent Jan–Sep: ${projects.filter((p) => p.unspent2025).length}`);
