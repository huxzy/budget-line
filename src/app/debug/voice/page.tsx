import { notFound } from "next/navigation";
import { getPlaces, getStates } from "@/modules/budget/server";
import { VoiceDebug } from "@/modules/debug";
import { debugEnabled } from "@/modules/debug/server";
import { voiceConfigFor } from "@/modules/voice/server";

export const dynamic = "force-dynamic";

/** Troubleshooting only: what the mic heard vs what Vapi heard vs what the agent did. */
export default function VoiceDebugPage() {
  if (!debugEnabled()) notFound();
  const live = getStates().filter((s) => s.status === "live");
  const places = [...live.map((s) => s.name), "Minna", ...live.flatMap((s) => getPlaces(s.slug).map((l) => l.lgaLabel.replace(/ LGA$/, "")))];
  return <VoiceDebug config={voiceConfigFor("en", "niger")} places={places} />;
}
