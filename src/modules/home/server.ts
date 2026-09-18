export * from "./index";
import { getLanguages, getLgas, getLgaSummary, getState, getStates, STATE_WIDE } from "@/modules/budget/server";
import type { FirstRunData } from "./types";

/** Everything the first-run flow needs, resolved on the server. */
export function loadFirstRun(slug = "niger"): FirstRunData {
  const lgas = getLgas(slug)
    .filter((l) => l.lga !== STATE_WIDE && l.lga !== "OUTSIDE STATE")
    .map((l) => ({ ...l, total: getLgaSummary(slug, l.lga)?.total ?? 0 }));
  return { lgas, states: getStates(), languages: getLanguages(), registry: getState(slug)! };
}
