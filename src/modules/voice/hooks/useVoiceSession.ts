"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createVoiceClient } from "../services/client";
import type { CallContext, ToolResult, Transcript, VoiceConfig, VoiceStatus } from "../types";

export type VoiceSession = {
  status: VoiceStatus;
  detail?: string;
  available: boolean;
  inCall: boolean;
  /** Final lines, oldest first. */
  lines: Transcript[];
  /** The line currently being spoken or heard, if any. */
  partial: Transcript | null;
  calls: { name: string; args: Record<string, unknown> }[];
  results: ToolResult[];
  start: () => void;
  stop: () => void;
  /** Ask a question by text (starter chips, typed fallback). */
  ask: (text: string) => void;
};

/** One voice call's state, driven by the client's events. */
export function useVoiceSession(config: VoiceConfig, ctx: CallContext = {}): VoiceSession {
  const [status, setStatus] = useState<VoiceStatus>(config.publicKey ? "idle" : "unavailable");
  const [detail, setDetail] = useState<string>();
  const [lines, setLines] = useState<Transcript[]>([]);
  const [partial, setPartial] = useState<Transcript | null>(null);
  const [calls, setCalls] = useState<VoiceSession["calls"]>([]);
  const [results, setResults] = useState<ToolResult[]>([]);

  const client = useMemo(() => createVoiceClient(config.publicKey, config.target), [config.publicKey, config.target]);
  const stopRef = useRef(client.stop);
  stopRef.current = client.stop;

  useEffect(() => {
    const offs = [
      client.on("status", (s, d) => {
        setStatus(s);
        setDetail(d);
      }),
      client.on("transcript", (t) => {
        if (t.final) {
          setPartial(null);
          setLines((l) => [...l, t]);
        } else setPartial(t);
      }),
      client.on("toolCall", (name, args) => setCalls((c) => [...c, { name, args }])),
      client.on("toolResult", (r) => setResults((rs) => [...rs, r])),
    ];
    return () => {
      offs.forEach((off) => off());
      stopRef.current();
    };
  }, [client]);

  return {
    status,
    detail,
    available: client.available,
    inCall: status === "listening" || status === "speaking" || status === "thinking" || status === "connecting",
    lines,
    partial,
    calls,
    results,
    start: () => void client.start(ctx),
    stop: client.stop,
    ask: (text) => void client.say(text, ctx),
  };
}
