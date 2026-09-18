import { cn } from "@/lib/cn";

/** Share of approved money recorded as spent, 0–1. ₦0 renders a 4px nub, never empty. */
export function SpendBar({ ratio, className }: { ratio: number; className?: string }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-track", className)} role="presentation">
      <span
        className="block h-2 rounded-full bg-marigold-deep transition-[width] duration-500"
        style={{ width: pct === 0 ? "4px" : `${pct}%` }}
      />
    </div>
  );
}
