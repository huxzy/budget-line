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
  /** Every message from Vapi, unprocessed — for the troubleshooting page. */
  raw: (message: Record<string, unknown>) => void;
};

/** A saved Vapi assistant by id, or an inline config built by the server. */
export type VoiceTarget = { assistantId: string } | { assistant: CreateAssistantDTO };

/** What the client already knows when the call starts. */
export type CallContext = {
  lga?: string | null;
  lgaLabel?: string | null;
  /** The state the caller is looking at; absent on the Nigeria view. */
  state?: { slug: string; name: string; document: string; pages?: number; projects?: number } | null;
  /** Troubleshooting only: replace the assistant's transcriber for this call. */
  transcriber?: Record<string, unknown>;
};

/** What the prompt's variables are filled from when no state is chosen. */
export type Coverage = {
  /** "Niger, Plateau and Ebonyi" */
  coveredStates: string;
  documentName: string;
  documentPages: number;
  projectCount: number;
  stateCount: number;
};

export type VoiceClient = {
  start: (ctx?: CallContext) => Promise<void>;
  stop: () => void;
  /** Send a typed or chosen question into the call as if spoken. Starts a call if needed. */
  say: (text: string, ctx?: CallContext) => Promise<void>;
  on: <E extends keyof VoiceEvents>(event: E, fn: VoiceEvents[E]) => () => void;
  available: boolean;
};

/** What a page passes to the voice UI; produced by the server entry. */
export type VoiceConfig = {
  publicKey?: string;
  target: VoiceTarget;
  coverage: Coverage;
  /** Text chat needs the private key on the server. */
  chatAvailable: boolean;
  /** Empty when the app is not reachable by Vapi (tools will fail). */
  publicUrl: string;
};
