"use client";

/**
 * Troubleshooting page for hearing problems. Side by side: what the mic
 * recorded (transcribed by OpenAI, independently of Vapi), what Vapi's
 * transcriber heard, what the model said, and every tool call with its
 * arguments. A transcriber picker lets one call be tried against another.
 * Plain on purpose.
 */
import { useEffect, useRef, useState } from "react";
import { createVoiceClient, type VoiceConfig, type VoiceStatus } from "@/modules/voice";

type Line = { t: number; kind: "you-openai" | "you-vapi" | "you-vapi-partial" | "agent" | "tool-call" | "tool-result" | "status" | "raw"; text: string };


function stamp(t0: number, t: number) {
  return ((t - t0) / 1000).toFixed(1).padStart(6) + "s";
}

/** Transcribers to try, as Vapi accepts them. "assistant" = whatever the app is configured with. */
const TRANSCRIBERS: Record<string, Record<string, unknown> | null> = {
  "assistant (current)": null,
  "speechmatics enhanced": { provider: "speechmatics", language: "en", operatingPoint: "enhanced" },
  "azure en-NG": { provider: "azure", language: "en-NG" },
  "assembly-ai": { provider: "assembly-ai", language: "en" },
  "gladia solaria-1": { provider: "gladia", model: "solaria-1", language: "en" },
  "11labs scribe realtime": { provider: "11labs", model: "scribe_v2_realtime", language: "en" },
  "deepgram nova-3 en": { provider: "deepgram", model: "nova-3", language: "en" },
  "deepgram + state names only": { provider: "deepgram", model: "nova-3", language: "en", keyterm: 9 },
  "deepgram + every keyterm (bad)": { provider: "deepgram", model: "nova-3", language: "en", keyterm: 0 },
  "deepgram nova-3 multi": { provider: "deepgram", model: "nova-3", language: "multi" },
  "openai gpt-4o-transcribe": { provider: "openai", model: "gpt-4o-transcribe", language: "en" },
};

