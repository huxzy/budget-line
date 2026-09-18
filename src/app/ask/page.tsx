import { getLanguages } from "@/modules/budget/server";
import { VoiceHarness } from "@/modules/voice";
import { voiceConfigFor } from "@/modules/voice/server";

export const dynamic = "force-dynamic";

export default async function AskPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang: requested } = await searchParams;
  const live = getLanguages().filter((l) => l.status === "live");
  const lang = live.find((l) => l.code === requested)?.code ?? "en";
  return <VoiceHarness config={voiceConfigFor(lang)} />;
}
