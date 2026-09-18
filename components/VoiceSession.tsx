"use client";

/**
 * Phase 3 harness: proves the voice loop end to end. Status, live captions,
 * and the raw tool results that the real cards will render from. Phase 4
 * replaces the presentation, not the wiring.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { createVoiceClient, type ToolResult, type Transcript, type VoiceStatus } from "@/lib/vapi";

type Props = {
  publicKey?: string;
  assistantId?: string;
  assistant?: CreateAssistantDTO;
  publicUrl: string;
};

export default function VoiceSession({ publicKey, assistantId, assistant, publicUrl }: Props) {
  const [status, setStatus] = useState<VoiceStatus>(publicKey ? "idle" : "unavailable");
  const [detail, setDetail] = useState<string>();
  const [lines, setLines] = useState<Transcript[]>([]);
  const [partial, setPartial] = useState<Transcript | null>(null);
  const [results, setResults] = useState<ToolResult[]>([]);
  const [calls, setCalls] = useState<string[]>([]);

  const client = useMemo(
    () =>
      createVoiceClient(
        publicKey,
        assistantId ? { assistantId } : { assistant: assistant! },
      ),
    [publicKey, assistantId, assistant],
  );
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
      client.on("toolCall", (name, args) => setCalls((c) => [...c, `${name}(${JSON.stringify(args)})`])),
      client.on("toolResult", (r) => setResults((rs) => [...rs, r])),
    ];
    return () => {
      offs.forEach((off) => off());
      stopRef.current();
    };
  }, [client]);

  const inCall = status === "listening" || status === "speaking" || status === "thinking" || status === "connecting";

  return (
    <div className="mx-auto max-w-2xl p-6 font-mono text-sm">
      <h1 className="text-lg font-semibold">Budget Line — voice harness</h1>

      {!client.available && (
        <p className="mt-3 rounded border p-3">
          Voice unavailable: no <code>NEXT_PUBLIC_VAPI_PUBLIC_KEY</code>. Browsing still works.
        </p>
      )}
      {client.available && !publicUrl && (
        <p className="mt-3 rounded border p-3">
          Tools have no public URL (<code>NEXT_PUBLIC_APP_URL</code> unset). Vapi cannot reach localhost, so
          lookups will fail.
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={!client.available}
          onClick={() => (inCall ? client.stop() : client.start())}
          className="rounded border px-4 py-2 disabled:opacity-40"
        >
          {inCall ? "End call" : "Start call"}
        </button>
        <span>
          status: <strong>{status}</strong>
          {detail && <span className="opacity-70"> — {detail}</span>}
        </span>
      </div>

      <section className="mt-6">
        <h2 className="font-semibold">Transcript</h2>
        <ul className="mt-2 space-y-1">
          {lines.map((l, i) => (
            <li key={i}>
              <span className="opacity-60">{l.role}:</span> {l.text}
            </li>
          ))}
          {partial && (
            <li className="opacity-50">
              <span>{partial.role}:</span> {partial.text}
            </li>
          )}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Tool calls</h2>
        <ul className="mt-2 space-y-1">{calls.map((c, i) => <li key={i}>{c}</li>)}</ul>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Tool results (cards render from these)</h2>
        {results.map((r, i) => (
          <pre key={i} className="mt-2 overflow-x-auto rounded border p-3 text-xs">
            {r.name}
            {"\n"}
            {JSON.stringify(r.payload, null, 2)}
          </pre>
        ))}
      </section>
    </div>
  );
}
