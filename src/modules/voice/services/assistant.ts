/**
 * Server-side assistant configuration for Vapi. Exposed via "@/modules/voice/server".
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
import { getPlaces, getStates } from "@/modules/budget/server";
import type { Coverage, VoiceConfig } from "../types";

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

/** Every live state's local governments, plus the towns the resolver knows, for the transcriber. */
/**
 * Keyterms for Deepgram. More is worse: with 120 place names the transcriber
 * returned nonsense for a plain sentence, and Vapi fails outright at 180. So
 * the list is the state names plus the local governments of the state the
 * caller is looking at (at most 27), and on the Nigeria view the state names
 * alone. Lists of that size were the ones that heard "Bosso" and "Bida".
 */
function placeNames(stateSlug?: string): string[] {
  const live = getStates().filter((s) => s.status === "live");
  const states = live.map((s) => s.name);
  const focus = live.find((s) => s.slug === stateSlug);
  const lgas = focus ? getPlaces(focus.slug).map((l) => l.lgaLabel.replace(/ LGA$/, "")) : [];
  return [...new Set([...states, "Minna", ...lgas])];
}

function readPrompt(file: string): string {
  return fs.readFileSync(path.join(PROMPTS_DIR, file), "utf8").trim();
}

/** system.md + context.md + language.<code>.md */
export function systemPromptFor(lang: string): string {
  return `${readPrompt("system.md")}\n\n${readPrompt("context.md")}\n\n---\n\n${readPrompt(`language.${lang}.md`)}`;
}

const STATE_PARAM = {
  type: "string",
  description: 'State name, e.g. "Plateau". Omit only if the caller has not said a state; the tools then search every covered state.',
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

export function buildAssistant(lang: string, stateSlug?: string): CreateAssistantDTO {
  const base = publicBaseUrl();
  return {
    name: `Budget Line (${lang})`,
    firstMessage: "This is Budget Line. Which local government do you want to ask about?",
    // Overridden per call with the remembered LGA; see CallContext in the client.
    firstMessageMode: "assistant-speaks-first",
    model: {
      provider: "openai",
      model: "gpt-4.1",
      temperature: 0.2,
      maxTokens: 300,
      messages: [{ role: "system", content: systemPromptFor(lang) }],
      tools: toolsFor(base),
    },
    // Deepgram nova-3 with the place names as keyterms is the only transcriber
    // that heard "Bosso" in a sentence during testing (OpenAI realtime gave
    // "Wushu"; Azure, 11labs and Speechmatics were no better). OpenAI is the
    // fallback. Bare one-word utterances lose their first consonant on every
    // provider, so the UI asks for a full question.
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "en",
      keyterm: placeNames(stateSlug),
      fallbackPlan: {
        transcribers: [{ provider: "openai", model: "gpt-4o-transcribe", language: "en" }],
      },
    },
    // "Paige" was retired by Vapi; Clara is a current warm, professional voice.
    voice: { provider: "vapi", voiceId: "Clara" },
    // The SDK types this as a single value; Vapi accepts an array.
    clientMessages: [
      "transcript",
      "model-output",
      "tool-calls",
      "speech-update",
      "status-update",
    ] as unknown as CreateAssistantDTO["clientMessages"],
    // Give the caller room to finish a sentence before the assistant replies.
    startSpeakingPlan: { waitSeconds: 0.6, smartEndpointingEnabled: "livekit" },
    // Two words before the assistant yields, so a cough or "mm" does not cut it off mid-figure.
    stopSpeakingPlan: { numWords: 2, backoffSeconds: 1 },
    maxDurationSeconds: 600,
  };
}

/** What the prompt says about coverage when no state is chosen — from the registry. */
export function coverage(): Coverage {
  const live = getStates().filter((s) => s.status === "live");
  const names = live.map((s) => s.name);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : (names[0] ?? "");
  return {
    coveredStates: list,
    stateCount: live.length,
    documentName: live.length === 1 ? (live[0].document ?? "") : `approved ${live[0]?.year ?? 2026} budgets of ${live.length} states`,
    documentPages: live.reduce((n, s) => n + (s.pages ?? 0), 0),
    projectCount: live.reduce((n, s) => n + (s.projects ?? 0), 0),
  };
}

/** Everything the voice UI needs for one language, resolved on the server. */
/** The three local governments with the most projects — recognisable names to offer as examples. */
export function examplePlaces(stateSlug?: string): string[] {
  if (!stateSlug) return [];
  return [...getPlaces(stateSlug)]
    .sort((a, b) => b.projects - a.projects)
    .slice(0, 3)
    .map((l) => l.lgaLabel.replace(/ LGA$/, ""));
}

export function voiceConfigFor(lang: string, stateSlug?: string): VoiceConfig {
  const assistantId = assistantIdFor(lang);
  return {
    examples: examplePlaces(stateSlug),
    publicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || undefined,
    target: assistantId ? { assistantId } : { assistant: buildAssistant(lang, stateSlug) },
    coverage: coverage(),
    chatAvailable: Boolean(process.env.VAPI_PRIVATE_KEY),
    publicUrl: publicBaseUrl(),
  };
}
