/**
 * Browser-side voice client. Wraps @vapi-ai/web so the UI deals in a small
 * set of typed events and one status value.
 *
 * Cards render from `toolResult` events — the structured payload our /api
 * routes returned — never from the transcript. The transcript is captions.
 *
 * Assistant captions come from `model-output` (the model's actual text), not
 * from Vapi's assistant transcript, which is speech-to-text of the TTS audio
 * and mangles names and numbers ("Maitumbi" → "my Tumby").
 *
 * With no public key the client reports "unavailable" and does nothing else,
 * so the app still renders and browses without Vapi.
 */
"use client";

import type Vapi from "@vapi-ai/web";
import type { CreateAssistantDTO } from "@vapi-ai/web/dist/api";

export type VoiceStatus =
  | "unavailable" // no key, or the browser refused the microphone
  | "idle"
  | "connecting"
  | "listening"
  | "thinking" // a tool call is in flight
  | "speaking"
  | "error";

export type ToolName = "projects_by_lga" | "lga_summary" | "project_detail" | "state_coverage";

export type ToolResult = {
  name: ToolName | string;
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

export type VoiceTarget = { assistantId: string } | { assistant: CreateAssistantDTO };

export type VoiceClient = {
  start: () => Promise<void>;
  stop: () => void;
  on: <E extends keyof VoiceEvents>(event: E, fn: VoiceEvents[E]) => () => void;
  available: boolean;
};

function parseResult(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return { raw };
    }
  }
  return (raw as Record<string, unknown>) ?? {};
}

export function createVoiceClient(publicKey: string | undefined, target: VoiceTarget): VoiceClient {
  const listeners: { [E in keyof VoiceEvents]: Set<VoiceEvents[E]> } = {
    status: new Set(),
    transcript: new Set(),
    toolCall: new Set(),
    toolResult: new Set(),
  };
  const emit = <E extends keyof VoiceEvents>(event: E, ...args: Parameters<VoiceEvents[E]>) => {
    for (const fn of listeners[event]) (fn as (...a: Parameters<VoiceEvents[E]>) => void)(...args);
  };
  const on: VoiceClient["on"] = (event, fn) => {
    listeners[event].add(fn);
    return () => listeners[event].delete(fn);
  };

  if (!publicKey) {
    return {
      available: false,
      on,
      start: async () => emit("status", "unavailable", "Voice is not configured on this deployment."),
      stop: () => {},
    };
  }

  let vapi: Vapi | null = null;

  async function client(): Promise<Vapi> {
    if (vapi) return vapi;
    const { default: VapiCtor } = await import("@vapi-ai/web");
    vapi = new VapiCtor(publicKey!);

    vapi.on("call-start", () => emit("status", "listening"));
    vapi.on("call-end", () => emit("status", "idle"));
    vapi.on("speech-start", () => emit("status", "speaking"));
    vapi.on("speech-end", () => emit("status", "listening"));
    vapi.on("error", (e) => emit("status", "error", describe(e)));

    let assistantLine = "";
    vapi.on("message", (m) => {
      if (process.env.NODE_ENV !== "production" && m?.type !== "speech-update") console.debug("[vapi]", m?.type, m);
      switch (m?.type) {
        case "transcript":
          if (m.role === "user") {
            emit("transcript", { role: "user", text: m.transcript, final: m.transcriptType === "final" });
          }
          break;
        case "model-output": {
          const chunk = typeof m.output === "string" ? m.output : "";
          if (!chunk) break;
          assistantLine += chunk;
          emit("transcript", { role: "assistant", text: assistantLine, final: false });
          break;
        }
        case "speech-update":
          if (m.role === "assistant" && m.status === "stopped" && assistantLine.trim()) {
            emit("transcript", { role: "assistant", text: assistantLine.trim(), final: true });
            assistantLine = "";
          }
          break;
        case "tool-calls": {
          emit("status", "thinking");
          for (const call of m.toolCallList ?? []) {
            emit("toolCall", call.function?.name ?? "", parseResult(call.function?.arguments));
          }
          break;
        }
        case "tool-calls-result": {
          const r = m.toolCallResult ?? {};
          emit("toolResult", { name: r.name ?? r.toolName ?? "", payload: parseResult(r.result) });
          break;
        }
      }
    });
    return vapi;
  }

  return {
    available: true,
    on,
    async start() {
      emit("status", "connecting");
      try {
        const v = await client();
        if ("assistantId" in target) await v.start(target.assistantId);
        else await v.start(target.assistant);
      } catch (e) {
        emit("status", isMicDenied(e) ? "unavailable" : "error", describe(e));
      }
    },
    stop() {
      vapi?.stop();
    },
  };
}

function isMicDenied(e: unknown): boolean {
  const name = (e as { name?: string })?.name ?? "";
  return name === "NotAllowedError" || name === "PermissionDeniedError";
}

function describe(e: unknown): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  const o = e as { message?: string; error?: { message?: string }; errorMsg?: string };
  return o.error?.message ?? o.message ?? o.errorMsg ?? JSON.stringify(e).slice(0, 200);
}
