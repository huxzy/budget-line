import Link from "next/link";
import { cn } from "@/lib/cn";
import { documentName } from "@/modules/budget";

type Props = {
  state: string;
  page: number;
  /** Project id, so the source page opens with this row highlighted. */
  rowId?: string;
  document?: string;
  /** "full" = "Niger State 2026 Approved Budget · page 69 →", "short" = "page 69 →" */
  variant?: "full" | "short";
  className?: string;
};

/** Marigold means verifiable. Every amount on screen carries one of these. */
export function SourceLine({ state, page, rowId, document, variant = "full", className }: Props) {
  const href = `/source/${state}/${page}${rowId ? `?row=${rowId}` : ""}`;
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2 text-[14px] font-semibold text-marigold-text hover:text-ink", className)}
    >
      <span>
        {variant === "full" ? `${document ?? documentName(state)} · ` : ""}page{" "}
        <span data-num>{page}</span>
      </span>
      <span className="font-display font-bold" aria-hidden>
        →
      </span>
    </Link>
  );
}
