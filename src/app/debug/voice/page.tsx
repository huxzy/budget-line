import { VoiceDebug } from "@/modules/debug";
import { voiceConfigFor } from "@/modules/voice/server";

export const dynamic = "force-dynamic";

/** Troubleshooting only: what the mic heard vs what Vapi heard vs what the agent did. */
export default function VoiceDebugPage() {
  return <VoiceDebug config={voiceConfigFor("en")} />;
}
