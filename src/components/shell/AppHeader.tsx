"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LiveTag, PlannedTag, Wordmark } from "@/components/ui";
import { cn } from "@/lib/cn";
import { lgaSlug } from "@/modules/budget";
import { usePreferences } from "@/modules/prefs";

export type HeaderPlace = { lga: string; lgaLabel: string };

const NAV = [
  { href: "/ask", label: "Ask" },
  { href: "/browse", label: "Browse" },
] as const;

type Props = {
  className?: string;
  /** The current state's local governments; with these the area pill becomes a dropdown. */
  places?: HeaderPlace[];
  state?: { slug: string; name: string };
  current?: string;
};

/** Top bar on every cream screen. Planned items are labels, not links. */
export function AppHeader({ className, places, state, current }: Props) {
  const path = usePathname();
  const router = useRouter();
  const { prefs, ready } = usePreferences();
  const lgaQuery = prefs.lga ? `?state=${prefs.state ?? ""}&lga=${encodeURIComponent(prefs.lga)}` : "";

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
                className={cn(
                  "pb-0.5 no-underline hover:no-underline",
                  active ? "border-b-2 border-clay text-ink" : "text-muted hover:text-ink",
                )}
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
        {places && state ? (
          <label className="relative inline-flex items-center rounded-full bg-card pl-3.5 pr-2 text-[14px] font-semibold text-ink shadow-card">
            <span className="sr-only">Change area</span>
            <select
              value={current ?? ""}
              onChange={(e) => router.push(e.target.value === "__state" ? "/" : `/s/${state.slug}/${lgaSlug(e.target.value)}`)}
              className="max-w-[200px] cursor-pointer appearance-none bg-transparent py-2 pr-6 font-semibold outline-none"
            >
              {places.map((p) => (
                <option key={p.lga} value={p.lga}>
                  {p.lgaLabel}
                </option>
              ))}
              <option value="__state">Change state…</option>
            </select>
            <span aria-hidden className="pointer-events-none absolute right-3 text-muted">
              ▾
            </span>
          </label>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-[14px] font-semibold text-ink no-underline shadow-card hover:no-underline"
          >
            {ready && prefs.lgaLabel ? prefs.lgaLabel : "Choose an area"}
            <span aria-hidden className="text-muted">
              ▾
            </span>
          </Link>
        )}
        <span className="hidden items-center gap-2 rounded-full bg-card px-3.5 py-2 text-[14px] font-semibold text-ink shadow-card sm:inline-flex">
          English <LiveTag />
        </span>
      </div>
    </header>
  );
}
