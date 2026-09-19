/**
 * The four Vapi tools. Each takes parsed arguments and returns the payload;
 * the envelope (Vapi or plain JSON) is handled by toolRoute.
 */
import {
  stateOfProjectId,
  getLgaSummary,
  getProject,
  getProjects,
  getStates,
  getStateWide,
  resolveLga,
  resolveSector,
  resolveState,
} from "@/modules/budget/server";
import type { ToolHandler } from "../types";
import { bool, int, liveStates, requireLiveState, stateQuery, str } from "./envelope";

function placeName(lgaLabel: string) {
  return lgaLabel.replace(/ LGA$/, "");
}

/**
 * Find a local government: in the named state, or, when the caller named no
 * state, the best match across every covered state. "Bida" must not land on
 * Borno's "Abadam" just because Borno comes first.
 */
/** Every live state's best match for a name, closest first. Ties go to the closer length ("Boso": BOSSO before BOGORO). */
function lgaEverywhere(lgaInput: string) {
  const tries = liveStates().map((st) => ({ state: st, lga: resolveLga(st.slug, lgaInput) }));
  const fit = (t: (typeof tries)[number]) => (t.lga.found ? Math.abs(t.lga.match.lga.length - lgaInput.trim().length) : 0);
  const hits = tries.filter((t) => t.lga.found).sort((a, b) => (a.lga.found && b.lga.found ? a.lga.score - b.lga.score || fit(a) - fit(b) : 0));
  return { tries, hits };
}

function findLga(stateInput: unknown, lgaInput: string) {
  if (stateQuery(stateInput)) {
    const st = requireLiveState(stateInput);
    if (!st.ok) return st;
    const lga = resolveLga(st.state.slug, lgaInput);
    if (lga.found) return { ok: true as const, state: st.state, lga };
    // Not in the state the caller named — but perhaps in another one we have ("Bosso" said with "Sokoto").
    const other = lgaEverywhere(lgaInput).hits.find((h) => h.state.slug !== st.state.slug);
    const elsewhere = other?.lga.found ? { state: other.state.slug, stateName: other.state.name, lga: other.lga.match.lga, lgaLabel: other.lga.match.lgaLabel } : undefined;
    return { ok: true as const, state: st.state, lga: elsewhere ? { ...lga, elsewhere } : lga };
  }
  const { tries, hits } = lgaEverywhere(lgaInput);
  if (hits.length) return { ok: true as const, ...hits[0] };
  const states = liveStates();
  // No state has it: report the miss against the first state, with the nearest names from all of them.
  const nearest = tries
    .flatMap((t) => (t.lga.found ? [] : t.lga.nearest))
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
    .slice(0, 3);
  return { ok: true as const, state: states[0], lga: { found: false as const, query: lgaInput, nearest } };
}

/** projects_by_lga({ state?, lga, sector?, unspent_only?, limit=5 }) */
export const projectsByLga: ToolHandler = (args) => {
  const found = findLga(args.state, str(args.lga));
  if (!found.ok) return found.payload;
  const slug = found.state.slug;
  const lga = found.lga;
  if (!lga.found) return { ...lga, reason: "unknown_lga", state: slug };

  const sector = resolveSector(str(args.sector));
  const unspentOnly = bool(args.unspent_only ?? args.unspentOnly);
  const limit = int(args.limit, 5);

  const all = getProjects(slug, { lga: lga.match.lga, sector, unspentOnly });
  return {
    found: true,
    state: slug,
    lga: lga.match.lga,
    lgaLabel: lga.match.lgaLabel,
    sector: sector ?? null,
    unspentOnly,
    total: all.length,
    returned: Math.min(limit, all.length),
    projects: all.slice(0, limit),
    stateWide: getStateWide(slug, sector, placeName(lga.match.lgaLabel)),
  };
};

/** project_detail({ state?, id }) */
export const projectDetail: ToolHandler = (args) => {
  const id = str(args.id);
  const byId = stateOfProjectId(id);
  const st = byId ? { ok: true as const, state: byId } : requireLiveState(args.state);
  if (!st.ok) return st.payload;
  const project = getProject(st.state.slug, id);
  if (!project) return { found: false, reason: "unknown_project", id, state: st.state.slug };
  return { found: true, project };
};

/** lga_summary({ state?, lga }) */
export const lgaSummary: ToolHandler = (args) => {
  const found = findLga(args.state, str(args.lga));
  if (!found.ok) return found.payload;
  const slug = found.state.slug;
  const lga = found.lga;
  if (!lga.found) return { ...lga, reason: "unknown_lga", state: slug };

  const summary = getLgaSummary(slug, lga.match.lga);
  return summary ? { found: true, ...summary } : { found: false, reason: "unknown_lga", query: args.lga, nearest: [] };
};

/** state_coverage({ state? }) — answered from the registry. */
export const stateCoverage: ToolHandler = (args) => {
  const states = getStates();
  const live = states.filter((s) => s.status === "live");
  const pending = states.filter((s) => s.status === "pending");
  const query = stateQuery(args.state);

  if (!query) {
    return { found: true, live, pendingCount: pending.length, pending: pending.map((s) => s.name) };
  }
  const state = resolveState(query);
  if (!state) return { found: false, reason: "unknown_state", query, live };
  return { found: true, state, covered: state.status === "live", live };
};
