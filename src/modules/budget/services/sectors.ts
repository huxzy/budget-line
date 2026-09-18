import type { Sector } from "../types";

export const SECTOR_ORDER: Sector[] = ["health", "roads and works", "education", "water", "agriculture", "other"];

const LABELS: Record<Sector, string> = {
  health: "Health",
  "roads and works": "Roads and works",
  education: "Education",
  water: "Water",
  agriculture: "Agriculture",
  other: "Other",
};

/** Display label for a sector key; null for none. */
export function sectorLabel(s: string | null | undefined): string | null {
  return s ? (LABELS[s as Sector] ?? s) : null;
}
