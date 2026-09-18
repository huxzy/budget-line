import { getPageRows, getProject, getState } from "@/modules/budget/server";
import type { SourcePageData } from "../types";

/** Pages 68–101 of the Niger document hold every row in the dataset. */
const RANGE: Record<string, { first: number; last: number }> = {
  niger: { first: 68, last: 101 },
};

export function loadSourcePage(slug: string, page: number, rowId?: string): SourcePageData | null {
  const state = getState(slug);
  const range = RANGE[slug];
  if (!state || state.status !== "live" || !range) return null;
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
