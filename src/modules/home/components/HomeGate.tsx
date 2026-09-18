"use client";

import { useSearchParams } from "next/navigation";
import { AskScreen } from "@/modules/ask";
import type { StateSummary } from "@/modules/budget";
import { usePreferences } from "@/modules/prefs";
import type { VoiceConfig } from "@/modules/voice";
import type { FirstRunData } from "../types";
import { FirstRun } from "./FirstRun";

type Props = { data: FirstRunData; voice: VoiceConfig; registry: StateSummary; languageName: string };

/** First run until an area is chosen (or ?change=lga); then the ask screen. */
export function HomeGate({ data, voice, registry, languageName }: Props) {
  const { prefs, ready } = usePreferences();
  const params = useSearchParams();
  if (!ready) return <div className="min-h-dvh bg-surface" aria-busy />;
  if (!prefs.lga || params.get("change") === "lga") return <FirstRun data={data} />;
  return <AskScreen voice={voice} registry={registry} lgas={data.lgas.length} languageName={languageName} />;
}
