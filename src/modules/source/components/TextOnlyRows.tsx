import type { Project } from "@/modules/budget";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/modules/budget";

/** The extracted rows as plain text, for very poor connections. */
export function TextOnlyRows({ rows, citedId, page }: { rows: Project[]; citedId?: string; page: number }) {
  return (
    <div className="overflow-x-auto rounded-[12px] bg-card p-4 shadow-card">
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-soft">
        Page <span data-num>{page}</span> · {rows.length} rows, as extracted
      </p>
      <table className="w-full min-w-[640px] border-collapse text-[13px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-soft">
            <th className="py-1.5 pr-3 font-semibold">Line</th>
            <th className="py-1.5 pr-3 font-semibold">Project</th>
            <th className="py-1.5 pr-3 font-semibold">Ministry</th>
            <th className="py-1.5 pr-3 text-right font-semibold">2025 approved</th>
            <th className="py-1.5 pr-3 text-right font-semibold">2025 spent</th>
            <th className="py-1.5 text-right font-semibold">2026 approved</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className={cn("border-t border-hairline", r.id === citedId && "bg-inset font-semibold")}>
              <td data-num className="py-2 pr-3 text-soft">
                {i + 1}
              </td>
              <td className="py-2 pr-3">{r.project}</td>
              <td className="py-2 pr-3 text-muted">{r.mda}</td>
              <td data-num className="py-2 pr-3 text-right">
                {formatNaira(r.approved2025).display}
              </td>
              <td data-num className="py-2 pr-3 text-right">
                {formatNaira(r.spent2025).display}
              </td>
              <td data-num className="py-2 text-right">
                {r.display}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
