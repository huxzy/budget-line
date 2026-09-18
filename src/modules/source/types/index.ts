import type { Project, StateSummary } from "@/modules/budget";

export type SourcePageData = {
  state: StateSummary;
  page: number;
  /** First and last page that carry dataset rows. */
  range: { first: number; last: number };
  /** All rows on this page, top to bottom. */
  rows: Project[];
  /** The row being verified, if one was requested. */
  cited: Project | null;
  /** 1-based position of the cited row among this page's rows. */
  line: number | null;
  imageSrc: string;
};
