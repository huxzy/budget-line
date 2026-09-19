/** Chat module — text conversation with the same assistant. Client-safe. */
export * from "./types";
export { useChat } from "./hooks/useChat";
export type { Chat } from "./hooks/useChat";
export { ChatComposer } from "./components/ChatComposer";
export { ChatBubble } from "./components/ChatBubble";
