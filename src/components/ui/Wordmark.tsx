import Link from "next/link";
import { cn } from "@/lib/cn";

export function Wordmark({ onClay = false, className, href = "/" }: { onClay?: boolean; className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 no-underline hover:no-underline", className)}>
      <span className="h-3.5 w-3.5 rounded-[5px] bg-marigold" aria-hidden />
      <span className={cn("font-display text-[20px] font-bold tracking-[-0.015em]", onClay ? "text-on-clay" : "text-ink")}>
        Budget Line
      </span>
    </Link>
  );
}
