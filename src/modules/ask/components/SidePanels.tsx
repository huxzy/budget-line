import Link from "next/link";
import { Amount } from "@/components/ui";
import { formatCompact, stateName, type StateSummary } from "@/modules/budget";
import type { SummaryPayload } from "../types";
import { sectorLabel } from "@/modules/budget";
import { countWord } from "../services/turns";

export function LgaSummaryPanel({ summary, sector, shown }: { summary: SummaryPayload; sector?: string | null; shown?: number }) {
  const place = summary.lgaLabel.replace(/ LGA$/, "");
  const sectorRow = sector ? summary.bySector.find((s) => s.sector === sector) : null;
  return (
    <div className="flex flex-col gap-2 rounded-[20px] bg-card p-5 shadow-card">
      <span className="eyebrow">
        {summary.lgaLabel}, {stateName(summary.state)} State
      </span>
      <Amount display={formatCompact(summary.total)} plain={summary.plain.replace(/^about /, "")} size="lg" />
      <p className="text-[14px] leading-snug text-muted">
        Across <span data-num>{summary.projects}</span> capital projects
        {sectorRow ? (
          <>
            , of which {countWord(sectorRow.projects).toLowerCase()} {sectorRow.projects === 1 ? "is" : "are"} {sectorLabel(sector)?.toLowerCase()}
          </>
        ) : null}
        . {shown ? "Sorted by approved amount." : ""}
      </p>
      <p className="text-[13px] text-soft">
        <span data-num>{summary.stateWide.projects}</span> more projects are state-wide and may include {place}.
      </p>
      <Link href={`/browse?state=${summary.state}&lga=${encodeURIComponent(summary.lga)}`} className="text-[14px] font-semibold">
        Browse all {summary.projects} →
      </Link>
    </div>
  );
}

export function publishedOn(registry: StateSummary) {
  return registry.published ? new Date(registry.published).toLocaleDateString("en-NG", { day: "numeric", month: "long" }) : "";
}

export function ProvenancePanel({ registry }: { registry: StateSummary }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[20px] border border-hairline-strong bg-card-soft p-5">
      <span className="font-display text-[15px] font-bold">Where these figures come from</span>
      <p className="text-[13px] leading-snug text-muted">
        {registry.document}
        {registry.published ? `, published ${publishedOn(registry)}` : ""}. <span data-num>{registry.pages}</span> pages, read line by
        line, reconciling to the official state total within ₦1.
      </p>
      <Link href={`/source/${registry.slug}/69`} className="text-[13px] font-semibold">
        Open the document →
      </Link>
    </div>
  );
}
