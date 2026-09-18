import type { Preferences } from "../types";

const KEY = "budgetline.prefs";
export const DEFAULT_PREFS: Preferences = { lga: null, lgaLabel: null, lang: "en" };

/** localStorage can throw (private mode, blocked storage); never let it crash a render. */
export function readPrefs(): Preferences {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writePrefs(p: Preferences) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
