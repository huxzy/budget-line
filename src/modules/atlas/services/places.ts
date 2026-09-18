import { formatCompact, formatNaira, getLgas, getLgaSummary, getProjects, getState, getStates, STATE_WIDE } from "@/modules/budget/server";
import type { AtlasData, Figures, Place } from "../types";

/** The one local government whose figures the atlas shows before it is opened. */
const FEATURED_LGA = "BIDA";

function figuresFor(total: number, projects: number): Figures {
  const f = formatNaira(total);
  return { projects, total, display: f.display, plain: f.plain, compact: formatCompact(total) };
}

/** States and one state's local governments for the entry views, from the registry. */
export function loadAtlas(stateSlug = "niger"): AtlasData {
  const registry = getStates();
  const requested = getState(stateSlug);
  const current = requested && requested.status === "live" ? requested : getState("niger")!;
  const slug = current.slug;

  const states: Place[] = registry
    .filter((s) => s.slug !== "federal")
    .map((s) => ({
      kind: "state",
      key: s.slug,
      name: s.name,
      href: `/s/${s.slug}`,
      status: s.status,
      figures: s.status === "live" && s.total_2026 && s.projects ? figuresFor(s.total_2026, s.projects) : undefined,
    }));

  const lgas: Place[] = getLgas(slug)
    .filter((l) => l.lga !== STATE_WIDE && l.lga !== "OUTSIDE STATE")
    .map((l) => {
      const featured = slug === "niger" && l.lga === FEATURED_LGA;
      const summary = featured ? getLgaSummary(slug, l.lga) : null;
      return {
        kind: "lga",
        key: l.lga,
        name: l.lgaLabel.replace(/ LGA$/, ""),
        href: `/s/${slug}/${l.lga.toLowerCase()}`,
        status: "live",
        stateName: current.name,
        figures: summary ? figuresFor(summary.total, summary.projects) : undefined,
        unspent: summary ? getProjects(slug, { lga: l.lga, unspentOnly: true }).length : undefined,
      };
    });

  return { states, liveCount: states.filter((s) => s.status === "live").length, registry: current, lgas };
}
