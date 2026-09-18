/**
 * lga_summary({ state?, lga })
 * Totals for one LGA by sector, plus the state-wide band.
 */
import { getLgaSummary } from "@/lib/data";
import { resolveLga } from "@/lib/resolve";
import { requireLiveState, str, toolRoute } from "@/lib/tools";

export const POST = toolRoute((args) => {
  const st = requireLiveState(args.state);
  if (!st.ok) return st.payload;
  const slug = st.state.slug;

  const lga = resolveLga(slug, str(args.lga));
  if (!lga.found) return { ...lga, reason: "unknown_lga", state: slug };

  const summary = getLgaSummary(slug, lga.match.lga);
  return summary ? { found: true, ...summary } : { found: false, reason: "unknown_lga", query: args.lga, nearest: [] };
});
