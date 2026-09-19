"use client";

import Link from "next/link";
import { AppHeader } from "@/components/shell";
import { ChatBubble, useChat } from "@/modules/chat";
import { FitText, MicPill, PlannedTag } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatCompact, lgaSlug, sectorLabel } from "@/modules/budget";
import { ResultCard } from "@/modules/results";
import { publishedOn } from "@/modules/ask";
import type { BrowseData } from "../types";

function href(base: BrowseData["query"], patch: Partial<Record<"lga" | "sector" | "unspent" | "sort", string | undefined>>) {
  const q = new URLSearchParams();
  q.set("state", base.state);
  const lga = patch.lga ?? base.lga;
  const sector = "sector" in patch ? patch.sector : base.sector;
  const unspent = "unspent" in patch ? patch.unspent : base.unspentOnly ? "1" : undefined;
  const sort = patch.sort ?? base.sort;
  q.set("lga", lga);
  if (sector) q.set("sector", sector);
  if (unspent) q.set("unspent", unspent);
  if (sort !== "amount") q.set("sort", sort);
  return `/browse?${q.toString()}`;
}

/** Browse your LGA: the ledger, grouped by sector, filterable to unspent. */
export function BrowseScreen({ data, chatAvailable }: { data: BrowseData; chatAvailable: boolean }) {
  const { query, summary, groups, lgas, registry } = data;
  const chat = useChat({ state: registry.slug, lga: query.lga });
  const place = summary.lgaLabel.replace(/ LGA$/, "");

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <ChatBubble chat={chat} disabled={!chatAvailable} place={`${place} in ${registry.name} State`} />
      <AppHeader places={lgas} state={{ slug: registry.slug, name: registry.name }} current={query.lga} />
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-5 border-b border-hairline px-5 py-6 lg:sticky lg:top-0 lg:h-[calc(100dvh-57px)] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-6">
          <div>
            <h1 className="font-display text-[26px] font-bold tracking-[-0.03em]">{summary.lgaLabel}</h1>
            <p className="text-[14px] text-muted">
              <span data-num>{summary.projects}</span> projects · {formatCompact(summary.total)} approved for 2026
            </p>
          </div>

          <div>
            <span className="eyebrow">Filter</span>
            <div className="mt-2 flex flex-col gap-2">
              <label className="flex items-center justify-between rounded-[12px] bg-clay px-4 py-3 text-[14px] font-semibold text-on-clay">
                <span className="sr-only">Local government</span>
                <select
                  value={query.lga}
                  onChange={(e) => (window.location.href = href(query, { lga: e.target.value, sector: undefined }))}
                  className="w-full bg-transparent font-semibold outline-none"
                >
                  {lgas.map((l) => (
                    <option key={l.lga} value={l.lga} className="text-ink">
                      {l.lgaLabel} · {l.projects}
                    </option>
                  ))}
                </select>
              </label>
              <span className="flex items-center justify-between rounded-[12px] bg-card px-4 py-3 text-[14px] font-semibold shadow-card">
                All {lgas.length} local governments <span data-num className="text-muted">{registry.projects?.toLocaleString("en-NG")}</span>
              </span>
              <span className="flex items-center justify-between rounded-[12px] bg-card/60 px-4 py-3 text-[14px] font-semibold text-muted">
                Federal tier <PlannedTag />
              </span>
            </div>
          </div>

          <div>
            <span className="eyebrow">Sector</span>
            <ul className="mt-2 flex flex-col">
              <li>
                <Link href={href(query, { sector: undefined })} className={cn("flex justify-between py-1.5 text-[14px] no-underline", !query.sector ? "font-bold text-ink" : "text-muted")}>
                  All sectors <span data-num>{summary.projects}</span>
                </Link>
              </li>
              {summary.bySector.map((s) => (
                <li key={s.sector}>
                  <Link
                    href={href(query, { sector: s.sector })}
                    className={cn("flex justify-between py-1.5 text-[14px] no-underline", query.sector === s.sector ? "font-bold text-ink" : "text-muted")}
                  >
                    {sectorLabel(s.sector)} <span data-num>{s.projects}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <Link href={`/s/${query.state}/${lgaSlug(query.lga)}`} className="mt-auto no-underline hover:no-underline">
            <MicPill state="idle" onPress={() => {}} className="w-full justify-center">
              Ask instead
            </MicPill>
          </Link>
        </aside>

        <main className="flex min-w-0 flex-col gap-6 px-5 py-6 sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[14px] font-semibold text-muted">
              <span data-num>{data.total}</span> project{data.total === 1 ? "" : "s"}
              {query.sector ? ` · ${sectorLabel(query.sector)?.toLowerCase()}` : ""}
              {query.unspentOnly ? " · approved for 2025, nothing spent" : ""} · sorted by {query.sort === "amount" ? "approved amount" : query.sort}
            </p>
            <div className="ml-auto flex items-center gap-2">
              <Link href={href(query, { sort: "amount" })} className={cn("rounded-full px-4 py-2 text-[13px] font-semibold no-underline", query.sort === "amount" ? "bg-clay text-on-clay" : "bg-card shadow-card")}>
                Highest amount
              </Link>
              <Link
                href={href(query, { unspent: query.unspentOnly ? undefined : "1" })}
                className={cn("rounded-full px-4 py-2 text-[13px] font-semibold no-underline", query.unspentOnly ? "bg-clay text-on-clay" : "bg-card shadow-card")}
                aria-pressed={query.unspentOnly}
              >
                Unspent only
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full bg-card/60 px-4 py-2 text-[13px] font-semibold text-muted">
                Export CSV <PlannedTag />
              </span>
            </div>
          </div>

          {groups.length === 0 && (
            <p className="rounded-[16px] bg-card p-5 text-[15px] text-muted shadow-card">
              No {query.sector ? sectorLabel(query.sector)?.toLowerCase() : ""} project for {place}
              {query.unspentOnly ? " with money approved for 2025 and nothing spent" : ""} in the 2026 approved budget. That doesn't mean none was
              promised — it means none is funded in this document.
            </p>
          )}

          {groups.map((g) => (
            <section key={g.sector} className="flex flex-col gap-3">
              <h2 className="border-b border-hairline-strong pb-2 font-display text-[19px] font-bold">{g.label}</h2>
              {g.projects.map((p) => (
                <ResultCard key={p.id} project={p} variant="ledger" />
              ))}
            </section>
          ))}

          <p className="text-[13px] text-muted">
            Plus <span data-num>{data.stateWide}</span> state-wide{query.sector ? ` ${sectorLabel(query.sector)?.toLowerCase()}` : ""} projects that are not
            assigned to any one local government and may include {place}.
          </p>

          <section className="flex flex-wrap items-end justify-between gap-4 rounded-[20px] bg-card p-5 shadow-card">
            <div className="max-w-[560px]">
              <span className="eyebrow">Where these figures come from</span>
              <p className="mt-1 text-[14px] leading-snug text-muted">
                {registry.document}
                {registry.published ? `, published ${publishedOn(registry)}` : ""}. <span data-num>{registry.pages}</span> pages, read
                line by line, reconciling to the official state total.
              </p>
            </div>
            <div className="w-full max-w-[320px] text-right">
              <FitText data-num text={`₦${registry.total_2026?.toLocaleString("en-NG") ?? ""}`} max={26} min={16} className="font-display font-bold tracking-[-0.03em]" />
              <p className="text-[13px] text-muted">
                <span data-num>{registry.projects?.toLocaleString("en-NG")}</span> projects · {lgas.length} local governments
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
