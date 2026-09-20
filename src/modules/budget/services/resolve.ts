/**
 * Turn what a person said into keys the data layer understands.
 * "Bidda", "Bida LGA", "bida local government" → "BIDA".
 * Fuzzy matching is fuse.js; we only prepare the query and pick thresholds.
 */
import Fuse from "fuse.js";
import type { LgaMatch, LgaResolution, Sector, StateSummary } from "../types";
import { getPlaces, getStates } from "./data";

const NOISE = /\b(lga|l\.g\.a\.?|local\s+gov(ernment|t)?(\s+area)?|council|town|area|in|the)\b/gi;

/**
 * Place names people say that are not LGA names. Minna, the state capital,
 * is in Chanchaga LGA — the budget itself files 134 "…in Minna" projects
 * under CHANCHAGA. Keep this list to well-known towns only.
 */
const PLACE_ALIASES: Record<string, string> = {
  minna: "CHANCHAGA",
};

/**
 * What the transcriber has actually returned for a place name in testing,
 * taken from the voice debug logs. The first consonant of a lone word is
 * the usual casualty. Add a line when a log shows a new one; never guess.
 */
const HEARD_AS: Record<string, string> = {
  vida: "BIDA",
  vita: "BIDA",
  beta: "BIDA",
  boso: "BOSSO",
  bosu: "BOSSO",
  busso: "BOSSO",
  oso: "BOSSO",
  also: "BOSSO",
  wushu: "BOSSO",
};

function cleanLga(input: string) {
  return input.replace(NOISE, " ").replace(/\s+/g, " ").trim();
}

/** A match at or under this score is accepted as the LGA the person meant. */
const MATCH = 0.25;
/**
 * With the state known there are at most 27 candidates, so a looser hit is
 * accepted too — flagged `uncertain`, and only when it is clearly ahead of
 * the runner-up. "Vida" → BIDA, said back to the caller as an assumption.
 */
const LOOSE = 0.5;
const LEAD = 0.1;

/**
 * A fuzzy hit must also be the right shape: about the same length as the
 * name, or exactly one of its words ("Jos" → JOS EAST, "Sokoto" → SOKOTO
 * NORTH). Without this, "Aba" scores as ABADAM and "Isa" as MISAU.
 */
function plausible(query: string, name: string): boolean {
  const q = query.toUpperCase().replace(/[^A-Z ]/g, "").trim();
  if (!q) return false;
  if (name.split(/[\s/-]+/).includes(q)) return true;
  return Math.abs(q.replace(/\s/g, "").length - name.replace(/\s/g, "").length) <= 2;
}

const lgaIndexes = new Map<string, Fuse<LgaMatch>>();

function lgaIndex(slug: string) {
  let idx = lgaIndexes.get(slug);
  if (!idx) {
    // The state-wide bucket is not a place; it must never match a spoken LGA.
    const lgas = getPlaces(slug);
    // Loose threshold so we can always offer "nearest" suggestions; MATCH decides
    // acceptance. A short `distance` makes the match have to sit at the start of
    // the name, so "Zaria" does not score as OHAOZARA and "Bida" not as ABADAM.
    idx = new Fuse(lgas, { keys: ["lga"], threshold: 0.7, includeScore: true, location: 0, distance: 6 });
    lgaIndexes.set(slug, idx);
  }
  return idx;
}

export function resolveLga(slug: string, input: string, opts: { loose?: boolean } = {}): LgaResolution {
  const query = cleanLga(input ?? "");
  const key = query.toLowerCase();
  const alias = PLACE_ALIASES[key];
  const heardAs = HEARD_AS[key];
  const term = alias ?? heardAs ?? query;
  const results = query ? lgaIndex(slug).search(term) : [];
  const best = results.find((r) => (r.score ?? 1) <= MATCH && plausible(term, r.item.lga));
  if (best) {
    return heardAs && best.item.lga === heardAs
      ? { found: true, match: best.item, score: best.score ?? 0, uncertain: true, heard: query }
      : { found: true, match: best.item, score: best.score ?? 0 };
  }
  if (opts.loose) {
    const [first, second] = results.filter((r) => plausible(term, r.item.lga));
    if (first && (first.score ?? 1) <= LOOSE && (!second || (second.score ?? 1) - (first.score ?? 1) >= LEAD)) {
      return { found: true, match: first.item, score: first.score ?? 0, uncertain: true, heard: query };
    }
  }
  return { found: false, query: input, nearest: results.slice(0, 3).map((r) => ({ ...r.item, score: r.score })) };
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
  const q = input.trim().toLowerCase();
  // The canonical name itself ("roads and works") is too long for a fuzzy hit on "roads".
  if (q in SECTOR_WORDS) return q as Sector;
  // Whole phrase first, then word by word ("road projects" → roads and works).
  for (const term of [q, ...q.split(/\s+/)]) {
    const hit = sectorIndex.search(term)[0]?.item.sector;
    if (hit) return hit;
  }
  return undefined;
}
