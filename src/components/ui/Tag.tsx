import { cn } from "@/lib/cn";

type Props = { children: React.ReactNode; className?: string };

/** Small uppercase label: STATE, LIVE. */
export function Tag({ children, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-hairline px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-label",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Designed but not built. Always inert; never a button. */
export function PlannedTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-dashed border-marigold-text/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-marigold-text",
        className,
      )}
    >
      Planned
    </span>
  );
}

export function LiveTag({ className }: { className?: string }) {
  return <Tag className={cn("bg-hairline text-label", className)}>Live</Tag>;
}
