/** Domain types for the budget dataset. Import from "@/modules/budget". */

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

export type Language = {
  code: string;
  name: string;
  native: string;
  status: "live" | "planned";
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

export type Lang = "en" | "ha";

export type LgaMatch = { lga: string; lgaLabel: string; projects: number };

export type LgaResolution =
  | { found: true; match: LgaMatch }
  | { found: false; query: string; nearest: LgaMatch[] };
