"use client";

import { useCallback, useRef, useState } from "react";
import type { ToolResult } from "@/modules/voice";
import type { ChatMessage, ChatReply } from "../types";

export type Chat = {
  messages: ChatMessage[];
  /** Tool results from every turn so far, in order. */
  results: ToolResult[];
  pending: boolean;
  error: string | null;
  send: (text: string) => Promise<ChatReply | null>;
};

/** A text conversation with the same assistant the call uses; one Vapi chat, continued turn by turn. */
export function useChat(ctx: { state?: string; lga?: string | null }): Chat {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [results, setResults] = useState<ToolResult[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatId = useRef<string | undefined>(undefined);

  const send = useCallback(
    async (text: string) => {
      const input = text.trim();
      if (!input || pending) return null;
      setError(null);
      setPending(true);
      setMessages((m) => [...m, { role: "user", text: input }, { role: "assistant", text: "", pending: true }]);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ input, previousChatId: chatId.current, state: ctx.state, lga: ctx.lga ?? undefined }),
        });
        const data = (await res.json()) as ChatReply & { error?: string };
        if (!res.ok || data.error) throw new Error(data.error ?? "Chat failed");
        chatId.current = data.chatId;
        setMessages((m) => [...m.slice(0, -1), { role: "assistant", text: data.reply, results: data.toolResults }]);
        setResults((r) => [...r, ...data.toolResults]);
        return data;
      } catch (e) {
        setMessages((m) => m.slice(0, -1));
        setError(e instanceof Error ? e.message : "Chat failed");
        return null;
      } finally {
        setPending(false);
      }
    },
    [ctx.state, ctx.lga, pending],
  );

  return { messages, results, pending, error, send };
}
