"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/shell";
import type { StateSummary } from "@/modules/budget";
import { usePreferences } from "@/modules/prefs";
import { useVoiceSession, type Transcript, type VoiceConfig } from "@/modules/voice";
import { useLgaSummary } from "../hooks/useLgaSummary";
import { startersFor } from "../services/starters";
import { toTurn } from "../services/turns";
import type { Turn } from "../types";
import { AnswerPane } from "./AnswerPane";
import { MobileTalkBar } from "./MobileTalkBar";
import { VoiceRail } from "./VoiceRail";

type Props = {
  voice: VoiceConfig;
  registry: StateSummary;
  lgas: number;
  languageName: string;
  /** The area this page is for. Remembered as the saved area on arrival. */
  area: { lga: string; lgaLabel: string };
};

/** Listening + answer: the rail is the call, the cream side is what it found. */
export function AskScreen({ voice, registry, lgas, languageName, area }: Props) {
  const { prefs, ready, update } = usePreferences();
  useEffect(() => {
    if (ready && (prefs.lga !== area.lga || prefs.state !== registry.slug)) update({ lga: area.lga, lgaLabel: area.lgaLabel, state: registry.slug });
  }, [ready, prefs.lga, prefs.state, area.lga, area.lgaLabel, registry.slug, update]);
  const session = useVoiceSession(voice, {
    lga: area.lga,
    lgaLabel: area.lgaLabel,
    state: { slug: registry.slug, name: registry.name, document: registry.document ?? "", pages: registry.pages, projects: registry.projects },
  });
  const summary = useLgaSummary(area.lga);
  const place = area.lgaLabel.replace(/ LGA$/, "");
  // A question handed over from another screen ("Ask about this") leads the suggestions.
  const handed = useSearchParams().get("ask");
  const starters = useMemo(() => (handed ? [{ text: handed }, ...startersFor(place)] : startersFor(place)), [handed, place]);

  const turns: Turn[] = useMemo(() => session.results.map((r, i) => toTurn(r, i)), [session.results]);
  const turn = turns.length ? turns[turns.length - 1] : null;

  // Headline: the assistant's latest line — live while speaking, then the last final one.
  const lastAssistant = useRef<Transcript | null>(null);
  const [headline, setHeadline] = useState<Transcript | null>(null);
  useEffect(() => {
    const live = session.partial?.role === "assistant" ? session.partial : null;
    const final = [...session.lines].reverse().find((l) => l.role === "assistant") ?? null;
    if (final) lastAssistant.current = final;
    setHeadline(live ?? lastAssistant.current);
  }, [session.partial, session.lines]);

  const micState = session.status === "error" ? "idle" : session.status;

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <AppHeader />
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)]">
        <VoiceRail
          state={micState}
          detail={session.detail}
          turns={turns}
          partial={session.partial}
          starters={starters}
          registry={registry}
          lgas={lgas}
          languageName={languageName}
          onMic={() => (session.inCall ? session.stop() : session.start())}
          onEnd={session.stop}
          className="order-2 pb-28 lg:order-1 lg:pb-6"
        />
        <main className="order-1 min-w-0 px-5 py-6 sm:px-8 lg:order-2 lg:px-10 lg:py-8">
          {session.status === "error" && session.detail && (
            <p className="mb-4 rounded-[12px] bg-inset px-4 py-3 text-[14px] text-label">Voice error: {session.detail}</p>
          )}
          <AnswerPane
            turn={turn}
            headline={headline}
            speaking={session.status === "speaking"}
            summary={summary}
            registry={registry}
            placeholder={
              <div className="max-w-[640px]">
                <span className="eyebrow">Ask out loud</span>
                <h1 className="mt-1.5 font-display text-[30px] font-bold leading-[1.15] tracking-[-0.025em] sm:text-[36px]">
                  {place ? `What has been budgeted in ${place}?` : "What has government budgeted where you live?"}
                </h1>
                <p className="mt-3 text-[16px] leading-relaxed text-muted">
                  Press the microphone and ask in your own words. Every figure comes back with the page of the approved budget it was
                  read from.
                </p>
              </div>
            }
          />
        </main>
      </div>
      <MobileTalkBar state={micState} onMic={() => (session.inCall ? session.stop() : session.start())} onEnd={session.stop} languageName={languageName} />
    </div>
  );
}
