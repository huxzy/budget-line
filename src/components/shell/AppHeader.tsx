"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LiveTag, PlannedTag, Wordmark } from "@/components/ui";
import { cn } from "@/lib/cn";
import { usePreferences } from "@/modules/prefs";

const NAV = [
  { href: "/ask", label: "Ask" },
  { href: "/browse", label: "Browse" },
] as const;

/** Top bar on every cream screen. Planned items are labels, not links. */
export function AppHeader({ className }: { className?: string }) {
  const path = usePathname();
  const { prefs, ready } = usePreferences();
  const lgaQuery = prefs.lga ? `?lga=${encodeURIComponent(prefs.lga)}` : "";

  return (
    <header className={cn("flex items-center justify-between gap-4 border-b border-hairline px-4 py-3.5 sm:px-10", className)}>
      <div className="flex items-center gap-4 sm:gap-7">
        <Wordmark />
        <nav className="hidden items-center gap-5 text-[15px] font-semibold sm:flex" aria-label="Primary">
          {NAV.map((n) => {
            const active = path === n.href || path.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href === "/browse" ? `/browse${lgaQuery}` : n.href}
                className={cn("pb-0.5 no-underline hover:no-underline", active ? "border-b-2 border-clay text-ink" : "text-muted hover:text-ink")}
              >
                {n.label}
              </Link>
            );
          })}
          <span className="inline-flex items-center gap-1.5 text-muted/70">
            Saved <PlannedTag />
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted/70">
            Phone access <PlannedTag />
          </span>
        </nav>
      </div>
      <div className="flex items-center gap-2.5">
        <Link
          href="/?change=lga"
          className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-[14px] font-semibold text-ink no-underline shadow-card hover:no-underline"
        >
          {ready && prefs.lgaLabel ? prefs.lgaLabel : "Choose area"}
          <span aria-hidden className="text-muted">
            ▾
          </span>
        </Link>
        <span className="hidden items-center gap-2 rounded-full bg-card px-3.5 py-2 text-[14px] font-semibold text-ink shadow-card sm:inline-flex">
          English <LiveTag />
        </span>
      </div>
    </header>
  );
}
