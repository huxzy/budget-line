"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Props = {
  onSend: (text: string) => void;
  pending: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** On the clay rail or on cream. */
  onClay?: boolean;
  className?: string;
};

/** Type instead of talking: the same assistant, the same answers. */
export function ChatComposer({ onSend, pending, disabled = false, placeholder = "Or type your question", onClay = false, className }: Props) {
  const [text, setText] = useState("");
  function submit() {
    const t = text.trim();
    if (!t || pending || disabled) return;
    onSend(t);
    setText("");
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={cn(
        "flex items-center gap-2 rounded-full pl-4 pr-1.5",
        onClay ? "bg-clay-raised text-on-clay" : "bg-card text-ink shadow-card",
        disabled && "opacity-50",
        className,
      )}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={disabled ? "Chat is not configured" : placeholder}
        disabled={disabled}
        aria-label="Type your question"
        maxLength={500}
        className={cn("min-w-0 flex-1 bg-transparent py-2.5 text-[14px] outline-none", onClay ? "placeholder:text-on-clay-muted" : "placeholder:text-soft")}
      />
      <button
        type="submit"
        disabled={disabled || pending || !text.trim()}
        className={cn(
          "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-40",
          onClay ? "bg-marigold text-clay" : "bg-clay text-on-clay",
        )}
      >
        {pending ? "…" : "Ask"}
      </button>
    </form>
  );
}
