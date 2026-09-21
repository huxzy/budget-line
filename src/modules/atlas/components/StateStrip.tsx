"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Place } from "../types";

/**
 * Phones only: the live states as full-width cards in a horizontal strip.
 * Swipe to change state; each card snaps into place. Dots underneath say
 * where you are. The swipe itself is plain CSS scroll snapping; the script
 * only keeps the dots in step.
 */
export function StateStrip({ states }: { states: Place[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div>
      <div
        ref={ref}
        className="-mx-5 flex snap-x snap-mandatory overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-roledescription="carousel"
        aria-label="Available states, swipe to change"
      >
        {states.map((st, i) => (
          <div key={st.key} className="w-full shrink-0 snap-center px-1" aria-label={`${i + 1} of ${states.length}`}>
            <Link href={st.href} className="block rounded-[20px] bg-marigold p-5 text-clay no-underline shadow-hero hover:no-underline">
              <span className="flex items-center justify-between">
                <span className="font-display text-[24px] font-bold">{st.name} State</span>
                <span className="rounded-md bg-clay px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-on-clay">Available</span>
              </span>
              <span className="mt-3 flex items-end justify-between">
                <span>
                  <span data-num className="block font-display text-[22px] font-bold">
                    {st.figures?.projects.toLocaleString("en-NG")}
                  </span>
                  <span className="text-[12px] font-semibold">capital projects</span>
                </span>
                <span className="text-right">
                  <span data-num className="block font-display text-[22px] font-bold">
                    {st.figures?.compact}
                  </span>
                  <span className="text-[12px] font-semibold">{st.figures?.plain}</span>
                </span>
              </span>
              <span className="mt-4 flex items-center justify-between rounded-full bg-clay px-5 py-3 text-[15px] font-semibold text-on-clay">
                Open {st.name} <span aria-hidden>→</span>
              </span>
            </Link>
          </div>
        ))}
      </div>
      {states.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden>
          {states.map((st, i) => (
            <span key={st.key} className={i === index ? "h-1.5 w-5 rounded-full bg-marigold" : "h-1.5 w-1.5 rounded-full bg-hairline-strong"} />
          ))}
        </div>
      )}
      <p className="mt-2 text-center text-[12px] text-muted">
        Swipe for more states · {index + 1} of {states.length}
      </p>
    </div>
  );
}
