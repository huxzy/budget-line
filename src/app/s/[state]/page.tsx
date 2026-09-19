import { notFound } from "next/navigation";
import { AtlasEntry } from "@/modules/atlas";
import { loadAtlas } from "@/modules/atlas/server";
import { getState } from "@/modules/budget/server";
import { voiceConfigFor } from "@/modules/voice/server";

export const dynamic = "force-dynamic";

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  if (!getState(state) || state === "federal") notFound();
  return <AtlasEntry data={loadAtlas(state)} voice={voiceConfigFor("en", state)} level="state" stateSlug={state} />;
}
