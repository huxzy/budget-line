import { assistantIdFor, buildAssistant, publicBaseUrl } from "@/lib/assistant";
import { getLanguages } from "@/lib/data";
import VoiceSession from "@/components/VoiceSession";

export const dynamic = "force-dynamic";

export default async function AskPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang: requested } = await searchParams;
  const live = getLanguages().filter((l) => l.status === "live");
  const lang = live.find((l) => l.code === requested)?.code ?? "en";

  const assistantId = assistantIdFor(lang);
  return (
    <VoiceSession
      publicKey={process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || undefined}
      assistantId={assistantId}
      assistant={assistantId ? undefined : buildAssistant(lang)}
      publicUrl={publicBaseUrl()}
    />
  );
}
