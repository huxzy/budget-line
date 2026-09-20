"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { FitText } from "./FitText";

const SIZES = {
  hero: "tracking-[-0.045em] font-extrabold",
  lg: "tracking-[-0.04em] font-extrabold",
  md: "tracking-[-0.035em] font-bold",
  sm: "tracking-[-0.02em] font-bold",
} as const;

/** Design sizes in px; a long figure shrinks below these rather than wrapping. */
const MAX = { hero: 50, lg: 32, md: 26, sm: 19 } as const;

type Props = {
  /** Exact figure string from the dataset, e.g. "₦75,000,000". */
  display: string;
  /** Plain-words line, e.g. "75 million naira". Omit to hide. */
  plain?: string;
  /** Numeric value; only needed for the count-up. */
  value?: number;
  size?: keyof typeof SIZES;
  /** Count up from zero over 600ms when the figure first appears. */
  countUp?: boolean;
  /** Marigold text — used for the ₦0 case in the unspent panel. */
  accent?: boolean;
  className?: string;
  align?: "left" | "right";
};

const whole = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

function useCountUp(target: number | undefined, enabled: boolean) {
  const [n, setN] = useState(enabled ? 0 : target);
  useEffect(() => {
    if (!enabled || target === undefined) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 600);
      const eased = 1 - Math.pow(1 - k, 3);
      setN(Math.round(target * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, enabled]);
  return n;
}

/**
 * A figure and its plain reading. The exact `display` string is always what
 * settles on screen; the count-up only animates the whole-naira part.
 */
export function Amount({ display, plain, value, size = "md", countUp = false, accent, className, align = "left" }: Props) {
  const animating = countUp && value !== undefined;
  const n = useCountUp(value, animating);
  const settled = !animating || n === value;
  const text = settled ? display : `₦${whole.format(n ?? 0)}`;

  return (
    // min-w-0: as a flex item the figure must be allowed to shrink, and the caller
    // gives it real width (flex-1); a size-contained FitText with no width
    // collapses to zero and spills past the card.
    <div className={cn("flex min-w-0 flex-col gap-0.5", align === "right" && "items-end text-right", className)}>
      <FitText
        data-num
        text={text}
        max={MAX[size]}
        min={size === "hero" ? 22 : 14}
        className={cn("font-display text-ink", SIZES[size], accent && "text-marigold-text", align === "right" && "text-right")}
        aria-label={display}
      />
      {plain && (
        <span data-num className={cn("font-semibold text-soft", size === "hero" ? "text-[15px]" : "text-[13px]")}>
          {plain}
        </span>
      )}
    </div>
  );
}
