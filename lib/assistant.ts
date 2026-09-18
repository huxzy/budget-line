/**
 * Server-side assistant configuration for Vapi. Never import from client code.
 *
 * The assistant is defined here, in the repo, and passed to the web SDK as a
 * transient config at call start — so the prompt is version-controlled and
 * there is no dashboard state to drift. If NEXT_PUBLIC_VAPI_ASSISTANT_<LANG>
 * is set, that saved assistant is used instead (see `assistantIdFor`).
 *
 * Tools are server-URL tools: Vapi's servers POST to our /api routes, which
 * are the only source of any figure the assistant can say. The web SDK cannot
 * answer tool calls from the browser, so the app must be reachable at a public
 * URL (NEXT_PUBLIC_APP_URL) for voice to work.
 */
import fs from "node:fs";
import path from "node:path";
import type { CreateAssistantDTO, CreateFunctionToolDTO, JsonSchema } from "@vapi-ai/web/dist/api";
import { getLgas, STATE_WIDE } from "./data";

const PROMPTS_DIR = path.join(process.cwd(), "prompts");

/** Saved-assistant ids, keyed by language code. Only "en" is populated today. */
const ASSISTANT_IDS: Record<string, string | undefined> = {
  en: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_EN || undefined,
  ha: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_HA || undefined,
};

export function assistantIdFor(lang: string): string | undefined {
  return ASSISTANT_IDS[lang];
}

/** Public base URL Vapi can reach. Empty string when the app is not public. */
export function publicBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "";
}

/** LGA names plus the towns the resolver knows, title-cased for the transcriber. */
function placeNames(): string[] {
  const lgas = getLgas("niger")
    .map((l) => l.lga)
    .filter((l) => l !== STATE_WIDE && l !== "OUTSIDE STATE")
    .map((l) => l.charAt(0) + l.slice(1).toLowerCase());
  return [...lgas, "Minna", "Niger State"];
}

function readPrompt(file: string): string {
  return fs.readFileSync(path.join(PROMPTS_DIR, file), "utf8").trim();
}

/** system.md + language.<code>.md */
export function systemPromptFor(lang: string): string {
  return `${readPrompt("system.md")}\n\n---\n\n${readPrompt(`language.${lang}.md`)}`;
}

const STATE_PARAM = {
  type: "string",
  description: 'State name, e.g. "Niger". Omit for Niger.',
} as const;

function tool(
  name: string,
  description: string,
  properties: Record<string, JsonSchema>,
  required: string[],
  route: string,
  base: string,
): CreateFunctionToolDTO {
  return {
    type: "function",
    async: false,
    function: { name, description, parameters: { type: "object", properties, required } },
    server: { url: `${base}/api/${route}`, timeoutSeconds: 20 },
    messages: [
      // One fixed phrase instead of Vapi's rotating "just a sec" fillers.
      { type: "request-start", content: "Let me check.", blocking: false },
      { type: "request-failed", content: "I could not reach the budget records just now. Please ask again." },
    ],
  };
}

export function toolsFor(base: string): CreateFunctionToolDTO[] {
  return [
    tool(
      "projects_by_lga",
      "Capital projects in one local government area, largest 2026 allocation first. Use for most questions.",
      {
        lga: { type: "string", description: 'Local government name as the caller said it, e.g. "Bida".' },
        state: STATE_PARAM,
        sector: {
          type: "string",
          description: "Optional. One of: health, roads and works, education, water, agriculture, other. Plain words like hospital, school, borehole, farm also work.",
        },
        unspent_only: { type: "boolean", description: "Optional. Only projects approved for 2025 with nothing recorded as spent by September." },
        limit: { type: "integer", description: "Optional. Default 5." },
      },
      ["lga"],
      "projects",
      base,
    ),
    tool(
      "lga_summary",
      "Totals for one local government area, broken down by sector. Use for 'how much in total' questions.",
      { lga: { type: "string", description: "Local government name." }, state: STATE_PARAM },
      ["lga"],
      "summary",
      base,
    ),
    tool(
      "project_detail",
      "One project by id. Only use an id that came back from an earlier tool result.",
      { id: { type: "string", description: 'Project id, e.g. "niger-2026-p0045".' }, state: STATE_PARAM },
      ["id"],
      "project",
      base,
    ),
    tool(
      "state_coverage",
      "Which states are available. Use when asked about a state, or what is covered.",
      { state: { type: "string", description: "Optional state name to check." } },
      [],
      "coverage",
      base,
    ),
  ];
}

export function buildAssistant(lang: string): CreateAssistantDTO {
  const base = publicBaseUrl();
  return {
    name: `Budget Line (${lang})`,
    firstMessage: "This is Budget Line. Which local government do you want to ask about?",
    firstMessageMode: "assistant-speaks-first",
    model: {
      provider: "openai",
      model: "gpt-4.1",
      temperature: 0.2,
      maxTokens: 300,
      messages: [{ role: "system", content: systemPromptFor(lang) }],
      tools: toolsFor(base),
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "en",
      // Bias recognition toward the place names people will actually say;
      // without this "Bida" comes back as "Beta".
      keyterm: placeNames(),
      // A provider blip must not kill the demo.
      fallbackPlan: { transcribers: [{ provider: "openai", model: "gpt-4o-transcribe", language: "en" }] },
    },
    voice: { provider: "vapi", voiceId: "Paige" },
    // The SDK types this as a single value; Vapi accepts an array. The default
    // set omits tool-calls-result, which the UI needs to render cards.
    clientMessages: [
      "transcript",
      "model-output",
      "tool-calls",
      "tool-calls-result",
      "speech-update",
      "status-update",
    ] as unknown as CreateAssistantDTO["clientMessages"],
    // Give the caller room to finish a sentence before the assistant replies.
    startSpeakingPlan: { waitSeconds: 0.8, smartEndpointingEnabled: "livekit" },
    maxDurationSeconds: 600,
  };
}
