import type { LgaSummary, Project, Sector, StateSummary } from "@/modules/budget";

export type BrowseQuery = {
  lga: string;
  sector?: Sector;
  unspentOnly: boolean;
  sort: "amount" | "page" | "name";
};

export type BrowseData = {
  query: BrowseQuery;
  registry: StateSummary;
  lgas: { lga: string; lgaLabel: string; projects: number }[];
  summary: LgaSummary;
  /** Projects grouped by sector in the order shown. */
  groups: { sector: Sector; label: string; projects: Project[] }[];
  total: number;
  stateWide: number;
};
