import type { LgaSummary, Project, StateWideBand } from "@/modules/budget";

/** A projects_by_lga / lga_summary payload as the routes return it. */
export type ProjectsPayload = {
  found: true;
  state: string;
  lga: string;
  lgaLabel: string;
  sector: string | null;
  unspentOnly: boolean;
  total: number;
  returned: number;
  projects: Project[];
  stateWide: StateWideBand;
};

export type MissPayload = {
  found: false;
  reason: "unknown_lga" | "not_live" | "unknown_state" | "unknown_project";
  query?: string;
  nearest?: { lga: string; lgaLabel: string; projects: number }[];
  state?: { name: string } | string;
  covered?: { name: string }[];
};

export type SummaryPayload = LgaSummary & { found: true };

/** One answered question in the conversation rail. */
export type Turn = {
  id: number;
  tool: string;
  label: string;
  detail: string;
  payload: ProjectsPayload | MissPayload | SummaryPayload | Record<string, unknown>;
};

export type StarterQuestion = { text: string; hint?: string };
