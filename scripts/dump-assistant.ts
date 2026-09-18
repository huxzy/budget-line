/**
 * Print the assistant config exactly as it is sent to Vapi, for review.
 *   npx tsx scripts/dump-assistant.ts [lang] [--prompt]
 */
import { buildAssistant, systemPromptFor } from "../lib/assistant";

const lang = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "en";
if (process.argv.includes("--prompt")) {
  console.log(systemPromptFor(lang));
} else {
  const a = buildAssistant(lang);
  const m = a.model as { messages: { content: string }[]; tools: { function: { name: string }; server: { url: string } }[] };
  console.log(
    JSON.stringify(
      {
        ...a,
        model: {
          ...m,
          messages: `[system prompt, ${m.messages[0].content.length} chars — pass --prompt to print]`,
          tools: m.tools.map((t) => `${t.function.name} → ${t.server.url}`),
        },
      },
      null,
      2,
    ),
  );
}
