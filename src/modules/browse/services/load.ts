import {
  getPlaces,
  getLgaSummary,
  getProjects,
  getState,
  getStates,
  getStateWide,
  resolveLga,
  resolveSector,
  SECTOR_ORDER,
  sectorLabel,
  type Project,
  type Sector,
} from "@/modules/budget/server";
import type { BrowseData, BrowseQuery } from "../types";

/** The ledger for one LGA, optionally one sector, optionally unspent only. */
export function loadBrowse(stateSlug: string, params: { lga?: string; sector?: string; unspent?: string; sort?: string }): BrowseData | null {
  const live = getStates().filter((s) => s.status === "live");
  // No state named: the state that has this LGA, else the first live state.
  const registry =
    (stateSlug && getState(stateSlug)) ||
    (params.lga && live.find((s) => resolveLga(s.slug, params.lga!).found)) ||
    live[0];
  if (!registry || registry.status !== "live") return null;
  const slug = registry.slug;
  const lgas = getPlaces(slug);

  const resolved = params.lga ? resolveLga(slug, params.lga) : null;
  const lga = resolved?.found ? resolved.match.lga : lgas[0].lga;
  const sector = resolveSector(params.sector);
  const sort = (["amount", "page", "name"] as const).find((s) => s === params.sort) ?? "amount";
  const query: BrowseQuery = { state: slug, lga, sector, unspentOnly: params.unspent === "1", sort };

  const summary = getLgaSummary(slug, lga)!;
  const projects = getProjects(slug, { lga, sector, unspentOnly: query.unspentOnly, sort });
  const bySector = new Map<Sector, Project[]>();
  for (const p of projects) bySector.set(p.sector, [...(bySector.get(p.sector) ?? []), p]);
  const groups = SECTOR_ORDER.filter((s) => bySector.has(s)).map((s) => ({ sector: s, label: sectorLabel(s)!, projects: bySector.get(s)! }));

  return { query, registry, lgas, summary, groups, total: projects.length, stateWide: getStateWide(slug, sector).projects };
}
