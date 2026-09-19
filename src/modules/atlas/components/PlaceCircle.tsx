"use client";

import Link from "next/link";
import { useId } from "react";
import { PlannedTag } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Place, Position } from "../types";

type Props = {
  place: Place;
  position: Position;
  /** Marigold fill with the name inside — every live local government. */
  filled?: boolean;
  /** Filled, plus the breathe and two rings — the place with figures on show. */
  featured?: boolean;
  /** Show the place's figures in a persistent tooltip (Niger, Bida). */
  showFigures?: boolean;
  liveStateName?: string;
  /** Slightly smaller discs for a field where every circle carries a figures card. */
  dense?: boolean;
  /** Two-line figures card (count and compact total) instead of the full one. */
  compactFigures?: boolean;
};

/**
 * One circle in a cluster. A real button: live places are links, pending
 * places are aria-disabled buttons that stay in the tab order so the
 * tooltip explaining why is reachable by keyboard. The tooltip is in
 * the DOM at all times and referenced by aria-describedby, so screen readers
 * get the same content sighted users hover for. Size carries no data.
 */
export function PlaceCircle({ place, position, filled = false, featured = false, showFigures = false, liveStateName = "Niger", dense = false, compactFigures = false }: Props) {
  const solid = filled || featured;
  const tipId = useId();
  const live = place.status === "live";
  const { x, y, size, drift } = position;
  // Sizes scale with the field (container query units) so the cluster reads
  // the same on a laptop and a wide monitor; the 56/64/72 rotation becomes
  // 8/9/10% of the field width, never below the design's pixel sizes.
  const cq = { 56: 6.5, 64: 7.5, 72: 8.5 }[size] * (dense ? 0.8 : 1);
  const disc = `clamp(${size}px, ${cq}cqw, ${Math.round(size * (dense ? 1.25 : 1.6))}px)`;
  const wrap = `calc(${disc} + 48px)`;

  const tooltip = live ? (
    place.figures && (place.kind === "lga" || compactFigures) ? (
      <>
        <span data-num className="block text-[12px] font-bold text-ink">
          {place.figures.projects.toLocaleString("en-NG")} projects
        </span>
        <span data-num className="block text-[11px] font-semibold text-marigold-text">
          {place.figures.compact}
        </span>
      </>
    ) : place.figures ? (
      <>
        <span data-num className="block font-display text-[15px] font-bold text-ink">
          {place.figures.projects.toLocaleString("en-NG")} projects
        </span>
        <span data-num className="block text-[12px] font-semibold text-ink">
          {place.figures.display}
        </span>
        <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-marigold-text">{place.figures.plain}</span>
      </>
    ) : (
      <span className="block text-[12px] font-semibold text-ink">Open {place.name}</span>
    )
  ) : (
    <>
      <span className="block font-display text-[14px] font-bold">{place.name}</span>
      <span className="block text-[12px] leading-snug">
        Budget not available yet. {liveStateName} is the first state on Budget Line.
      </span>
    </>
  );

  const discEl = (
    <span
      className={cn(
        "relative block rounded-full [container-type:inline-size] transition-[transform,background-color,box-shadow] duration-160 ease-out",
        live
          ? solid
            ? "bg-marigold shadow-[0_12px_26px_-14px_rgba(58,31,23,0.6)]"
            : "bg-white/60 shadow-[inset_0_0_0_1px_var(--hairline),0_8px_18px_-15px_rgba(58,31,23,0.55)] dark:bg-card/60"
          : "bg-white/60 shadow-[inset_0_0_0_1px_var(--hairline)] dark:bg-card/60",
        live && "group-hover:-translate-y-[3px] group-hover:bg-marigold-soft group-focus-visible:-translate-y-[3px] group-active:scale-[0.96] group-active:translate-y-0",
        solid && "group-hover:bg-marigold-deep",
        featured && "motion-safe:animate-breathe",
        !live && "group-hover:outline group-hover:outline-2 group-hover:outline-dashed group-hover:outline-marigold-text/60 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-dashed group-focus-visible:outline-marigold-text/60",
      )}
      style={{ width: disc, height: disc }}
      aria-hidden
    >
      {featured && (
        <>
          <span className="absolute inset-0 rounded-full bg-marigold/40 motion-safe:animate-ring" />
          <span className="absolute inset-0 rounded-full bg-marigold/30 motion-safe:animate-ring motion-safe:[animation-delay:1.4s]" />
        </>
      )}
      {solid && (
        <span
          className="absolute inset-0 flex items-center justify-center overflow-hidden px-[12%] text-center font-display font-bold leading-tight text-clay"
          // Sized against the disc itself (its own container), so any name keeps a 12% margin.
          style={{ fontSize: `clamp(9px, min(24cqw, ${Math.round(115 / place.name.length)}cqw), 20px)` }}
        >
          {place.name}
        </span>
      )}
    </span>
  );

  const label = (
    <span className={cn("relative z-[5] mt-1.5 block font-semibold", live ? "text-label" : "text-label/80")} style={{ fontSize: "clamp(11px, 1cqw, 14px)" }}>
      {solid ? "" : place.name}
    </span>
  );

  const tip = (
    <span
      id={tipId}
      role="tooltip"
      className={cn(
        "pointer-events-none absolute left-1/2 top-full z-20 mt-0.5 w-max max-w-[210px] -translate-x-1/2 rounded-[12px] text-left shadow-card transition-opacity delay-[350ms] duration-200",
        place.kind === "lga" || compactFigures ? "px-2.5 py-1.5 text-center" : "px-3.5 py-2.5",
        live ? "bg-card" : "bg-clay text-on-clay",
        showFigures ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
      )}
    >
      {tooltip}
      {!live && (
        <span className="mt-1.5 block">
          <PlannedTag className="border-on-clay-muted text-on-clay-muted" />
        </span>
      )}
    </span>
  );

  const common = {
    className: cn(
      "group absolute flex flex-col items-center rounded-[18px] text-center outline-none hover:z-30 focus-visible:z-30 focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
      showFigures && "z-10",
      "motion-safe:animate-[var(--drift)]",
      !live && "cursor-not-allowed",
    ),
    style: {
      left: `calc(${x}% - ${wrap} / 2)`,
      top: `${y}%`,
      width: wrap,
      ["--drift" as string]: `bl-d${drift.path} ${drift.duration}s ease-in-out -${drift.delay}s infinite alternate`,
    },
    "aria-describedby": tipId,
  };

  if (live) {
    return (
      <Link href={place.href} aria-label={`Open ${place.name}${place.kind === "state" ? " State" : ""}`} {...common}>
        {discEl}
        {label}
        {tip}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-disabled="true"
      aria-label={`${place.name} State, budget not available yet`}
      onClick={(e) => e.preventDefault()}
      {...common}
    >
      {discEl}
      {label}
      {tip}
    </button>
  );
}
