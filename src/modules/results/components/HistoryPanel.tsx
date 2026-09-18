import type { Project } from "@/modules/budget";
import { Amount, SpendBar } from "@/components/ui";
import { formatNaira } from "@/modules/budget";
import { spendStatus } from "../services/status";

/**
 * The 2025 record for a project: approved, spent, and a spend bar.
 * The ₦0 case is a warm inset panel with the bar at 0% — a fact on a record,
 * never an alert.
 */
export function HistoryPanel({ project, onClay = false }: { project: Project; onClay?: boolean }) {
  const s = spendStatus(project);
  const approved = formatNaira(project.approved2025);
  const spent = formatNaira(project.spent2025);
  const zeroSpent = project.spent2025 === 0;
  const label = onClay ? "text-on-clay-muted" : "text-label";
  const strong = onClay ? "text-on-clay" : "text-ink";
  const accentCls = onClay ? "[&>span:first-child]:text-marigold" : "";

  return (
    <div
      className={
        onClay
          ? "flex flex-col gap-3 rounded-[16px] bg-clay-raised p-4 text-on-clay"
          : "flex flex-col gap-3 rounded-[20px] bg-inset p-5 text-ink"
      }
    >
      {s.kind === "no-record" ? (
        <>
          <span className={`text-[14px] font-semibold ${label}`}>2025</span>
          <span className={`font-display text-[19px] font-bold ${label}`}>No record</span>
          <SpendBar ratio={0} />
          <p className={`text-[14px] leading-[1.45] ${label}`}>{s.line}</p>
        </>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-2.5">
            <span className={`text-[14px] font-semibold ${label}`}>2025 approved</span>
            <span data-num className={`font-display text-[19px] font-bold ${strong}`}>
              {approved.display}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2.5">
            <span className={`text-[15px] font-bold ${strong}`}>2025 spent</span>
            <Amount
              display={spent.display}
              size={zeroSpent ? "lg" : "sm"}
              accent={zeroSpent}
              align="right"
              className={zeroSpent ? accentCls : onClay ? "[&>span:first-child]:text-on-clay" : ""}
            />
          </div>
          <SpendBar ratio={s.ratio} />
          <p className={`text-[14px] leading-[1.45] ${label}`}>{s.line}</p>
        </>
      )}
    </div>
  );
}
