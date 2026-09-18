"use client";

import Link from "next/link";
import { MicButton, type MicState } from "@/components/ui";
import type { Preferences } from "@/modules/prefs";
import { lgaPosition } from "../services/positions";
import type { AtlasData } from "../types";
import { Cluster } from "./Cluster";
import { PlaceRow } from "./PlaceRow";

type Props = {
  data: AtlasData;
  saved: Preferences;
  view: "map" | "list";
  micState: MicState;
  onMic: () => void;
};

/** A state expanded: its local governments as circles (or a list), figures per area. */
export function StateView({ data, saved, view, micState, onMic }: Props) {
  const niger = data.states.find((s) => s.status === "live")!;
  const featured = data.lgas.find((l) => l.figures);
  const savedKey = saved.lga;
  const sorted = [...data.lgas].sort((a, b) => (a.figures ? -1 : b.figures ? 1 : a.name.localeCompare(b.name)));

  const rows = (
    <div className="flex flex-col gap-2.5">
      {sorted.map((l) => (
        <PlaceRow
          key={l.key}
          place={l}
          highlight={!!l.figures}
          detail={
            l.figures
              ? `${l.figures.projects} projects${l.unspent ? ` · ${l.unspent} with money approved last year and nothing recorded spent` : ""}`
              : l.key === savedKey
                ? "Your saved area"
                : undefined
          }
        />
      ))}
    </div>
  );

  return (
    <div className="grid flex-1 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-5 border-b border-hairline px-6 py-6 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-marigold font-display text-[14px] font-bold text-clay">{niger.name}</span>
          <div>
            <h1 className="font-display text-[26px] font-bold leading-tight tracking-[-0.03em]">{niger.name} State</h1>
            <p className="text-[13px] text-muted">{data.lgas.length} local governments</p>
          </div>
        </div>
        <div className="rounded-[18px] bg-card p-5 shadow-card">
          <span className="eyebrow">Approved for 2026</span>
          <p data-num className="mt-1 font-display text-[26px] font-extrabold leading-none tracking-[-0.04em]">
            {niger.figures?.display}
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-marigold-text">{niger.figures?.plain}</p>
          <p className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-[13px] text-muted">
            Capital projects{" "}
            <span data-num className="font-display text-[16px] font-bold text-ink">
              {niger.figures?.projects.toLocaleString("en-NG")}
            </span>
          </p>
        </div>
        {savedKey && data.lgas.some((l) => l.key === savedKey) && (
          <Link href={`/s/niger/${savedKey.toLowerCase()}`} className="inline-flex items-center justify-between rounded-full bg-card px-5 py-3 text-[14px] font-semibold text-ink no-underline shadow-card hover:bg-hairline hover:no-underline">
            Continue with {saved.lgaLabel?.replace(/ LGA$/, "")} <span aria-hidden>→</span>
          </Link>
        )}
        <div className="mt-4 hidden flex-col items-center gap-1.5 lg:flex">
          <MicButton state={micState} onPress={onMic} size={140} />
          <span className="font-display text-[20px] font-bold">Say a local government</span>
          <span className="text-[13px] text-muted">{view === "map" ? "Or pick one from the cluster" : "Or pick one from the list"}</span>
        </div>
        <p className="mt-auto hidden border-t border-hairline pt-4 text-[12px] leading-snug text-muted lg:block">
          <span className="block font-semibold text-ink">{data.registry.document}</span>
          <span data-num>{data.registry.pages}</span> pages, read line by line, reconciling to the official state total.
        </p>
      </aside>

      <main className="flex min-w-0 flex-col px-5 py-6 sm:px-8">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="font-display text-[24px] font-bold tracking-[-0.025em]">Choose a local government</h2>
          <span className="text-[13px] text-muted">Figures load per area{view === "list" ? " · alphabetical" : ""}</span>
        </div>
        <Cluster
          className={view === "map" ? "mt-4 hidden w-full lg:block" : "hidden"}
          places={data.lgas}
          positionFor={(p) => lgaPosition("niger", p.key)}
          featuredKey={featured?.key}
          figuresFor={featured ? [featured.key] : []}
          liveStateName={niger.name}
          status={`All ${data.lgas.length} have figures`}
          height="clamp(560px, calc(100dvh - 300px), 860px)"
        />
        <div className={view === "map" ? "mt-4 lg:hidden" : "mt-4"}>{rows}</div>
        {view === "list" && <p className="mt-3 text-[13px] text-muted">Circle size is decorative and carries no data</p>}
      </main>
    </div>
  );
}
