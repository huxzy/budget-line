"use client";

import { cn } from "@/lib/cn";
import { MicGlyph } from "./MicGlyph";

export type MicState = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "unavailable";

type Props = {
  state: MicState;
  onPress: () => void;
  /** Disc diameter in px. 152 on the rail, 96 on mobile, 44 inside a pill. */
  size?: number;
  label?: string;
  className?: string;
};

/**
 * The mic disc. Always the largest object on its screen. Idle breathes on a
 * 3.4s loop; listening grows two offset rings from the disc edge; pressed
 * scales to 0.94. Unavailable is muted with the reason in the label.
 */
export function MicButton({ state, onPress, size = 152, label, className }: Props) {
  const live = state === "listening" || state === "speaking" || state === "thinking";
  const disabled = state === "unavailable";
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={label ?? (live ? "End the call" : "Start talking")}
      aria-pressed={live}
      className={cn("group relative inline-flex shrink-0 items-center justify-center rounded-full", className)}
      style={{ width: size, height: size }}
    >
      {live && (
        <>
          <span className="absolute inset-0 animate-ring rounded-full bg-marigold/40" aria-hidden />
          <span className="absolute inset-0 animate-ring rounded-full bg-marigold/30 [animation-delay:0.9s]" aria-hidden />
        </>
      )}
      <span className="absolute -inset-[18%] rounded-full bg-marigold/15" aria-hidden />
      <span
        className={cn(
          "relative flex items-center justify-center rounded-full text-clay shadow-[0_18px_30px_-16px_rgba(36,22,17,0.7)] transition-transform duration-150",
          disabled ? "bg-hairline-strong text-muted" : "bg-marigold",
          state === "idle" && "animate-breathe",
          state === "connecting" && "opacity-70",
          "group-active:scale-[0.94] group-active:bg-marigold-deep group-active:shadow-[0_4px_10px_-6px_rgba(36,22,17,0.7)]",
        )}
        style={{ width: size * 0.66, height: size * 0.66 }}
      >
        <MicGlyph size={Math.round(size * 0.3)} />
      </span>
    </button>
  );
}

/** The compact pill: mic disc plus a label, for "Ask again" / "Ask instead". */
export function MicPill({ state, onPress, children, className }: { state: MicState; onPress: () => void; children: React.ReactNode; className?: string }) {
  const disabled = state === "unavailable";
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-3.5 rounded-[22px] bg-clay py-4 pl-4 pr-7 text-on-clay shadow-rail transition-transform active:scale-[0.97] disabled:opacity-50",
        className,
      )}
    >
      <span className={cn("flex h-11 w-11 items-center justify-center rounded-full text-clay", disabled ? "bg-hairline-strong" : "bg-marigold")}>
        <MicGlyph size={22} />
      </span>
      <span className="font-display text-[20px] font-bold tracking-[-0.02em]">{children}</span>
    </button>
  );
}
