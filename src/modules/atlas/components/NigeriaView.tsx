"use client";

import Link from "next/link";
import { MicButton, type MicState, PlannedTag } from "@/components/ui";
import { statePosition } from "../services/positions";
import type { AtlasData } from "../types";
import { Cluster } from "./Cluster";
import { MiniConstellation } from "./MiniConstellation";

type Props = {
  data: AtlasData;
  micState: MicState;
  onMic: () => void;
  /** Type instead of talking. */
  composer?: React.ReactNode;
  onSearch: () => void;
};

/** The Nigeria view: 37 states as a drifting cluster, Niger live in marigold. */
export function NigeriaView({ data, micState, onMic, onSearch, composer }: Props) {
  const live = data.states.filter((s) => s.status === "live");
  const niger = live[0];
  const pendingCount = data.states.length - data.liveCount;

  return (
    <div className="grid flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
      <main className="flex min-w-0 flex-col px-5 py-6 sm:px-9 sm:py-8">
        <h1 className="font-display text-[32px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[38px]">Where do you want to look?</h1>
        <p className="mt-2 text-[15px] text-muted">Choose a state, then a local government. Or say the name out loud.</p>


        {/* Desktop: the cluster. */}
        <Cluster
          className="mt-4 hidden w-full lg:block"
          places={data.states}
          positionFor={(p) => statePosition(p.key)}
          featureLive
          dense
          liveStateName={niger.name}
          status={`${data.liveCount} of ${data.states.length} states available`}
        />

        {/* Phones: the hierarchy inverts — the live state is a full card, the rest a static constellation. */}
        <div className="mt-5 flex flex-col gap-4 lg:hidden">
          <button type="button" onClick={onSearch} className="flex items-center gap-3 rounded-[14px] bg-card px-4 py-3.5 text-left text-[15px] text-soft shadow-card">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-hairline-strong" aria-hidden /> Search states and areas
          </button>
          <Link href={niger.href} className="rounded-[20px] bg-marigold p-5 text-clay no-underline shadow-hero hover:no-underline">
            <span className="flex items-center justify-between">
              <span className="font-display text-[24px] font-bold">{niger.name} State</span>
              <span className="rounded-md bg-clay px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-on-clay">Available</span>
            </span>
            <span className="mt-3 flex items-end justify-between">
              <span>
                <span data-num className="block font-display text-[22px] font-bold">
                  {niger.figures?.projects.toLocaleString("en-NG")}
                </span>
                <span className="text-[12px] font-semibold">capital projects</span>
              </span>
              <span className="text-right">
                <span data-num className="block font-display text-[22px] font-bold">
                  {niger.figures?.compact}
                </span>
                <span className="text-[12px] font-semibold">{niger.figures?.plain}</span>
              </span>
            </span>
            <span className="mt-4 flex items-center justify-between rounded-full bg-clay px-5 py-3 text-[15px] font-semibold text-on-clay">
              Open {data.lgas.length} local governments <span aria-hidden>→</span>
            </span>
          </Link>
          <div>
            <div className="flex items-center justify-between">
              <span className="eyebrow">Next to be read</span>
              <span data-num className="text-[12px] font-semibold text-label">
                {data.liveCount} of {data.states.length} available
              </span>
            </div>
            <div className="mt-2">
              <MiniConstellation states={data.states} />
            </div>
            <p className="mt-2 flex flex-col gap-0.5 text-[12px] text-muted">
              <span>{pendingCount} states · budgets not available yet</span>
              <span>Circle size is decorative and carries no data</span>
            </p>
          </div>
        </div>
      </main>

      <aside className="hidden flex-col gap-5 border-l border-hairline px-6 py-6 lg:sticky lg:top-0 lg:flex lg:max-h-dvh lg:overflow-y-auto">
        <button type="button" onClick={onSearch} className="flex items-center gap-2.5 rounded-full bg-card px-4 py-2.5 text-left text-[14px] text-soft shadow-card hover:bg-hairline">
          <span className="h-3 w-3 shrink-0 rounded-full border-2 border-hairline-strong" aria-hidden />
          <span className="truncate">Search states and areas</span>
        </button>
        <div className="flex flex-col items-center gap-1.5">
          <MicButton state={micState} onPress={onMic} size={140} />
          <span className="font-display text-[22px] font-bold">Tap to talk</span>
          <span className="max-w-[240px] text-center text-[13px] leading-snug text-muted">
            Ask Budget Line out loud about any covered state or local government; it answers with figures from the budget.
          </span>
          {composer && <div className="mt-2 w-full">{composer}</div>}
        </div>
        <div>
          <span className="eyebrow">Available now{live.length > 1 ? ` · ${live.length}` : ""}</span>
          <div className="mt-2 flex flex-col gap-1.5">
            {live.map((st) => (
              <Link key={st.key} href={st.href} className="flex items-center justify-between gap-3 rounded-[12px] bg-card px-4 py-2.5 no-underline shadow-card hover:bg-hairline hover:no-underline">
                <span className="min-w-0">
                  <span className="block font-display text-[15px] font-bold leading-tight text-ink">{st.name}</span>
                  <span data-num className="block text-[12px] text-muted">
                    {st.figures?.projects.toLocaleString("en-NG")} projects · {st.figures?.compact}
                  </span>
                </span>
                <span className="font-display font-bold text-ink" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <span className="eyebrow">Next to be read</span>
          <div className="mt-2 flex flex-col gap-2">
            <span className="flex items-center justify-between rounded-[14px] bg-card/70 px-5 py-4 text-[16px] font-bold text-muted">
              {pendingCount} {pendingCount === 1 ? "other state" : "other states"} <PlannedTag />
            </span>
            <span className="flex items-center justify-between rounded-[14px] bg-card/70 px-5 py-4 text-[16px] font-bold text-muted">
              Federal tier <PlannedTag />
            </span>
          </div>
        </div>
        <p className="mt-auto border-t border-hairline pt-4 text-[12px] leading-snug text-muted">
          <span className="block font-semibold text-ink">{data.registry.document}</span>
          <span data-num>{data.registry.pages}</span> pages, read line by line, reconciling to the official state total.
        </p>
      </aside>
    </div>
  );
}
