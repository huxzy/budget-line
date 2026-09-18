import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AskScreen } from "@/modules/ask";
import { getLanguages, getLgas, getState, STATE_WIDE } from "@/modules/budget/server";
import { voiceConfigFor } from "@/modules/voice/server";

export const dynamic = "force-dynamic";

/** The area page: listening + answer for one local government. */
export default async function AreaPage({ params }: { params: Promise<{ state: string; lga: string }> }) {
  const { state, lga } = await params;
  const registry = getState(state);
  if (!registry || registry.status !== "live") notFound();
  const lgas = getLgas(state).filter((l) => l.lga !== STATE_WIDE && l.lga !== "OUTSIDE STATE");
  const area = lgas.find((l) => l.lga.toLowerCase() === lga.toLowerCase());
  if (!area) notFound();
  const language = getLanguages().find((l) => l.status === "live")!;
  return (
    <Suspense>
      <AskScreen voice={voiceConfigFor(language.code)} registry={registry} lgas={lgas.length} languageName={language.name} area={{ lga: area.lga, lgaLabel: area.lgaLabel }} />
    </Suspense>
  );
}
