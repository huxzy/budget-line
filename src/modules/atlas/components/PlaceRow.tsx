import Link from "next/link";
import { PlannedTag } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Place } from "../types";

/** A place as a list row: live rows link and may carry figures; pending rows carry the chip. */
export function PlaceRow({ place, detail, highlight, className }: { place: Place; detail?: string; highlight?: boolean; className?: string }) {
  const cls = cn(
    "flex items-center justify-between gap-4 rounded-[14px] px-5 py-3.5 no-underline hover:no-underline",
    place.status === "live" ? "bg-card shadow-card hover:bg-hairline" : "bg-card/60 text-muted",
    highlight && "outline outline-2 -outline-offset-2 outline-marigold",
    className,
  );
  const body = (
    <>
      <span className="min-w-0">
        <span className="block font-display text-[17px] font-bold text-ink">
          {place.name}
          {place.kind === "state" ? " State" : ""}
        </span>
        {detail && <span className="block text-[13px] text-muted">{detail}</span>}
      </span>
      {place.status === "live" ? (
        place.figures ? (
          <span className="shrink-0 text-right">
            <span data-num className="block font-display text-[19px] font-bold text-ink">
              {place.kind === "state" ? place.figures.display : place.figures.compact}
            </span>
            <span className="block text-[12px] text-muted">{place.figures.plain.replace(/^about /, "about ")}</span>
          </span>
        ) : (
          <span className="font-display font-bold text-ink" aria-hidden>
            →
          </span>
        )
      ) : (
        <PlannedTag />
      )}
    </>
  );
  return place.status === "live" ? (
    <Link href={place.href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls} aria-label={`${place.name} State, budget not available yet`}>
      {body}
    </div>
  );
}
