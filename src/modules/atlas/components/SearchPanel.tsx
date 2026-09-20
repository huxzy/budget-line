"use client";

import Fuse from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { MicGlyph, PlannedTag } from "@/components/ui";
import type { AtlasData, Place } from "../types";
import { PlaceRow } from "./PlaceRow";

type Props = { data: AtlasData; open: boolean; onClose: () => void; inline?: boolean; onMic?: () => void };

/**
 * One field over states and local governments. Live matches carry figures;
 * pending matches carry the PLANNED chip and the reason — a pending match is
 * a real result, never an empty state.
 */
export function SearchPanel({ data, open, onClose, inline = false, onMic }: Props) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const all = useMemo(() => [...data.lgas, ...data.states], [data]);
  const fuse = useMemo(() => new Fuse(all, { keys: ["name"], threshold: 0.3, ignoreLocation: true, minMatchCharLength: 2 }), [all]);
  const results = q.trim() ? fuse.search(q.trim()).map((r) => r.item) : [];
  const niger = data.states.find((s) => s.status === "live");

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open || inline) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, inline, onClose]);

  if (!open) return null;

  const lgas = results.filter((r) => r.kind === "lga");
  const liveStates = results.filter((r) => r.kind === "state" && r.status === "live");
  const pending = results.filter((r) => r.kind === "state" && r.status === "pending");
  const parentOfLga = lgas.length && niger ? niger : null;

  const group = (title: string, items: Place[], render: (p: Place) => React.ReactNode) =>
    items.length ? (
      <section className="flex flex-col gap-2">
        <span className="eyebrow">{title}</span>
        {items.map(render)}
      </section>
    ) : null;

  const body = (
    <div className="flex h-full flex-col">
      <label className="flex items-center gap-3 border-b border-hairline px-5 py-4">
        <span className="h-3.5 w-3.5 rounded-full border-2 border-hairline-strong" aria-hidden />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search states and local governments"
          className="min-w-0 flex-1 bg-transparent font-display text-[22px] font-bold outline-none placeholder:font-sans placeholder:text-[16px] placeholder:font-medium placeholder:text-soft"
          aria-label="Search states and local governments"
        />
        {q.trim() ? (
          <span className="text-[13px] font-semibold text-muted">
            <span data-num>{results.length}</span> match{results.length === 1 ? "" : "es"}
          </span>
        ) : null}
        {!inline && (
          <button type="button" onClick={onClose} className="text-[14px] font-semibold text-ink">
            Cancel
          </button>
        )}
      </label>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        {group("Local government", lgas, (p) => (
          <PlaceRow key={p.key} place={p} detail={`${p.stateName} State${p.figures ? ` · ${p.figures.projects} projects` : ""}`} highlight />
        ))}
        {(liveStates.length > 0 || parentOfLga) &&
          group("State", liveStates.length ? liveStates : [parentOfLga!], (p) => (
            <PlaceRow
              key={p.key}
              place={p}
              detail={`${parentOfLga && lgas[0] ? `Contains ${lgas[0].name} · ` : "Available now · "}${data.lgas.length} local governments`}
            />
          ))}
        {pending.length > 0 && (
          <section className="flex flex-col gap-2">
            <span className="eyebrow">No budget yet</span>
            {pending.map((p) => (
              <div key={p.key} className="rounded-[16px] bg-card/70 p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-display text-[19px] font-bold text-muted">{p.name} State</span>
                  <PlannedTag />
                </div>
                <p className="mt-1 text-[14px] leading-snug text-muted">Budget not available yet. {p.name}&apos;s approved budget hasn&apos;t been processed.</p>
              </div>
            ))}
            {niger && !liveStates.length && !parentOfLga && (
              <>
                <span className="eyebrow mt-2">You can look at</span>
                <PlaceRow place={niger} detail={`Available now · ${data.lgas.length} local governments`} highlight />
              </>
            )}
          </section>
        )}
        {q.trim() && results.length === 0 && (
          <p className="text-[15px] text-muted">
            No state or local government by that name. Budget Line covers Nigeria&apos;s 37 states and, so far, the 25 local governments
            of {niger?.name} State.
          </p>
        )}
        {!q.trim() && <p className="text-[14px] text-muted">Type a state or a local government. Pending places still appear, so a search never looks broken.</p>}
      </div>

      {onMic && (
        <div className="flex items-center gap-3 border-t border-hairline px-5 py-4">
          <button type="button" onClick={onMic} className="flex h-11 w-11 items-center justify-center rounded-full bg-marigold text-clay" aria-label="Say a place instead">
            <MicGlyph size={20} />
          </button>
          <span className="text-[14px] text-muted">Or say it instead — the mic stays live while the search panel is open.</span>
        </div>
      )}
    </div>
  );

  if (inline) return <div className="rounded-[20px] bg-surface shadow-card">{body}</div>;
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-clay/55 p-0 sm:p-8" role="dialog" aria-modal="true" aria-label="Search">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close search" />
      <div className="relative h-full w-full max-w-[640px] overflow-hidden bg-surface sm:h-auto sm:max-h-[80vh] sm:rounded-[24px]">{body}</div>
    </div>
  );
}
