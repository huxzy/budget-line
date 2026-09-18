/**
 * CSV → data/states/<slug>-<year>.json, one file per live state, plus the
 * registry data/states.json.
 *
 * Which states are live is decided by scripts/states.config.json: an entry
 * with an official_total, no skip, and its CSV in data/raw. Every live state
 * must reconcile: the build FAILS unless the sum of its current-year approved
 * column equals the official capital total within ₦1. That check is the
 * product's integrity claim; do not weaken it.
 *
 *   npm run data
 */
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { formatNaira, type Project, type Sector, type StateSummary } from "../src/modules/budget";

const ROOT = path.resolve(__dirname, "..");
const RAW = path.join(ROOT, "data/raw");
const OUT_DIR = path.join(ROOT, "data/states");
const REGISTRY = path.join(ROOT, "data/states.json");
const CONFIG = path.join(ROOT, "scripts/states.config.json");
const TOLERANCE = 1;

type StateConfig = {
  slug: string;
  name: string;
  year: number;
  file: string;
  csv?: string;
  pages: string;
  amount_columns: string[] | null;
  reconcile_column: string;
  official_total: number | null;
  skip?: string;
  document?: string;
  document_pages?: number;
  page_size?: [number, number];
  published?: string;
  notes?: string;
  registry_note?: string;
};

/**
 * COFOG function code → sector. Prefix match, first hit wins.
 * Approved mapping: everything not listed is "other".
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

/** The rows that are not a place. Keys are normalised to these exact strings. */
export const STATE_WIDE_KEY = "STATE WIDE";
export const OUTSIDE_KEY = "OUTSIDE STATE";
export const UNREAD_KEY = "LOCATION NOT READ";

/** "State wide", "Statewide", "STATE-WIDE" → "STATE WIDE"; otherwise upper-cased. */
function lgaKey(name: string): string {
  const k = name.toUpperCase().replace(/[\s\-]+/g, " ").trim();
  if (k === "STATEWIDE" || k === "STATE WIDE") return STATE_WIDE_KEY;
  if (k === "OUTSIDE STATE" || k === "OUTSIDE THE STATE") return OUTSIDE_KEY;
  return k;
}

function lgaLabelFor(key: string): string {
  if (key === STATE_WIDE_KEY) return "State-wide";
  if (key === OUTSIDE_KEY) return "Outside the state";
  if (key === UNREAD_KEY) return "Location not read";
  const title = key
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.split("/").map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p)).join("/"))
    .join(" ");
  return `${title} LGA`;
}

/** Column names differ between the Niger CSV and the generalised extractor. */
function col(row: Record<string, string>, ...names: string[]): string {
  for (const n of names) if (row[n] !== undefined) return row[n];
  return "";
}

/** Which column stands for "approved for 2025", in preference order. */
const APPROVED_2025 = ["amt_2025_revised", "amt_2025_final", "amt_2025_approved", "amt_2025_original"];
const SPENT_2025 = ["amt_2025_perf_jan_sep", "amt_2025_perf"];

function buildState(cfg: StateConfig): { projects: Project[]; approved2025Column: string; total: number } {
  const csvPath = path.join(RAW, cfg.csv ?? `${cfg.slug}-${cfg.year}-capital.csv`);
  const rows: Record<string, string>[] = parse(fs.readFileSync(csvPath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  const header = Object.keys(rows[0]);
  const approved2025Column = APPROVED_2025.find((c) => header.includes(c)) ?? "";
  const spent2025Column = SPENT_2025.find((c) => header.includes(c)) ?? "";
  const approvedNow = cfg.reconcile_column;
  if (!header.includes(approvedNow)) throw new Error(`${cfg.slug}: no ${approvedNow} column`);

  // Same location code → same name. The extractor occasionally reads a
  // fragment next to the name; the code is the reliable key.
  const nameByCode = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const code = col(r, "lga_code", "location_code").replace(/\.0$/, "");
    const name = col(r, "lga_name", "location_name");
    if (!code || !name) continue;
    const counts = nameByCode.get(code) ?? new Map();
    counts.set(name, (counts.get(name) ?? 0) + 1);
    nameByCode.set(code, counts);
  }
  const canonical = new Map<string, string>();
  for (const [code, counts] of nameByCode) {
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0];
    canonical.set(code, best);
  }

  const projects: Project[] = rows.map((r, i) => {
    const approved2026 = Number(r[approvedNow]);
    const approved2025 = approved2025Column ? Number(r[approved2025Column]) : 0;
    const spent2025 = spent2025Column ? Number(r[spent2025Column]) : 0;
    for (const [k, v] of Object.entries({ approved2026, approved2025, spent2025 })) {
      if (!Number.isFinite(v)) throw new Error(`${cfg.slug} row ${i + 1}: ${k} is not a number`);
    }
    const page = Number(r.source_page);
    if (!Number.isInteger(page) || page < 1) throw new Error(`${cfg.slug} row ${i + 1}: bad source_page`);
    const rowTop = Number(r.page_y_top);
    const rowBottom = Number(r.page_y_bottom);
    if (!(rowTop >= 0 && rowTop < rowBottom && rowBottom <= 1)) throw new Error(`${cfg.slug} row ${i + 1}: bad row position`);

    const code = col(r, "lga_code", "location_code").replace(/\.0$/, "");
    const rawName = code ? (canonical.get(code) ?? col(r, "lga_name", "location_name")) : "";
    const key = rawName ? lgaKey(rawName) : UNREAD_KEY;
    const funcCode = col(r, "func_code", "function_code").replace(/\.0$/, "");

    return {
      id: `${cfg.slug}-${cfg.year}-p${String(i + 1).padStart(4, "0")}`,
      state: cfg.slug,
      project: r.project.replace(/\s+/g, " ").trim(),
      lga: key,
      lgaLabel: lgaLabelFor(key),
      mda: col(r, "mda_name"),
      sector: sectorFor(funcCode),
      tier: "STATE",
      approved2026,
      approved2025,
      spent2025,
      unspent2025: approved2025 > 0 && spent2025 === 0,
      ...formatNaira(approved2026),
      page,
      rowTop,
      rowBottom,
    };
  });

  const total = projects.reduce((sum, p) => sum + p.approved2026, 0);
  return { projects, approved2025Column, total };
}

