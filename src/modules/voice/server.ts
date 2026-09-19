/** Voice module — server entry. Builds the assistant config from prompts/. */
export * from "./index";
export { assistantIdFor, buildAssistant, coverage, publicBaseUrl, systemPromptFor, toolsFor, voiceConfigFor } from "./services/assistant";
export { variablesFor } from "./services/variables";
