import Link from "next/link";
import type { Project } from "@/modules/budget";
import { Amount, PlannedTag, SourceLine, SpendBar, Tag } from "@/components/ui";
import { cn } from "@/lib/cn";
import { spendStatus } from "../services/status";
import { HistoryPanel } from "./HistoryPanel";

type Props = {
  project: Project;
  /** hero: the just-cited card. compact: grid card. ledger: browse row. */
  variant?: "hero" | "compact" | "ledger";
  /** Marigold hairline — the card the agent just cited. */
  cited?: boolean;
  /** Stagger index for the rise-and-fade entrance. */
  index?: number;
  countUp?: boolean;
  className?: string;
};

function Meta({ project, small }: { project: Project; small?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Tag>{project.tier}</Tag>
      <span className={cn("font-semibold text-muted", small ? "text-[13px]" : "text-[14px]")}>
        {project.lgaLabel} · {project.mda}
      </span>
    </div>
  );
}

/**
 * The core component. Every figure on it carries its source page. States
 * (unspent, no prior record, ₦0 this year) come from the data and are
 * rendered inside; pages just pass a project.
 */
export function ResultCard({ project, variant = "compact", cited = false, index = 0, countUp = false, className }: Props) {
  const href = `/project/${project.id}`;
  const entrance = { animationDelay: `${index * 90}ms` };

  if (variant === "ledger") {
    const s = spendStatus(project);
    return (
      <Link
        href={href}
        className={cn(
          "grid grid-cols-1 items-center gap-3 rounded-[14px] bg-card px-5 py-4 no-underline shadow-card transition-transform active:scale-[0.99] hover:no-underline sm:grid-cols-[minmax(0,1fr)_170px_auto] sm:gap-6",
          className,
        )}
      >
        <div className="min-w-0">
          <p className="text-[16px] font-bold leading-snug text-ink">{project.project}</p>
          <p className="mt-0.5 text-[13px] font-medium text-muted">
            {project.mda} · {project.tier} · page <span data-num>{project.page}</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5 text-[13px] font-semibold text-muted">
          {s.kind === "unspent" ? (
            <>
              <SpendBar ratio={0} className="w-12" />
              <span className="text-marigold-text">₦0 spent</span>
            </>
          ) : (
            <span>{s.short}</span>
          )}
        </div>
        <Amount display={project.display} plain={project.plain} size="sm" align="right" />
      </Link>
    );
  }

  if (variant === "hero") {
    return (
      <article
        style={entrance}
        className={cn(
          "grid animate-cardin grid-cols-1 gap-6 rounded-[26px] bg-card px-6 pb-5 pt-6 shadow-hero md:grid-cols-[minmax(0,1fr)_300px]",
          cited && "outline outline-2 -outline-offset-2 outline-marigold",
          className,
        )}
      >
        <div className="flex flex-col gap-4">
          <Meta project={project} />
          <Link href={href} className="font-display text-[24px] font-bold leading-[1.16] tracking-[-0.03em] text-ink no-underline hover:no-underline sm:text-[28px]">
            {project.project}
          </Link>
          <div className="flex flex-col gap-0.5">
            <span className="eyebrow">Approved 2026</span>
            <Amount display={project.display} plain={project.plain} value={project.approved2026} size="hero" countUp={countUp} />
          </div>
          <div className="mt-auto flex min-h-11 flex-wrap items-center gap-3.5 border-t border-hairline pt-3.5">
            <SourceLine state={project.state} page={project.page} rowId={project.id} />
            <span className="ml-auto flex items-center gap-2 text-[14px] font-semibold text-muted">
              <Link href={`/share/${project.id}`} className="text-muted hover:text-ink">
                Share
              </Link>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                Follow <PlannedTag />
              </span>
            </span>
          </div>
        </div>
        <HistoryPanel project={project} />
      </article>
    );
  }

  return (
    <Link
      href={href}
      style={entrance}
      className={cn(
        "flex animate-cardin flex-col gap-2.5 rounded-[22px] bg-card px-5.5 py-5 no-underline shadow-card transition-transform active:scale-[0.985] hover:no-underline",
        cited && "outline outline-2 -outline-offset-2 outline-marigold",
        className,
      )}
    >
      <Meta project={project} small />
      <span className="font-display text-[21px] font-bold leading-[1.2] tracking-[-0.025em] text-ink">{project.project}</span>
      <Amount display={project.display} plain={project.plain} value={project.approved2026} size="lg" countUp={countUp} />
      <SourceLine state={project.state} page={project.page} rowId={project.id} variant="short" />
    </Link>
  );
}
