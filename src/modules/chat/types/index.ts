import type { ToolResult } from "@/modules/voice";

export type ChatRequest = {
  input: string;
  previousChatId?: string;
  state?: string;
  lga?: string;
};

export type ChatReply = {
  chatId: string;
  reply: string;
  toolResults: ToolResult[];
};

export type ChatMessage = { role: "user" | "assistant"; text: string; pending?: boolean };
