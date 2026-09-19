/**
 * Text chat through Vapi's Chat API: the same assistant, prompt and tools as
 * the voice call, minus the audio. Tool calls still go to our /api routes,
 * and the reply carries their results, so cards render from tool results
 * exactly as they do on a call. Server only: needs VAPI_PRIVATE_KEY.
 */
import { getPlaces, getState } from "@/modules/budget/server";
import type { CallContext, ToolResult } from "@/modules/voice";
import { buildAssistant, coverage, variablesFor } from "@/modules/voice/server";
import type { ChatReply, ChatRequest } from "../types";

const VAPI = "https://api.vapi.ai/chat";

type VapiOutput = {
  role: "assistant" | "tool" | "user";
  content?: string;
  tool_call_id?: string;
  tool_calls?: { id: string; function?: { name?: string; arguments?: string } }[];
};

function contextFor(req: ChatRequest): CallContext {
  const st = req.state ? getState(req.state) : null;
  if (!st || st.status !== "live") return {};
  const area = req.lga ? getPlaces(st.slug).find((l) => l.lga === req.lga) : null;
  return {
    state: { slug: st.slug, name: st.name, document: st.document ?? "", pages: st.pages, projects: st.projects },
    lga: area?.lga ?? null,
    lgaLabel: area?.lgaLabel ?? null,
  };
}

export function chatAvailable(): boolean {
  return Boolean(process.env.VAPI_PRIVATE_KEY);
}

export async function sendChat(req: ChatRequest, lang = "en"): Promise<ChatReply> {
  const key = process.env.VAPI_PRIVATE_KEY;
  if (!key) throw new Error("Chat is not configured on this deployment.");

  // The call-only parts of the config are not accepted by the Chat API.
  const { transcriber, voice, startSpeakingPlan, stopSpeakingPlan, clientMessages, maxDurationSeconds, firstMessage, firstMessageMode, ...assistant } =
    buildAssistant(lang) as Record<string, unknown>;
  void transcriber; void voice; void startSpeakingPlan; void stopSpeakingPlan; void clientMessages; void maxDurationSeconds; void firstMessage; void firstMessageMode;

  const body: Record<string, unknown> = {
    assistant,
    assistantOverrides: { variableValues: variablesFor(contextFor(req), coverage(), "chat") },
    input: req.input,
  };
  if (req.previousChatId) body.previousChatId = req.previousChatId;

  const res = await fetch(VAPI, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Vapi chat failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { id: string; output?: VapiOutput[] };

  const names = new Map<string, string>();
  const toolResults: ToolResult[] = [];
  const replies: string[] = [];
  for (const o of data.output ?? []) {
    if (o.role === "assistant" && o.tool_calls) for (const c of o.tool_calls) names.set(c.id, c.function?.name ?? "");
    else if (o.role === "tool" && o.content) {
      try {
        toolResults.push({ name: names.get(o.tool_call_id ?? "") ?? "", payload: JSON.parse(o.content) });
      } catch {
        /* not JSON: nothing to render */
      }
    } else if (o.role === "assistant" && o.content) replies.push(o.content);
  }
  // The last assistant line is the answer; earlier ones are tool fillers ("Let me check.").
  return { chatId: data.id, reply: replies[replies.length - 1] ?? "", toolResults };
}
