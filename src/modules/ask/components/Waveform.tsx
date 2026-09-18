import { cn } from "@/lib/cn";

const BARS = [0.35, 0.7, 1, 0.55, 0.8, 0.45, 0.9, 0.6, 0.4];

/** Nine bars that ride the mic level while listening; flat when idle. */
export function Waveform({ active, className }: { active: boolean; className?: string }) {
  return (
    <div className={cn("flex h-8 items-center justify-center gap-1", className)} aria-hidden>
      {BARS.map((h, i) => (
        <span
          key={i}
          className={cn("w-1 rounded-full bg-on-clay/80 origin-center", active && "animate-wave")}
          style={{ height: `${h * 100}%`, animationDelay: `${i * 90}ms`, transform: active ? undefined : "scaleY(0.28)" }}
        />
      ))}
    </div>
  );
}