// ---------------------------------------------------------------------------

const config: StateConfig[] = JSON.parse(fs.readFileSync(CONFIG, "utf8"));
const previous: StateSummary[] = fs.existsSync(REGISTRY) ? JSON.parse(fs.readFileSync(REGISTRY, "utf8")) : [];
const live: StateSummary[] = [];
let failed = false;

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const cfg of config) {
  const csvPath = path.join(RAW, cfg.csv ?? `${cfg.slug}-${cfg.year}-capital.csv`);
  if (cfg.skip || !cfg.official_total || !fs.existsSync(csvPath)) continue;

  const { projects, approved2025Column, total } = buildState(cfg);
  const diff = total - cfg.official_total;
  const ok = Math.abs(diff) <= TOLERANCE;
  console.log(
    `${cfg.slug.padEnd(9)} rows ${String(projects.length).padStart(5)}  sum ₦${total.toFixed(2).padStart(20)}  official ₦${cfg.official_total.toFixed(2).padStart(20)}  diff ₦${diff.toFixed(2).padStart(6)}  ${ok ? "OK" : "FAILED"}`,
  );
  if (!ok) {
    failed = true;
    continue;
  }

  const out = path.join(OUT_DIR, `${cfg.slug}-${cfg.year}.json`);
  fs.writeFileSync(out, JSON.stringify(projects));

  const lgaKeys = new Set(projects.map((p) => p.lga));
  for (const k of [STATE_WIDE_KEY, OUTSIDE_KEY, UNREAD_KEY]) lgaKeys.delete(k);
  const pages = projects.reduce((r, p) => [Math.min(r[0], p.page), Math.max(r[1], p.page)], [Infinity, 0]);

  live.push({
    code: previous.find((s) => s.slug === cfg.slug)?.code ?? `NG-${cfg.name.slice(0, 2).toUpperCase()}`,
    slug: cfg.slug,
    name: cfg.name,
    status: "live",
    year: cfg.year,
    projects: projects.length,
    total_2026: cfg.official_total,
    document: cfg.document ?? `${cfg.name} State ${cfg.year} Approved Budget`,
    pages: cfg.document_pages,
    published: cfg.published,
    lgas: lgaKeys.size,
    sourcePages: [pages[0], pages[1]],
    pageSize: cfg.page_size,
    approved2025Column,
    note: cfg.registry_note,
  });
}

if (failed) {
  console.error("\nRECONCILIATION FAILED for at least one state. Registry not written.");
  process.exit(1);
}

// ISO 3166-2:NG. Every state, plus the FCT; live ones come from the loop above.
const ALL: [code: string, name: string][] = [
  ["AB", "Abia"], ["AD", "Adamawa"], ["AK", "Akwa Ibom"], ["AN", "Anambra"],
  ["BA", "Bauchi"], ["BY", "Bayelsa"], ["BE", "Benue"], ["BO", "Borno"],
  ["CR", "Cross River"], ["DE", "Delta"], ["EB", "Ebonyi"], ["ED", "Edo"],
  ["EK", "Ekiti"], ["EN", "Enugu"], ["GO", "Gombe"], ["IM", "Imo"],
  ["JI", "Jigawa"], ["KD", "Kaduna"], ["KN", "Kano"], ["KT", "Katsina"],
  ["KE", "Kebbi"], ["KO", "Kogi"], ["KW", "Kwara"], ["LA", "Lagos"],
  ["NA", "Nasarawa"], ["NI", "Niger"], ["OG", "Ogun"], ["ON", "Ondo"],
  ["OS", "Osun"], ["OY", "Oyo"], ["PL", "Plateau"], ["RI", "Rivers"],
  ["SO", "Sokoto"], ["TA", "Taraba"], ["YO", "Yobe"], ["ZA", "Zamfara"], ["FC", "FCT"],
];

const registry: StateSummary[] = [
  ...ALL.map(([code, name]) => {
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const entry = live.find((s) => s.slug === slug);
    return entry ? { ...entry, code: `NG-${code}` } : { code: `NG-${code}`, slug, name, status: "pending" as const };
  }),
  { code: "NG", slug: "federal", name: "Federal", status: "pending" },
];
// Live first, then pending alphabetically — the order the picker shows.
registry.sort((a, b) => (a.status === b.status ? 0 : a.status === "live" ? -1 : 1));

fs.writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n");
console.log(`\nwrote data/states.json: ${live.length} live, ${registry.length - live.length} pending`);
