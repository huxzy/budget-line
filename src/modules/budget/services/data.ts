/**
 * The only data access module. Everything reads the dataset through here;
 * nothing else touches data/ directly. Server only (uses fs).
 *
 * One state in memory at a time: a state's JSON is read from disk on first
 * request, indexed, and cached for the life of the process. The registry
 * (data/states.json) is small and loaded eagerly.
 */
import fs from "node:fs";
import path from "node:path";
import type {
  Language,
  LgaSummary,
  Project,
  ProjectQuery,
  Sector,
  SectorSummary,
  StateSummary,
  StateWideBand,
} from "../types";
import { formatNaira, toKobo } from "./format";
export { lgaSlug } from "./keys";

/**
 * Rows the budget assigns to the whole state rather than one LGA (517 of
 * 1,523). They are never folded into an LGA answer — that would claim a
 * project is "in Bida" when the document does not say so — but they are
 * always reported alongside it, so a third of the dataset is never silently
 * dropped.
 */
export const STATE_WIDE = "STATE WIDE";
export const OUTSIDE_STATE = "OUTSIDE STATE";
/** Rows whose location the extractor could not read; kept in every total, never shown as a place. */
export const LOCATION_NOT_READ = "LOCATION NOT READ";

/** True for a real local government key, false for the three buckets. */
export function isPlace(lga: string): boolean {
  return lga !== STATE_WIDE && lga !== OUTSIDE_STATE && lga !== LOCATION_NOT_READ;
}

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

const languages: Language[] = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "languages.json"), "utf8"),
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

/** Languages the picker offers. Only "live" ones have an assistant. */
export function getLanguages(): Language[] {
  return languages;
}

export function getState(slug: string): StateSummary | null {
  return registry.find((s) => s.slug === slug) ?? null;
}

/** Distinct LGA keys for a live state, as they appear in the data ("BIDA"), buckets included. */
export function getLgas(slug: string): { lga: string; lgaLabel: string; projects: number }[] {
  const data = loadState(slug);
  if (!data) return [];
  return [...data.byLga.entries()]
    .map(([lga, list]) => ({ lga, lgaLabel: list[0].lgaLabel, projects: list.length }))
    .sort((a, b) => a.lga.localeCompare(b.lga));
}

/** The real local governments of a live state — what pickers and clusters show. */
export function getPlaces(slug: string) {
  return getLgas(slug).filter((l) => isPlace(l.lga));
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

/**
 * Count and total of state-wide rows, optionally within one sector. The note
 * names the place so the assistant can read it verbatim.
 */
export function getStateWide(slug: string, sector?: Sector, place = "it"): StateWideBand {
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
    note: `plus ${rows.length} ${what} that are not assigned to any one local government and may include ${place}`,
  };
}

/** Every row on one page of the source document, top to bottom. */
export function getPageRows(slug: string, page: number): Project[] {
  const data = loadState(slug);
  if (!data) return [];
  return data.projects.filter((p) => p.page === page).sort((a, b) => a.rowTop - b.rowTop);
}

/** The state a project id belongs to ("akwa-ibom-2026-p0001" → Akwa Ibom). */
export function stateOfProjectId(id: string): StateSummary | null {
  return registry.find((s) => s.status === "live" && id.startsWith(`${s.slug}-${s.year}-`)) ?? null;
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
    stateWide: getStateWide(slug, undefined, rows[0].lgaLabel.replace(/ LGA$/, "")),
  };
}
