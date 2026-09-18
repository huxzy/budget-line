"use client";

/**
 * Phase 3 harness: proves the voice loop end to end. Status, live captions,
 * and the raw tool results that the real cards render from. Replaced by the
 * answer screen in Phase 4; the hook underneath stays.
 */
import { useVoiceSession } from "../hooks/useVoiceSession";
import type { VoiceConfig } from "../types";

export function VoiceHarness({ config }: { config: VoiceConfig }) {
  const s = useVoiceSession(config);

  return (
    <div className="mx-auto max-w-2xl p-6 font-mono text-sm">
      <h1 className="text-lg font-semibold">Budget Line — voice harness</h1>

      {!s.available && (
        <p className="mt-3 rounded border p-3">
          Voice unavailable: no <code>NEXT_PUBLIC_VAPI_PUBLIC_KEY</code>. Browsing still works.
        </p>
      )}
      {s.available && !config.publicUrl && (
        <p className="mt-3 rounded border p-3">
          Tools have no public URL (<code>NEXT_PUBLIC_APP_URL</code> unset). Vapi cannot reach localhost, so
          lookups will fail.
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={!s.available}
          onClick={() => (s.inCall ? s.stop() : s.start())}
          className="rounded border px-4 py-2 disabled:opacity-40"
        >
          {s.inCall ? "End call" : "Start call"}
        </button>
        <span>
          status: <strong>{s.status}</strong>
          {s.detail && <span className="opacity-70"> — {s.detail}</span>}
        </span>
      </div>

      <section className="mt-6">
        <h2 className="font-semibold">Transcript</h2>
        <ul className="mt-2 space-y-1">
          {s.lines.map((l, i) => (
            <li key={i}>
              <span className="opacity-60">{l.role}:</span> {l.text}
            </li>
          ))}
          {s.partial && (
            <li className="opacity-50">
              <span>{s.partial.role}:</span> {s.partial.text}
            </li>
          )}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Tool calls</h2>
        <ul className="mt-2 space-y-1">
          {s.calls.map((c, i) => (
            <li key={i}>
              {c.name}({JSON.stringify(c.args)})
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Tool results (cards render from these)</h2>
        {s.results.map((r, i) => (
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
