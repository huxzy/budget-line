import type { CreateAssistantDTO } from "@vapi-ai/web/dist/api";

export type VoiceStatus =
  | "unavailable" // no key, or the browser refused the microphone
  | "idle"
  | "connecting"
  | "listening"
  | "thinking" // a tool call is in flight
  | "speaking"
  | "error";

export type ToolResult = {
  name: string;
  /** The JSON our route returned, already parsed. */
  payload: Record<string, unknown>;
};

export type Transcript = { role: "user" | "assistant"; text: string; final: boolean };

export type VoiceEvents = {
  status: (status: VoiceStatus, detail?: string) => void;
  transcript: (t: Transcript) => void;
  toolCall: (name: string, args: Record<string, unknown>) => void;
  toolResult: (r: ToolResult) => void;
};

/** A saved Vapi assistant by id, or an inline config built by the server. */
export type VoiceTarget = { assistantId: string } | { assistant: CreateAssistantDTO };

export type VoiceClient = {
  start: () => Promise<void>;
  stop: () => void;
  on: <E extends keyof VoiceEvents>(event: E, fn: VoiceEvents[E]) => () => void;
  available: boolean;
};

/** What a page passes to the voice UI; produced by the server entry. */
export type VoiceConfig = {
  publicKey?: string;
  target: VoiceTarget;
  /** Empty when the app is not reachable by Vapi (tools will fail). */
  publicUrl: string;
};
