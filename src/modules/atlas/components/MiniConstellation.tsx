import type { Place } from "../types";
import { statePosition } from "../services/positions";

/** A small, static, decorative echo of the cluster for narrow screens. Carries no data. */
export function MiniConstellation({ states }: { states: Place[] }) {
  return (
    <div className="relative w-full overflow-hidden rounded-[14px] bg-card-soft" style={{ aspectRatio: "3 / 1" }} aria-hidden>
      {states.map((s) => {
        const p = statePosition(s.key);
        const d = s.status === "live" ? 18 : 12 + (p.size - 56) / 4;
        return (
          <span
            key={s.key}
            className={s.status === "live" ? "absolute rounded-full bg-marigold" : "absolute rounded-full bg-card shadow-[inset_0_0_0_1px_var(--hairline-strong)]"}
            style={{ left: `calc(${p.x}% - ${d / 2}px)`, top: `calc(${p.y * 0.8 + 6}% - ${d / 2}px)`, width: d, height: d }}
          />
        );
      })}
    </div>
  );
}
