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
  /** Vertical extent of the row on its page, as fractions of page height. */
  rowTop: number;
  rowBottom: number;
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
  /** First and last document page that carries a dataset row. */
  sourcePages?: [number, number];
  /** Page box in PDF points, e.g. [792, 612]. */
  pageSize?: [number, number];
  /** Which source column stands for "approved for 2025" in this document. */
  approved2025Column?: string;
  /** A caveat that belongs with the document, e.g. a later supplementary appropriation. */
  note?: string;
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

export type LgaMatch = { lga: string; lgaLabel: string; projects: number; score?: number };

export type LgaResolution =
  | { found: true; match: LgaMatch; score: number }
  | { found: false; query: string; nearest: LgaMatch[] };
