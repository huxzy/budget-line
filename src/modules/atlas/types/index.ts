import type { StateSummary } from "@/modules/budget";

export type Drift = { path: 1 | 2 | 3 | 4 | 5 | 6; duration: number; delay: number };

/** Approximate placement in the cluster field, as percentages. Purely visual. */
export type Position = { x: number; y: number; size: 56 | 64 | 72; drift: Drift };

export type Figures = {
  projects: number;
  total: number;
  display: string;
  plain: string;
  compact: string;
};

export type Place = {
  kind: "state" | "lga";
  /** Route key: state slug, or LGA key as in the data ("BIDA"). */
  key: string;
  name: string;
  href: string;
  status: "live" | "pending";
  /** Only Niger and Bida carry figures in the atlas. */
  figures?: Figures;
  /** For an LGA: its state. */
  stateName?: string;
  /** For a live LGA: rows approved for 2025 with nothing recorded spent. */
  unspent?: number;
};

export type AtlasData = {
  states: Place[];
  liveCount: number;
  registry: StateSummary;
  /** Niger's LGAs, alphabetical. */
  lgas: Place[];
};
