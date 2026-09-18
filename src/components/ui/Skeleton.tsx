import { cn } from "@/lib/cn";

const shimmer =
  "rounded-md bg-[linear-gradient(90deg,var(--hairline)_0%,var(--card-soft)_50%,var(--hairline)_100%)] bg-[length:240px_100%] animate-shimmer";

export function SkeletonLine({ className }: { className?: string }) {
  return <span className={cn("block h-[18px]", shimmer, className)} />;
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <span className={cn("block h-9 rounded-[10px]", shimmer, className)} />;
}
