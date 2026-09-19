import { cn } from "@/lib/cn";

/**
 * A single line of text that shrinks to fit its container, never wraps.
 * Uses container-query units: the font size is capped at `max` px and
 * otherwise set so `chars` characters fit the width. `ratio` is the average
 * character width as a fraction of the font size (digits in a bold display
 * face are about 0.62em).
 */
export function FitText({ text, max, min = 12, ratio = 0.62, className, ...rest }: { text: string; max: number; min?: number; ratio?: number; className?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  const chars = Math.max(1, text.length);
  return (
    <span className={cn("block w-full [container-type:inline-size]", className)}>
      <span
        {...rest}
        className="block whitespace-nowrap"
        style={{ fontSize: `clamp(${min}px, calc(100cqw / ${(chars * ratio).toFixed(2)}), ${max}px)`, lineHeight: 1.02 }}
      >
        {text}
      </span>
    </span>
  );
}
