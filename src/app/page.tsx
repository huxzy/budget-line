import { Suspense } from "react";
import { HomeGate } from "@/modules/home";
import { loadFirstRun } from "@/modules/home/server";
import { voiceConfigFor } from "@/modules/voice/server";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const data = loadFirstRun("niger");
  const language = data.languages.find((l) => l.status === "live") ?? data.languages[0];
  return (
    <Suspense>
      <HomeGate data={data} voice={voiceConfigFor(language.code)} registry={data.registry} languageName={language.name} />
    </Suspense>
  );
}
