import type { Language, StateSummary } from "@/modules/budget";

export type LgaOption = { lga: string; lgaLabel: string; projects: number; total: number };

export type FirstRunData = {
  lgas: LgaOption[];
  states: StateSummary[];
  languages: Language[];
  registry: StateSummary;
};
