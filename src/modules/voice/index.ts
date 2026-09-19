/** Voice module — client-safe entry. */
export * from "./types";
export { createVoiceClient } from "./services/client";
export { useVoiceSession } from "./hooks/useVoiceSession";
export type { VoiceSession } from "./hooks/useVoiceSession";
export { firstMessageFor, variablesFor } from "./services/variables";
