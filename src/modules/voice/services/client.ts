/**
 * Browser-side voice client. Wraps @vapi-ai/web so the UI deals in a small
 * set of typed events and one status value.
 *
 * Cards render from `toolResult` events — the structured payload our /api
 * routes returned — never from the transcript. The transcript is captions.
 *
 * How a tool result reaches the browser: Vapi tells the client which tool it
 * is calling and with what arguments (`tool-calls`), but does not reliably
 * deliver the result (`tool-calls-result` never arrived in testing). So the
 * client makes the identical request to our own /api route. The routes are
 * pure functions of the dataset, so the payload is exactly what the assistant
 * received — and the UI still never depends on parsed speech.
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

import { TOOL_ROUTES, type ToolName } from "@/modules/tools";
import type { CallContext, Coverage, ToolResult, VoiceClient, VoiceEvents, VoiceTarget } from "../types";

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

export function createVoiceClient(publicKey: string | undefined, target: VoiceTarget, coverage: Coverage): VoiceClient {
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
      say: async () => emit("status", "unavailable", "Voice is not configured on this deployment."),
    };
  }

  let vapi: Vapi | null = null;
  let inCall = false;

  async function client(): Promise<Vapi> {
    if (vapi) return vapi;
    const { default: VapiCtor } = await import("@vapi-ai/web");
    vapi = new VapiCtor(publicKey!);

    vapi.on("call-start", () => {
      inCall = true;
      emit("status", "listening");
    });
    vapi.on("call-end", () => {
      inCall = false;
      emit("status", "idle");
    });
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
            const name: string = call.function?.name ?? call.name ?? "";
            const args = parseResult(call.function?.arguments ?? call.arguments);
            emit("toolCall", name, args);
            void fetchToolResult(name, args).then((r) => r && emit("toolResult", r));
          }
          break;
        }
      }
    });
    return vapi;
  }

  async function start(ctx: CallContext = {}) {
    emit("status", "connecting");
    const place = ctx.lgaLabel?.replace(/ LGA$/, "");
    const st = ctx.state;
    const overrides = {
      variableValues: {
        lga: ctx.lga ?? "none",
        lgaLabel: place ?? "none",
        stateName: st?.name ?? "any",
        stateScope: st ? `${st.name} State` : `${coverage.stateCount} states: ${coverage.coveredStates}`,
        coveredStates: coverage.coveredStates,
        documentName: st?.document ?? coverage.documentName,
        documentPages: String(st?.pages ?? coverage.documentPages),
        projectCount: (st?.projects ?? coverage.projectCount).toLocaleString("en-NG"),
      },
      firstMessage: place
        ? `This is Budget Line. Ask me what has been budgeted in ${place}.`
        : st
          ? `This is Budget Line. Which local government in ${st.name} State do you want to ask about?`
          : "This is Budget Line. Which state or local government do you want to ask about?",
    };
    try {
      const v = await client();
      if ("assistantId" in target) await v.start(target.assistantId, overrides);
      else await v.start(target.assistant, overrides);
    } catch (e) {
      emit("status", isMicDenied(e) ? "unavailable" : "error", describe(e));
    }
  }

  // Load the SDK and build the client now, so pressing the mic only has to open the call.
  void client();

  return {
    available: true,
    on,
    start,
    stop() {
      vapi?.stop();
    },
    async say(text, ctx) {
      if (!inCall) {
        await start(ctx);
        // Let the greeting finish before the question lands.
        await new Promise<void>((resolve) => {
          const off = on("status", (s) => {
            if (s === "listening") {
              off();
              resolve();
            }
          });
          setTimeout(() => {
            off();
            resolve();
          }, 6000);
        });
      }
      emit("transcript", { role: "user", text, final: true });
      vapi?.send({ type: "add-message", message: { role: "user", content: text }, triggerResponseEnabled: true });
    },
  };
}

async function fetchToolResult(name: string, args: Record<string, unknown>): Promise<ToolResult | null> {
  const route = TOOL_ROUTES[name as ToolName];
  if (!route) return null;
  try {
    const res = await fetch(route, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(args),
    });
    return { name, payload: await res.json() };
  } catch {
    return null;
  }
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
