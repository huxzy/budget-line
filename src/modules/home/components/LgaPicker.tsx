"use client";

import Fuse from "fuse.js";
import { useMemo, useState } from "react";
import { PlannedTag } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatCompact, type StateSummary } from "@/modules/budget";
import type { LgaOption } from "../types";

type Props = {
  lgas: LgaOption[];
  states: StateSummary[];
  value: LgaOption | null;
  onChange: (lga: LgaOption) => void;
};

/** Step 1: type a place. Live LGAs match first; other states show as planned. */
export function LgaPicker({ lgas, states, value, onChange }: Props) {
  const [q, setQ] = useState("");
  const fuse = useMemo(() => new Fuse(lgas, { keys: ["lga", "lgaLabel"], threshold: 0.4, ignoreLocation: true }), [lgas]);
  const stateFuse = useMemo(
    () => new Fuse(states.filter((s) => s.status !== "live"), { keys: ["name"], threshold: 0.35, ignoreLocation: true }),
    [states],
  );
  const matches = q.trim() ? fuse.search(q.trim()).map((r) => r.item) : lgas;
  const pendingStates = q.trim() ? stateFuse.search(q.trim()).map((r) => r.item).slice(0, 2) : [];

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-3 rounded-[16px] bg-card px-4 py-3.5 shadow-card focus-within:outline focus-within:outline-2 focus-within:outline-marigold">
        <span className="h-3.5 w-3.5 rounded-full border-2 border-hairline-strong" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type your local government, e.g. Bida"
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-[17px] font-medium outline-none placeholder:text-soft"
          aria-label="Your local government"
        />
        <span className="text-[13px] font-semibold text-muted">
          {q.trim() ? `${matches.length} of ${lgas.length}` : `${lgas.length} local governments`}
        </span>
      </label>

      <div className="grid max-h-[calc(100dvh-300px)] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {matches.map((l) => {
          const selected = value?.lga === l.lga;
          return (
            <button
              key={l.lga}
              type="button"
              onClick={() => onChange(l)}
              className={cn(
                "flex items-center justify-between rounded-[16px] bg-card px-5 py-4 text-left shadow-card transition-colors",
                selected ? "outline outline-2 -outline-offset-2 outline-marigold" : "hover:bg-hairline",
              )}
              aria-pressed={selected}
            >
              <span>
                <span className="block font-display text-[19px] font-bold">{l.lgaLabel.replace(/ LGA$/, "")}</span>
                <span className="text-[13px] text-muted">
                  <span data-num>{l.projects}</span> projects · {formatCompact(l.total)}
                </span>
              </span>
              <span
                className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[11px]", selected ? "bg-clay text-on-clay" : "border border-hairline-strong")}
                aria-hidden
              >
                {selected ? "✓" : ""}
              </span>
            </button>
          );
        })}
        {pendingStates.map((s) => (
          <div key={s.slug} className="flex items-center justify-between rounded-[16px] bg-card/60 px-5 py-4 text-muted">
            <span>
              <span className="block font-display text-[19px] font-bold">{s.name} State</span>
              <span className="text-[13px]">Not covered yet</span>
            </span>
            <PlannedTag />
          </div>
        ))}
        {matches.length === 0 && pendingStates.length === 0 && (
          <div className="rounded-[16px] bg-card px-5 py-4 text-muted sm:col-span-2">
            <span className="block font-display text-[19px] font-bold">No match</span>
            <span className="text-[13px]">
              <span data-num>{lgas.length}</span> local governments in Niger State searched
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
