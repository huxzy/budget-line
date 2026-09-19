import { SkeletonBlock, SkeletonLine } from "./Skeleton";

/**
 * Route-level loading: the page's shape in shimmer while the server renders.
 * `rail` draws the clay rail of the ask screen; `list` a ledger.
 */
export function PageLoading({ variant = "plain" }: { variant?: "plain" | "rail" | "list" }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface" aria-busy aria-label="Loading">
      <div className="h-[57px] border-b border-hairline" />
      <div className={variant === "rail" ? "grid flex-1 grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)]" : "flex-1"}>
        {variant === "rail" && <div className="hidden bg-clay lg:block" />}
        <div className="flex flex-col gap-4 px-5 py-8 sm:px-10">
          <SkeletonLine className="w-40" />
          <SkeletonBlock className="h-10 w-[60%] max-w-[520px]" />
          <SkeletonLine className="w-[70%] max-w-[600px]" />
          <div className={variant === "list" ? "mt-4 flex flex-col gap-3" : "mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"}>
            {Array.from({ length: variant === "list" ? 6 : 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-[22px] bg-card p-5 shadow-card">
                <SkeletonLine className="w-1/3" />
                <SkeletonLine />
                <SkeletonBlock className="w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
