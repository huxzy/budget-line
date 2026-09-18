/**
 * The four Vapi tools. Each takes parsed arguments and returns the payload;
 * the envelope (Vapi or plain JSON) is handled by toolRoute.
 */
import {
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
import { bool, int, requireLiveState, str } from "./envelope";

function placeName(lgaLabel: string) {
  return lgaLabel.replace(/ LGA$/, "");
}

/** projects_by_lga({ state?, lga, sector?, unspent_only?, limit=5 }) */
export const projectsByLga: ToolHandler = (args) => {
  const st = requireLiveState(args.state);
  if (!st.ok) return st.payload;
  const slug = st.state.slug;

  const lga = resolveLga(slug, str(args.lga));
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
  const st = requireLiveState(args.state);
  if (!st.ok) return st.payload;
  const id = str(args.id);
  const project = getProject(st.state.slug, id);
  if (!project) return { found: false, reason: "unknown_project", id, state: st.state.slug };
  return { found: true, project };
};

/** lga_summary({ state?, lga }) */
export const lgaSummary: ToolHandler = (args) => {
  const st = requireLiveState(args.state);
  if (!st.ok) return st.payload;
  const slug = st.state.slug;

  const lga = resolveLga(slug, str(args.lga));
  if (!lga.found) return { ...lga, reason: "unknown_lga", state: slug };

  const summary = getLgaSummary(slug, lga.match.lga);
  return summary ? { found: true, ...summary } : { found: false, reason: "unknown_lga", query: args.lga, nearest: [] };
};

/** state_coverage({ state? }) — answered from the registry. */
export const stateCoverage: ToolHandler = (args) => {
  const states = getStates();
  const live = states.filter((s) => s.status === "live");
  const pending = states.filter((s) => s.status === "pending");
  const query = str(args.state);

  if (!query) {
    return { found: true, live, pendingCount: pending.length, pending: pending.map((s) => s.name) };
  }
  const state = resolveState(query);
  if (!state) return { found: false, reason: "unknown_state", query, live };
  return { found: true, state, covered: state.status === "live", live };
};
