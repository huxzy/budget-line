import { SkeletonBlock, SkeletonLine } from "@/components/ui";

/** A compact card's exact height, while the next result arrives. */
export function ResultSkeleton({ label }: { label?: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-[22px] bg-card px-5.5 py-5 shadow-card" aria-busy>
      <div className="flex gap-2">
        <span className="h-5 w-14 rounded-md bg-hairline" />
        <span className="h-5 w-36 rounded-md bg-card-soft" />
      </div>
      <SkeletonLine />
      <SkeletonLine className="w-[64%]" />
      <SkeletonBlock className="w-[56%]" />
      {label && <span className="text-[13px] font-semibold text-soft">{label}</span>}
    </div>
  );
}
