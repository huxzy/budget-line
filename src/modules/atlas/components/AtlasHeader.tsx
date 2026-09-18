"use client";

import Link from "next/link";
import { LiveTag, PlannedTag, Wordmark } from "@/components/ui";
import { cn } from "@/lib/cn";

type Props = {
  back?: { href: string; label: string };
  crumb?: string;
  view?: "map" | "list";
  onView?: (v: "map" | "list") => void;
  onSearch?: () => void;
  motionOff?: boolean;
};

export function AtlasHeader({ back, crumb, view, onView, onSearch, motionOff }: Props) {
  return (
    <header className="flex items-center gap-3 border-b border-hairline px-4 py-3.5 sm:px-8">
      <Wordmark />
      {back && (
        <Link href={back.href} className="ml-1 inline-flex items-center gap-2 rounded-full bg-card px-3 py-2 text-[14px] font-semibold text-ink no-underline shadow-card hover:no-underline sm:ml-2 sm:px-4">
          <span aria-hidden>←</span> {back.label}
        </Link>
      )}
      {crumb && <span className="hidden text-[14px] text-muted md:inline">{crumb}</span>}
      <div className="ml-auto flex items-center gap-2">
        {motionOff && <span className="hidden rounded-full bg-hairline px-3.5 py-2 text-[13px] font-semibold text-label sm:inline-flex">Motion off · list view</span>}
        {view && onView && (
          <button
            type="button"
            onClick={() => onView(view === "map" ? "list" : "map")}
            className={cn("rounded-full bg-card px-4 py-2 text-[14px] font-semibold shadow-card hover:bg-hairline")}
            aria-pressed={view === "list"}
          >
            {view === "map" ? "List view" : "Map view"}
          </button>
        )}
        {onSearch && (
          <button type="button" onClick={onSearch} className="rounded-full bg-card px-4 py-2 text-[14px] font-semibold shadow-card hover:bg-hairline">
            Search
          </button>
        )}
        <span className="hidden items-center gap-2 rounded-full bg-card px-3.5 py-2 text-[14px] font-semibold shadow-card sm:inline-flex">
          English <LiveTag />
        </span>
        <span className="hidden items-center gap-1.5 rounded-full bg-card/60 px-3.5 py-2 text-[14px] font-semibold text-muted lg:inline-flex">
          Phone access <PlannedTag />
        </span>
      </div>
    </header>
  );
}
