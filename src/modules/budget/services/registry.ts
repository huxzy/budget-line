import states from "../../../../data/states.json";
import type { StateSummary } from "../types";

/**
 * The state registry, importable on the client (it is small and static).
 * Server code reads the same file through data.ts.
 */
export const REGISTRY = states as StateSummary[];

export function stateName(slug: string): string {
  return REGISTRY.find((s) => s.slug === slug)?.name ?? slug;
}

/** "Plateau State 2026 Approved Budget" — the document a figure was read from. */
export function documentName(slug: string): string {
  const s = REGISTRY.find((x) => x.slug === slug);
  return s?.document ?? `${stateName(slug)} State approved budget`;
}
