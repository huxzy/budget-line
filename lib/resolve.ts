/**
 * Turn what a person said into keys the data layer understands.
 * "Bidda", "Bida LGA", "bida local government" → "BIDA".
 * Fuzzy matching is fuse.js; we only prepare the query and pick thresholds.
 */
import Fuse from "fuse.js";
import { getLgas, getStates, STATE_WIDE, type Sector, type StateSummary } from "./data";

export type LgaMatch = { lga: string; lgaLabel: string; projects: number };
export type LgaResolution =
  | { found: true; match: LgaMatch }
  | { found: false; query: string; nearest: LgaMatch[] };

const NOISE = /\b(lga|l\.g\.a\.?|local\s+gov(ernment|t)?(\s+area)?|council|town|area|in|the)\b/gi;

/**
 * Place names people say that are not LGA names. Minna, the state capital,
 * is in Chanchaga LGA — the budget itself files 134 "…in Minna" projects
 * under CHANCHAGA. Keep this list to well-known towns only.
 */
const PLACE_ALIASES: Record<string, string> = {
  minna: "CHANCHAGA",
};

function cleanLga(input: string) {
  return input.replace(NOISE, " ").replace(/\s+/g, " ").trim();
}

/** A match at or under this score is accepted as the LGA the person meant. */
const MATCH = 0.35;

const lgaIndexes = new Map<string, Fuse<LgaMatch>>();

function lgaIndex(slug: string) {
  let idx = lgaIndexes.get(slug);
  if (!idx) {
    // The state-wide bucket is not a place; it must never match a spoken LGA.
    const lgas = getLgas(slug).filter((l) => l.lga !== STATE_WIDE && l.lga !== "OUTSIDE STATE");
    // Loose threshold so we can always offer "nearest" suggestions; MATCH decides acceptance.
    idx = new Fuse(lgas, { keys: ["lga"], threshold: 0.7, includeScore: true, ignoreLocation: true });
    lgaIndexes.set(slug, idx);
  }
  return idx;
}

export function resolveLga(slug: string, input: string): LgaResolution {
  const query = cleanLga(input ?? "");
  const alias = PLACE_ALIASES[query.toLowerCase()];
  const results = query ? lgaIndex(slug).search(alias ?? query) : [];
  if (results.length && (results[0].score ?? 1) <= MATCH) {
    return { found: true, match: results[0].item };
  }
  return { found: false, query: input, nearest: results.slice(0, 3).map((r) => r.item) };
}

// ---- states ----------------------------------------------------------------

let stateIndex: Fuse<StateSummary> | null = null;

export function resolveState(input: string): StateSummary | null {
  if (!input) return null;
  stateIndex ??= new Fuse(getStates(), { keys: ["name", "slug"], threshold: 0.3, ignoreLocation: true });
  const q = input.replace(/\bstate\b/gi, "").trim();
  return stateIndex.search(q)[0]?.item ?? null;
}

// ---- sectors ---------------------------------------------------------------

const SECTOR_WORDS: Record<Sector, string[]> = {
  health: ["health", "hospital", "clinic", "phc", "medical", "primary health"],
  "roads and works": ["roads", "road", "works", "bridge", "transport"],
  education: ["education", "school", "schools", "college", "university"],
  water: ["water", "borehole", "boreholes", "water supply"],
  agriculture: ["agriculture", "agric", "farm", "farming", "farmers", "irrigation"],
  other: ["other", "others"],
};

const sectorIndex = new Fuse(
  (Object.keys(SECTOR_WORDS) as Sector[]).flatMap((sector) =>
    SECTOR_WORDS[sector].map((word) => ({ sector, word })),
  ),
  { keys: ["word"], threshold: 0.3, ignoreLocation: true },
);

export function resolveSector(input?: string | null): Sector | undefined {
  if (!input) return undefined;
  return sectorIndex.search(input.trim().toLowerCase())[0]?.item.sector;
}
