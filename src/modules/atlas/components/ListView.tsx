"use client";

import { Button, MicButton, type MicState, PlannedTag } from "@/components/ui";
import type { AtlasData, Place } from "../types";
import { PlaceRow } from "./PlaceRow";
import { SearchPanel } from "./SearchPanel";

type Props = {
  data: AtlasData;
  reduced: boolean;
  onShowMap: () => void;
  micState: MicState;
  onMic: () => void;
};

/**
 * The same places as a list: the guaranteed path. Live places first with their
 * figures, pending states as an A–Z grid of chips. Shown under reduced motion
 * and available to anyone; "Show the map anyway" is always there.
 */
export function ListView({ data, reduced, onShowMap, micState, onMic }: Props) {
  const live = data.states.filter((s) => s.status === "live");
  const pending = data.states.filter((s) => s.status === "pending").sort((a, b) => a.name.localeCompare(b.name));
  const featured = data.lgas.filter((l) => l.figures);

  return (
    <div className="grid flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
      <main className="flex flex-col gap-5 px-5 py-6 sm:px-8">
        <SearchPanel data={data} open inline onClose={() => {}} />
        <section className="flex flex-col gap-2">
          <span className="eyebrow">Available now</span>
          {live.map((s) => (
            <PlaceRow key={s.key} place={s} detail={`${s.figures?.projects.toLocaleString("en-NG")} projects · ${data.lgas.length} local governments`} highlight />
          ))}
          {featured.map((l) => (
            <PlaceRow key={l.key} place={l} detail={`Local government · ${l.stateName} State · ${l.figures?.projects} projects`} />
          ))}
        </section>
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="eyebrow">No budget yet</span>
            <span data-num className="text-[13px] font-semibold text-label">
              {data.liveCount} of {data.states.length} states available
            </span>
          </div>
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3" aria-label="States without a budget yet">
            {pending.map((s: Place) => (
              <li key={s.key} className="flex items-center justify-between gap-2 rounded-[12px] bg-card/70 px-4 py-3 text-[14px] font-semibold text-muted" aria-label={`${s.name} State, budget not available yet`}>
                {s.name}
                <PlannedTag />
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-muted">
            All {pending.length} carry no figures yet · A–Z
          </p>
        </section>
      </main>

      <aside className="flex flex-col gap-5 border-t border-hairline px-6 py-6 lg:border-l lg:border-t-0">
        <div className="flex flex-col items-center gap-2">
          <MicButton state={micState} onPress={onMic} size={112} />
          <span className="font-display text-[20px] font-bold">Tap to talk</span>
          <span className="max-w-[230px] text-center text-[13px] leading-snug text-muted">
            Budget Line greets you, then you name a place and ask. Voice works the same with motion off.
          </span>
        </div>
        <div>
          <span className="font-display text-[15px] font-bold">Why this view</span>
          <p className="mt-1 text-[13px] leading-snug text-muted">
            {reduced
              ? "Your system asks for reduced motion, so the drifting map is replaced by the same places as a list. Everything reachable there is reachable here, and search covers both levels at once."
              : "The same places as the map, as a list. Everything reachable there is reachable here, and search covers both levels at once."}
          </p>
          <Button variant="pill" onClick={onShowMap} className="mt-3 w-full">
            Show the map anyway
          </Button>
        </div>
        <p className="mt-auto border-t border-hairline pt-4 text-[12px] leading-snug text-muted">
          <span className="block font-semibold text-ink">{data.registry.document}</span>
          <span data-num>{data.registry.pages}</span> pages, read line by line.
        </p>
      </aside>
    </div>
  );
}
