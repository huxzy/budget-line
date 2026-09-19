import { SkeletonBlock, SkeletonLine } from "@/components/ui";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col bg-clay-deep" aria-busy aria-label="Loading the page">
      <div className="h-[64px]" />
      <div className="grid flex-1 grid-cols-1 gap-6 bg-surface p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:rounded-tl-[28px]">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <SkeletonBlock className="h-9 w-24 rounded-full" />
            <SkeletonBlock className="h-9 w-32 rounded-full" />
          </div>
          <SkeletonBlock className="h-[60vh] rounded-[12px]" />
        </div>
        <div className="flex flex-col gap-3 rounded-[24px] bg-clay p-5">
          <SkeletonLine className="w-1/2 opacity-30" />
          <SkeletonBlock className="h-40 opacity-30" />
        </div>
      </div>
    </div>
  );
}
