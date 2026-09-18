import type { Project } from "@/modules/budget";
import { Amount, Tag } from "@/components/ui";
import { HistoryPanel } from "@/modules/results";

/** The figure being verified, restated on the clay side of the source screen. */
export function ClaimCard({ project }: { project: Project }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-[20px] bg-clay-raised p-5 text-on-clay">
      <div className="flex items-center gap-2">
        <Tag className="bg-clay text-on-clay-muted">{project.tier}</Tag>
        <span className="text-[13px] font-semibold text-on-clay-muted">
          {project.lgaLabel} · {project.mda}
        </span>
      </div>
      <p className="font-display text-[22px] font-bold leading-[1.18] tracking-[-0.025em]">{project.project}</p>
      <div>
        <span className="eyebrow text-on-clay-muted">Approved 2026</span>
        <Amount display={project.display} plain={project.plain} size="lg" className="[&_span]:text-on-clay [&_span:last-child]:text-on-clay-muted" />
      </div>
      <HistoryPanel project={project} onClay />
    </div>
  );
}
