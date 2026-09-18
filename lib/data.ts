/**
 * The only data access module. Components and route handlers call these
 * functions; nothing else reads data/ directly.
 *
 * One state in memory at a time: a state's JSON is read from disk on first
 * request, indexed, and cached for the life of the process. The registry
 * (data/states.json) is small and loaded eagerly.
 */
import fs from "node:fs";
import path from "node:path";
import { formatNaira, toKobo } from "./format";

export type Sector =
  | "health"
  | "roads and works"
  | "education"
  | "water"
  | "agriculture"
  | "other";

export type Project = {
  id: string;
  state: string;
  project: string;
  lga: string;
  lgaLabel: string;
  mda: string;
  sector: Sector;
  tier: "STATE" | "FEDERAL";
  approved2026: number;
  approved2025: number;
  spent2025: number;
  unspent2025: boolean;
  display: string;
  plain: string;
  spoken: string;
  page: number;
};

export type StateSummary = {
  code: string;
  slug: string;
  name: string;
  status: "live" | "pending";
  year?: number;
  projects?: number;
  total_2026?: number;
  document?: string;
  pages?: number;
  published?: string;
  lgas?: number;
};

export type ProjectQuery = {
  lga?: string;
  sector?: Sector;
  unspentOnly?: boolean;
  limit?: number;
  sort?: "amount" | "page" | "name";
};

export type SectorSummary = {
  sector: Sector;
  projects: number;
  total: number;
  display: string;
  plain: string;
  spoken: string;
};

/**
 * Rows the budget assigns to the whole state rather than one LGA (517 of
 * 1,523). They are never folded into an LGA answer — that would claim a
 * project is "in Bida" when the document does not say so — but they are
 * always reported alongside it, so a third of the dataset is never silently
 * dropped.
 */
export const STATE_WIDE = "STATE WIDE";

export type StateWideBand = {
  projects: number;
  total: number;
  display: string;
  plain: string;
  spoken: string;
  note: string;
};

export type LgaSummary = {
  state: string;
  lga: string;
  lgaLabel: string;
  projects: number;
  zero2026: number;
  unspent2025: number;
  total: number;
  display: string;
  plain: string;
  spoken: string;
  bySector: SectorSummary[];
  stateWide: StateWideBand;
};

type StateData = {
  projects: Project[];
  byId: Map<string, Project>;
  byLga: Map<string, Project[]>;
  byLgaSector: Map<string, Project[]>;
};

const DATA_DIR = path.join(process.cwd(), "data");

const registry: StateSummary[] = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "states.json"), "utf8"),
);

const cache = new Map<string, StateData>();

function sectorKey(lga: string, sector: Sector) {
  return `${lga}|${sector}`;
}

function loadState(slug: string): StateData | null {
  const cached = cache.get(slug);
  if (cached) return cached;

  const meta = getState(slug);
  if (!meta || meta.status !== "live") return null;

  const file = path.join(DATA_DIR, "states", `${slug}-${meta.year}.json`);
  const projects: Project[] = JSON.parse(fs.readFileSync(file, "utf8"));

  const byId = new Map<string, Project>();
  const byLga = new Map<string, Project[]>();
  const byLgaSector = new Map<string, Project[]>();
  for (const p of projects) {
    byId.set(p.id, p);
    push(byLga, p.lga, p);
    push(byLgaSector, sectorKey(p.lga, p.sector), p);
  }

  const data = { projects, byId, byLga, byLgaSector };
  cache.set(slug, data);
  return data;
}

function push<K>(map: Map<K, Project[]>, key: K, p: Project) {
  const list = map.get(key);
  if (list) list.push(p);
  else map.set(key, [p]);
}

const SORTS: Record<NonNullable<ProjectQuery["sort"]>, (a: Project, b: Project) => number> = {
  amount: (a, b) => b.approved2026 - a.approved2026,
  page: (a, b) => a.page - b.page,
  name: (a, b) => a.project.localeCompare(b.project),
};

// ---- public API -----------------------------------------------------------

export function getStates(): StateSummary[] {
  return registry;
}

export function getState(slug: string): StateSummary | null {
  return registry.find((s) => s.slug === slug) ?? null;
}

/** Distinct LGA keys for a live state, as they appear in the data ("BIDA"). */
export function getLgas(slug: string): { lga: string; lgaLabel: string; projects: number }[] {
  const data = loadState(slug);
  if (!data) return [];
  return [...data.byLga.entries()]
    .map(([lga, list]) => ({ lga, lgaLabel: list[0].lgaLabel, projects: list.length }))
    .sort((a, b) => a.lga.localeCompare(b.lga));
}

export function getProjects(slug: string, q: ProjectQuery = {}): Project[] {
  const data = loadState(slug);
  if (!data) return [];

  const lga = q.lga?.toUpperCase();
  let rows: Project[];
  if (lga && q.sector) rows = data.byLgaSector.get(sectorKey(lga, q.sector)) ?? [];
  else if (lga) rows = data.byLga.get(lga) ?? [];
  else if (q.sector) rows = data.projects.filter((p) => p.sector === q.sector);
  else rows = data.projects;

  if (q.unspentOnly) rows = rows.filter((p) => p.unspent2025);

  rows = [...rows].sort(SORTS[q.sort ?? "amount"]);
  return q.limit ? rows.slice(0, q.limit) : rows;
}

/** Count and total of state-wide rows, optionally within one sector. */
export function getStateWide(slug: string, sector?: Sector): StateWideBand {
  const data = loadState(slug);
  const rows = data
    ? (sector ? data.byLgaSector.get(sectorKey(STATE_WIDE, sector)) : data.byLga.get(STATE_WIDE)) ?? []
    : [];
  const total = toKobo(rows.reduce((sum, p) => sum + p.approved2026, 0));
  const what = sector ? `state-wide ${sector} projects` : "state-wide projects";
  return {
    projects: rows.length,
    total,
    ...formatNaira(total),
    note: `plus ${rows.length} ${what} that are not assigned to any one LGA and may include it`,
  };
}

export function getProject(slug: string, id: string): Project | null {
  return loadState(slug)?.byId.get(id) ?? null;
}

export function getLgaSummary(slug: string, lgaInput: string): LgaSummary | null {
  const data = loadState(slug);
  if (!data) return null;
  const lga = lgaInput.toUpperCase();
  const rows = data.byLga.get(lga);
  if (!rows) return null;

  const totals = new Map<Sector, { projects: number; total: number }>();
  let total = 0;
  for (const p of rows) {
    total += p.approved2026;
    const t = totals.get(p.sector) ?? { projects: 0, total: 0 };
    t.projects += 1;
    t.total += p.approved2026;
    totals.set(p.sector, t);
  }

  total = toKobo(total);
  const bySector = [...totals.entries()]
    .map(([sector, t]) => ({ sector, projects: t.projects, total: toKobo(t.total), ...formatNaira(t.total) }))
    .sort((a, b) => b.total - a.total);

  return {
    state: slug,
    lga,
    lgaLabel: rows[0].lgaLabel,
    projects: rows.length,
    zero2026: rows.filter((p) => p.approved2026 === 0).length,
    unspent2025: rows.filter((p) => p.unspent2025).length,
    total,
    ...formatNaira(total),
    bySector,
    stateWide: getStateWide(slug),
  };
}
