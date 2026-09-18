/**
 * state_coverage({ state? })
 * "Do you have Kaduna?" — answered from the registry. With no state given,
 * lists what is live and how many are pending.
 */
import { getStates } from "@/lib/data";
import { resolveState } from "@/lib/resolve";
import { str, toolRoute } from "@/lib/tools";

export const POST = toolRoute((args) => {
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
});
