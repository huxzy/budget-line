"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Project } from "@/modules/budget";
import { ResultCard } from "@/modules/results";
import type { Chat } from "../hooks/useChat";
import type { ChatMessage } from "../types";
import { ChatComposer } from "./ChatComposer";

type Props = {
  chat: Chat;
  disabled?: boolean;
  /** Where the launcher sits; "raised" clears the mobile talk bar. */
  offset?: "normal" | "raised";
  title?: string;
  hint?: string;
  /** What the welcome should say the reader is looking at, e.g. "Bida in Niger State". */
  place?: string;
  /** How many states are covered, for the welcome. */
  states?: number;
};

function citedProjects(m: ChatMessage): Project[] {
  const out: Project[] = [];
  for (const r of m.results ?? []) {
    const p = r.payload as { found?: boolean; projects?: Project[] };
    if (p.found && Array.isArray(p.projects)) out.push(...p.projects.slice(0, 3));
  }
  return out;
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.4 3.3A1 1 0 0 1 4 18.5v-13Z" fill="currentColor" />
    </svg>
  );
}

/**
 * The chat bubble: a launcher in the corner and a panel with the
 * conversation. Typed questions go to the same assistant as the call, and
 * each reply shows the cards it cited.
 */
export function ChatBubble({ chat, disabled = false, offset = "normal", title = "Ask by text", hint = "Same answers as the call, with the page for every figure.", place, states }: Props) {
  const [open, setOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [open, chat.messages]);

  const bottom = offset === "raised" ? "bottom-[calc(9.5rem+env(safe-area-inset-bottom))] lg:bottom-6" : "bottom-6";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close chat" : "Ask Budget Line by text"}
        className={cn(
          "fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-marigold text-clay shadow-hero transition-transform hover:scale-105 active:scale-95",
          bottom,
        )}
      >
        {open ? (
          <span className="font-display text-[22px] font-bold" aria-hidden>
            ×
          </span>
        ) : (
          <ChatIcon />
        )}
        {!open && chat.pending && <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-breathe rounded-full bg-clay ring-2 ring-marigold" aria-hidden />}
      </button>

      {open && (
        <section
          role="dialog"
          aria-label={title}
          className={cn(
            "fixed inset-x-3 z-40 flex flex-col overflow-hidden rounded-[22px] bg-surface shadow-hero motion-safe:animate-rise sm:inset-x-auto sm:right-5 sm:w-[400px]",
            offset === "raised" ? "bottom-[calc(13.5rem+env(safe-area-inset-bottom))] lg:bottom-24" : "bottom-24",
          )}
          style={{ maxHeight: "min(72dvh, 640px)" }}
        >
          <header className="bg-clay px-5 py-3.5 text-on-clay">
            <p className="font-display text-[17px] font-bold">{title}</p>
            <p className="text-[12px] text-on-clay-muted">{hint}</p>
          </header>

          <div className="flex min-h-[160px] flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            {chat.messages.length === 0 && (
              <div className="mr-6 flex flex-col gap-2 rounded-[14px] rounded-tl-[4px] bg-card px-3.5 py-3 text-[14px] leading-snug text-ink shadow-card">
                <p className="font-display text-[15px] font-bold">Welcome to Budget Line.</p>
                <p className="text-muted">
                  I read the approved 2026 capital budgets of {states ? `${states} states` : "the covered states"}, line by line, and every figure I give
                  you comes with the page it was read from.
                  {place ? ` You are looking at ${place}.` : ""}
                </p>
                <p className="text-muted">
                  Ask about a local government, a sector such as health or roads, or what was approved last year with nothing spent. If the
                  document does not record something, I will say so rather than guess.
                </p>
              </div>
            )}
            {chat.messages.map((m, i) =>
              m.role === "user" ? (
                <p key={i} className="ml-8 self-end rounded-[14px] rounded-tr-[4px] bg-clay px-3.5 py-2.5 text-[14px] leading-snug text-on-clay">
                  {m.text}
                </p>
              ) : m.pending ? (
                <p key={i} className="mr-8 flex items-center gap-1.5 self-start rounded-[14px] rounded-tl-[4px] bg-card px-3.5 py-3 shadow-card" aria-label="Budget Line is checking">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="h-2 w-2 rounded-full bg-marigold motion-safe:animate-wave" style={{ animationDelay: `${d * 150}ms` }} />
                  ))}
                </p>
              ) : (
                <div key={i} className="mr-8 flex flex-col gap-2 self-start">
                  <p className="rounded-[14px] rounded-tl-[4px] bg-card px-3.5 py-2.5 text-[14px] leading-snug text-ink shadow-card">{m.text}</p>
                  {citedProjects(m).map((p) => (
                    <ResultCard key={p.id} project={p} variant="mini" />
                  ))}
                </div>
              ),
            )}
            {chat.error && <p className="text-[13px] text-marigold-text">{chat.error}</p>}
            <div ref={endRef} />
          </div>

          <div className="border-t border-hairline p-3">
            <ChatComposer onSend={chat.send} pending={chat.pending} disabled={disabled} placeholder="Type your question" />
          </div>
        </section>
      )}
    </>
  );
}
