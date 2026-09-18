/**
 * projects_by_lga({ state?, lga, sector?, unspent_only?, limit=5 })
 * Projects in one LGA, largest 2026 allocation first. State-wide rows are
 * reported as a separate band, never mixed in.
 */
import { getProjects, getStateWide } from "@/lib/data";
import { resolveLga, resolveSector } from "@/lib/resolve";
import { bool, int, requireLiveState, str, toolRoute } from "@/lib/tools";

export const POST = toolRoute((args) => {
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
    stateWide: getStateWide(slug, sector),
  };
});
