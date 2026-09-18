import { AtlasEntry } from "@/modules/atlas";
import { loadAtlas } from "@/modules/atlas/server";
import { voiceConfigFor } from "@/modules/voice/server";

export const dynamic = "force-dynamic";

/** Always land on the Nigeria view. A saved area is offered as "continue", never skipped to. */
export default function HomePage() {
  return <AtlasEntry data={loadAtlas()} voice={voiceConfigFor("en")} level="nigeria" />;
}
