"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import type { StateSummary } from "@/modules/budget";
import { ResultList } from "@/modules/results";
import type { Transcript } from "@/modules/voice";
import { sectorLabel } from "@/modules/budget";
import { isMiss, isProjects, isSummary } from "../services/turns";
import type { SummaryPayload, Turn } from "../types";
import { NoResult } from "./NoResult";
import { LgaSummaryPanel, ProvenancePanel } from "./SidePanels";

type Props = {
  turn: Turn | null;
  headline: Transcript | null;
  speaking: boolean;
  summary: SummaryPayload | null;
  registry: StateSummary;
  /** Empty, idle state before the first answer. */
  placeholder?: React.ReactNode;
};

/** The cream side: what Budget Line said, then the cards it said it from. */
export function AnswerPane({ turn, headline, speaking, summary, registry, placeholder }: Props) {
  const payload = turn?.payload;
  const projects = isProjects(payload) ? payload : null;
  const sectorText = projects ? sectorLabel(projects.sector) : null;

  const idle = !turn && !headline;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section className="flex min-w-0 flex-col gap-5">
        {idle && placeholder}
        {idle && summary && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {summary.bySector.map((s) => (
              <Link
                key={s.sector}
                href={`/browse?state=${summary.state}&lga=${encodeURIComponent(summary.lga)}&sector=${encodeURIComponent(s.sector)}`}
                className="flex items-center justify-between rounded-[16px] bg-card px-5 py-4 text-left no-underline shadow-card hover:bg-hairline hover:no-underline"
              >
                <span>
                  <span className="block font-display text-[17px] font-bold text-ink">{sectorLabel(s.sector)}</span>
                  <span className="text-[13px] text-muted">
                    <span data-num>{s.projects}</span> project{s.projects === 1 ? "" : "s"} · see the list
                  </span>
                </span>
                <span data-num className="font-display text-[19px] font-bold text-ink">
                  {s.display}
                </span>
              </Link>
            ))}
          </div>
        )}
        {!idle && (
          <div>
            <span className="eyebrow">{speaking ? "Budget Line is answering" : "Budget Line said"}</span>
            <blockquote
              className={cn(
                "mt-2 max-w-[62ch] border-l-2 border-hairline-strong pl-4 text-[17px] font-medium leading-[1.5] text-label sm:text-[19px]",
                !headline && "text-muted",
              )}
            >
              {headline?.text ?? "…"}
              {speaking && <span className="ml-1 inline-block h-5 w-[2px] animate-caret bg-marigold align-[-3px]" aria-hidden />}
            </blockquote>
          </div>
        )}

        {projects && projects.total > 0 && (
          <>
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-bold uppercase tracking-[0.1em] text-marigold-text">Just cited</span>
              <span className="h-px flex-1 bg-hairline-strong" />
              <span className="text-[14px] font-semibold text-muted">
                <span data-num>{projects.returned}</span> of <span data-num>{projects.total}</span>
                {sectorText ? ` · ${sectorText.toLowerCase()}` : ""} · {projects.lgaLabel}
                {projects.unspentOnly ? " · approved but unspent" : ""}
              </span>
            </div>
            <ResultList projects={projects.projects} total={projects.total} />
            <p className="text-[14px] text-muted">{projects.stateWide.note.replace(/^plus /, "Plus ")}.</p>
          </>
        )}

        {projects && projects.total === 0 && <NoResult payload={projects} registry={registry} />}
        {isMiss(payload) && <NoResult payload={payload} registry={registry} />}

        {isSummary(payload) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {payload.bySector.map((s) => (
              <Link
                key={s.sector}
                href={`/browse?state=${payload.state}&lga=${encodeURIComponent(payload.lga)}&sector=${encodeURIComponent(s.sector)}`}
                className="flex items-center justify-between rounded-[16px] bg-card px-5 py-4 text-left no-underline shadow-card hover:bg-hairline hover:no-underline"
              >
                <span>
                  <span className="block font-display text-[17px] font-bold text-ink">{sectorLabel(s.sector)}</span>
                  <span className="text-[13px] text-muted">
                    <span data-num>{s.projects}</span> project{s.projects === 1 ? "" : "s"} · see the list
                  </span>
                </span>
                <span data-num className="font-display text-[19px] font-bold text-ink">
                  {s.display}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
        {summary && <LgaSummaryPanel summary={summary} sector={projects?.sector} shown={projects?.returned} />}
        <ProvenancePanel registry={registry} />
      </aside>
    </div>
  );
}
