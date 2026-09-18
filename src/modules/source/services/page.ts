import { getPageRows, getProject, getState } from "@/modules/budget/server";
import type { SourcePageData } from "../types";

export function loadSourcePage(slug: string, page: number, rowId?: string): SourcePageData | null {
  const state = getState(slug);
  if (!state || state.status !== "live" || !state.sourcePages) return null;
  // The registry records the first and last document page carrying a dataset row.
  const range = { first: state.sourcePages[0], last: state.sourcePages[1] };
  if (!Number.isInteger(page) || page < range.first || page > range.last) return null;

  const rows = getPageRows(slug, page);
  const cited = rowId ? getProject(slug, rowId) : null;
  const onThisPage = cited && cited.page === page ? cited : null;
  const line = onThisPage ? rows.findIndex((r) => r.id === onThisPage.id) + 1 : null;

  return {
    state,
    page,
    range,
    rows,
    cited: onThisPage,
    line: line && line > 0 ? line : null,
    imageSrc: `/pages/${slug}-${state.year}/${String(page).padStart(3, "0")}.webp`,
  };
}
