import { AskScreen } from "@/modules/ask";
import { getLanguages, getLgas, getState, STATE_WIDE } from "@/modules/budget/server";
import { voiceConfigFor } from "@/modules/voice/server";

export const dynamic = "force-dynamic";

export default async function AskPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang: requested } = await searchParams;
  const languages = getLanguages();
  const language = languages.find((l) => l.code === requested && l.status === "live") ?? languages[0];
  const registry = getState("niger")!;
  const lgas = getLgas("niger").filter((l) => l.lga !== STATE_WIDE && l.lga !== "OUTSIDE STATE").length;
  return <AskScreen voice={voiceConfigFor(language.code)} registry={registry} lgas={lgas} languageName={language.name} />;
}
