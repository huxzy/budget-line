"use client";

import { Button, MicButton, MicPill, type MicState } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { StateSummary } from "@/modules/budget";
import { formatCompact } from "@/modules/budget";
import type { Transcript } from "@/modules/voice";
import type { StarterQuestion, Turn } from "../types";
import { Waveform } from "./Waveform";

type Props = {
  state: MicState;
  detail?: string;
  turns: Turn[];
  /** What the caller is saying right now. */
  partial: Transcript | null;
  starters: StarterQuestion[];
  registry: StateSummary;
  lgas: number;
  languageName: string;
  onMic: () => void;
  onEnd: () => void;
  className?: string;
};

const STATUS: Record<MicState, string> = {
  idle: "Tap to talk",
  connecting: "Connecting…",
  listening: "Listening…",
  thinking: "Looking it up…",
  speaking: "Answering…",
  unavailable: "Voice unavailable",
};

/**
 * The clay rail: the call itself. Mic disc with rings, waveform, the caller's
 * words typing in, the turns so far, and the document footer.
 */
export function VoiceRail({ state, detail, turns, partial, starters, registry, lgas, languageName, onMic, onEnd, className }: Props) {
  const inCall = state === "listening" || state === "speaking" || state === "thinking" || state === "connecting";
  const settled = !inCall && turns.length > 0;

  return (
    <aside className={cn("flex flex-col bg-clay px-6 pb-6 pt-7 text-on-clay", className)}>
      {settled ? (
        <MicPill state={state} onPress={onMic} className="hidden w-full justify-center lg:inline-flex">
          Ask again
        </MicPill>
      ) : (
        <div className="hidden flex-col items-center gap-3 lg:flex">
          <MicButton state={state} onPress={onMic} />
          <Waveform active={state === "listening"} />
          <p className="font-display text-[24px] font-bold tracking-[-0.02em]">{STATUS[state]}</p>
          <p className="text-center text-[13px] text-on-clay-muted">
            {state === "unavailable"
              ? (detail ?? "Voice is not configured. Browsing still works.")
              : inCall
                ? `Speaking ${languageName} · pause when you're done`
                : `Speaking ${languageName}`}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.12em] text-on-clay-muted lg:mt-7">
        <span className="h-px flex-1 bg-on-clay/15" />
        {turns.length ? (settled ? "Conversation" : "This call") : "Try one of these"}
        <span className="h-px flex-1 bg-on-clay/15" />
      </div>

      <ol className="mt-4 flex flex-col gap-2.5">
        {turns.map((t, i) => {
          const now = i === turns.length - 1;
          return (
            <li key={t.id} className={cn("rounded-[12px] px-3.5 py-2.5", now ? "bg-card text-ink" : "bg-clay-raised")}>
              <span className={cn("text-[10px] font-bold uppercase tracking-[0.12em]", now ? "text-soft" : "text-on-clay-muted")}>
                Turn {i + 1}
                {now ? " · now" : ""}
              </span>
              <p className={cn("font-display font-bold", now ? "text-[18px]" : "text-[14px]")}>{t.label}</p>
              {t.detail && <p className={cn("text-[12px]", now ? "text-muted" : "text-on-clay-muted")}>{t.detail}</p>}
            </li>
          );
        })}
      </ol>

      {partial?.role === "user" && (
        <div className="mt-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-clay-muted">You · now</span>
          <p className="font-display text-[22px] font-bold leading-tight">
            {partial.text}
            <span className="ml-1 inline-block h-5 w-[3px] animate-caret bg-marigold align-[-3px]" aria-hidden />
          </p>
        </div>
      )}

      {!inCall && starters.length > 0 && (
        <div className="mt-5 flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-clay-muted">
            {settled ? "Things to ask next" : "Things you can ask"}
          </span>
          <ul className="flex flex-col gap-1.5">
            {starters.map((q) => (
              <li key={q.text} className="rounded-[12px] bg-clay-raised px-3.5 py-2.5 text-[14px] font-medium text-on-clay/90">
                &ldquo;{q.text}&rdquo;
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto flex items-end justify-between gap-3 pt-8">
        <div>
          <p data-num className="font-display text-[15px] font-bold">
            {registry.projects?.toLocaleString("en-NG")} projects · {formatCompact(registry.total_2026 ?? 0)}
          </p>
          <p className="text-[12px] text-on-clay-muted">
            {lgas} local governments · {registry.name} State {registry.year}
          </p>
        </div>
        {inCall && (
          <Button variant="pill" onClick={onEnd} className="bg-clay-raised text-on-clay border-0 hover:bg-clay-deep">
            End
          </Button>
        )}
      </div>
    </aside>
  );
}