/** `places`: every live state and local government name, for sizing the keyterm list. */
export function VoiceDebug({ config, places }: { config: VoiceConfig; places: string[] }) {
  const [transcriber, setTranscriber] = useState<string>("assistant (current)");
  const [rawMic, setRawMic] = useState(false);
  const [status, setStatus] = useState<VoiceStatus>(config.publicKey ? "idle" : "unavailable");
  const [lines, setLines] = useState<Line[]>([]);
  const [showRaw, setShowRaw] = useState(false);
  const [clips, setClips] = useState<{ url: string; at: number }[]>([]);
  const t0 = useRef(performance.now());
  const clientRef = useRef<ReturnType<typeof createVoiceClient> | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const meterRef = useRef<(() => void) | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const push = (kind: Line["kind"], text: string) =>
    setLines((l) => {
      const next = { t: performance.now(), kind, text };
      const last = l[l.length - 1];
      // a growing partial replaces the previous partial from the same source
      if (last && last.kind === kind && kind.endsWith("-partial")) return [...l.slice(0, -1), next];
      return [...l, next];
    });

  useEffect(() => {
    const client = createVoiceClient(config.publicKey, config.target, config.coverage);
    clientRef.current = client;
    const offs = [
      client.on("status", (s, d) => {
        setStatus(s);
        push("status", d ? `${s} — ${d}` : s);
      }),
      client.on("transcript", (t) => {
        // the agent's text streams a token at a time; only the finished line is worth a row
        if (t.role === "assistant") {
          if (t.final) push("agent", t.text);
          return;
        }
        push(t.final ? "you-vapi" : "you-vapi-partial", t.text);
      }),
      client.on("toolCall", (name, args) => push("tool-call", `${name}(${JSON.stringify(args)})`)),
      client.on("toolResult", (r) => {
        const p = r.payload as Record<string, unknown>;
        push("tool-result", `${r.name} → found=${String(p.found)}${p.total !== undefined ? ` total=${p.total}` : ""}${p.reason ? ` reason=${p.reason}` : ""}${p.lga ? ` lga=${p.lga}` : ""}${p.state && typeof p.state === "string" ? ` state=${p.state}` : ""}`);
      }),
      client.on("raw", (m) => push("raw", JSON.stringify(m).slice(0, 400))),
    ];
    return () => {
      offs.forEach((off) => off());
      client.stop();
    };
  }, [config]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  async function startLocalCapture() {
    // record the mic, one clip per 8 seconds, for playback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      // Peak level per clip: silent clips are not sent, since a transcriber
      // given silence makes words up (in any language it likes).
      const ac = new AudioContext();
      const analyser = ac.createAnalyser();
      ac.createMediaStreamSource(stream).connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      let peak = 0;
      const meter = setInterval(() => {
        analyser.getFloatTimeDomainData(buf);
        for (const v of buf) if (Math.abs(v) > peak) peak = Math.abs(v);
      }, 100);
      meterRef.current = () => {
        clearInterval(meter);
        void ac.close();
      };
      // One recorder per clip: a fresh file each time so every clip is playable
      // and transcribable on its own (a single stream's chunks are not).
      const cut = () => {
        if (!streamRef.current) return;
        const rec = new MediaRecorder(streamRef.current);
        const started = performance.now();
        rec.ondataavailable = (e) => {
          const loud = peak > 0.05;
          peak = 0;
          if (e.data.size < 2000 || !loud) return; // nothing said
          const url = URL.createObjectURL(e.data);
          setClips((c) => [...c, { url, at: started }]);
          void transcribeClip(e.data, started);
        };
        rec.start();
        recRef.current = rec;
        setTimeout(() => {
          if (rec.state !== "inactive") rec.stop();
          if (streamRef.current) cut();
        }, 6000);
      };
      cut();
    } catch (e) {
      push("status", `mic recording failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function transcribeClip(blob: Blob, at: number) {
    const form = new FormData();
    form.append("clip", blob, "clip.webm");
    try {
      const res = await fetch("/api/debug/transcribe", { method: "POST", body: form });
      const data = (await res.json()) as { text?: string; error?: string };
      if (data.error) {
        if (!serverNoted.current) {
          serverNoted.current = true;
          push("status", `server transcription unavailable: ${data.error}`);
        }
        return;
      }
      if (data.text?.trim()) setLines((l) => [...l, { t: at, kind: "you-openai" as const, text: data.text!.trim() }].sort((a, b) => a.t - b.t));
    } catch (e) {
      push("status", `server transcription failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  const serverNoted = useRef(false);

  function stopLocalCapture() {
    recRef.current?.stop();
    recRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    meterRef.current?.();
    meterRef.current = null;
  }

  const inCall = status === "listening" || status === "speaking" || status === "thinking" || status === "connecting";

  async function toggle() {
    if (inCall) {
      clientRef.current?.stop();
      stopLocalCapture();
    } else {
      setLines([]);
      setClips([]);
      t0.current = performance.now();
      await startLocalCapture();
      let t = TRANSCRIBERS[transcriber];
      // a number is how many of `places` to send as keyterms (0 = all); more than ~40 makes it worse
      if (t && typeof t.keyterm === "number") t = { ...t, keyterm: t.keyterm ? places.slice(0, t.keyterm) : places };
      // the keyterm list (every live place name) lives on the assistant's deepgram fallback

      push("status", `transcriber for this call: ${t ? JSON.stringify(t) : transcriberName(config)}`);
      if (rawMic) push("status", "microphone: raw track, browser echo cancellation / noise suppression / gain control off");
      await clientRef.current?.start({ ...(t ? { transcriber: t } : {}), rawMic });
    }
  }

  const colour: Record<Line["kind"], string> = {
    "you-openai": "#1d4ed8",
    "you-vapi": "#b45309",
    "you-vapi-partial": "#d97706",
    agent: "#065f46",
    "tool-call": "#7c3aed",
    "tool-result": "#6d28d9",
    status: "#6b7280",
    raw: "#9ca3af",
  };

  return (
    <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13, padding: 20, maxWidth: 1100, margin: "0 auto", color: "#111" }}>
      <h1 style={{ fontSize: 18, margin: 0 }}>Voice troubleshooting</h1>
      <p style={{ margin: "6px 0 14px", color: "#555" }}>
        Blue = what your mic recorded, transcribed independently of Vapi (OpenAI, 6-second clips). Orange = what Vapi&apos;s transcriber heard (the only thing the agent gets). Green = what the agent
        said. Purple = tool calls with the exact arguments. If blue and orange disagree, the problem is on Vapi&apos;s side; if blue
        is wrong too, it is the mic or the room. The clips at the bottom are the ground truth either way.
      </p>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={toggle}
          disabled={status === "unavailable"}
          style={{
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: 15,
            color: "#fff",
            background: inCall ? "#b91c1c" : "#1d4ed8",
            border: "none",
            borderRadius: 8,
            cursor: status === "unavailable" ? "not-allowed" : "pointer",
            opacity: status === "unavailable" ? 0.5 : 1,
          }}
        >
          {inCall ? "■ End call" : "● Start call"}
        </button>
        {status === "unavailable" && <span style={{ color: "#b91c1c" }}>No NEXT_PUBLIC_VAPI_PUBLIC_KEY on this server — voice cannot start.</span>}
        <span>
          status: <b>{status}</b>
        </span>
        <label>
          transcriber:{" "}
          <select value={transcriber} onChange={(e) => setTranscriber(e.target.value)} disabled={inCall} style={{ padding: 4 }}>
            {Object.keys(TRANSCRIBERS).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label title="Applies to the first call after the page loads; reload to switch back.">
          <input type="checkbox" checked={rawMic} onChange={(e) => setRawMic(e.target.checked)} disabled={inCall} /> raw mic (no browser processing)
        </label>
        <label style={{ marginLeft: "auto" }}>
          <input type="checkbox" checked={showRaw} onChange={(e) => setShowRaw(e.target.checked)} /> show raw Vapi messages
        </label>
        <button type="button" style={{ padding: "6px 12px", border: "1px solid #999", borderRadius: 6, background: "#fff", cursor: "pointer" }} onClick={() => navigator.clipboard.writeText(lines.filter((l) => l.kind !== "raw").map((l) => `${stamp(t0.current, l.t)} ${l.kind.padEnd(16)} ${l.text}`).join("\n"))}>
          copy log
        </button>
      </div>

      <div style={{ marginTop: 14, border: "1px solid #ddd", borderRadius: 8, padding: 12, minHeight: 320, maxHeight: "60vh", overflowY: "auto", background: "#fafafa" }}>
        {lines.length === 0 && <p style={{ color: "#888" }}>Press Start call, allow the microphone, then say a place name. Every event lands here with a timestamp.</p>}
        {lines
          .filter((l) => showRaw || l.kind !== "raw")
          .map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "2px 0", color: colour[l.kind], opacity: l.kind === "you-vapi-partial" ? 0.6 : 1 }}>
              <span style={{ color: "#999", flexShrink: 0 }}>{stamp(t0.current, l.t)}</span>
              <span style={{ width: 130, flexShrink: 0, fontWeight: 700 }}>{l.kind}</span>
              <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{l.text}</span>
            </div>
          ))}
        <div ref={endRef} />
      </div>

      {clips.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <b>Mic recordings</b> (6-second clips; each is sent once to OpenAI for the blue transcript, nothing else):
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
            {clips.map((c, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#999" }}>{stamp(t0.current, c.at)}</span>
                <audio controls src={c.url} style={{ height: 30 }} />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function transcriberName(config: VoiceConfig): string {
  if (!("assistant" in config.target)) return "saved assistant";
  const t = config.target.assistant.transcriber as { provider?: string; model?: string } | undefined;
  return t ? `${t.provider} ${t.model ?? ""}`.trim() : "default";
}
