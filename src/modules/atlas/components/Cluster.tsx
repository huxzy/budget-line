import type { Place, Position } from "../types";
import { PlaceCircle } from "./PlaceCircle";

type Props = {
  places: Place[];
  positionFor: (p: Place) => Position;
  featuredKey?: string;
  /** Fill every live circle in marigold (the local-government view). */
  fillLive?: boolean;
  /** Keys whose figures show in a persistent tooltip. */
  figuresFor?: string[];
  liveStateName?: string;
  className?: string;
  /** Left-hand footer line, e.g. "1 of 37 states available". */
  status: string;
  /** Field height. The field fills its column's width; positions are percentages. */
  height?: string;
};

/**
 * A drifting cluster of place circles in a fixed-ratio field. Motion is CSS
 * only, and off under prefers-reduced-motion. The correctness line under the
 * field is always visible: circle size carries no data.
 */
export function Cluster({ places, positionFor, featuredKey, fillLive = false, figuresFor = [], liveStateName, className, status, height = "clamp(520px, calc(100dvh - 360px), 820px)" }: Props) {
  return (
    <div className={className}>
      <div className="relative w-full [container-type:inline-size]" style={{ height }} role="group" aria-label="Places">
        {places.map((p) => (
          <PlaceCircle
            key={p.key}
            place={p}
            position={positionFor(p)}
            filled={fillLive && p.status === "live"}
            featured={p.key === featuredKey}
            showFigures={figuresFor.includes(p.key)}
            liveStateName={liveStateName}
          />
        ))}
      </div>
      <p className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
        <span data-num className="font-semibold text-label">
          {status}
        </span>
        <span className="hidden h-4 w-px bg-hairline-strong sm:inline-block" aria-hidden />
        <span>Circle size is decorative and carries no data</span>
      </p>
    </div>
  );
}
