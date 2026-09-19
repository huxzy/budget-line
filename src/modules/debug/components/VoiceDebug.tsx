"use client";

/**
 * Troubleshooting page for hearing problems. Side by side: what the browser's
 * own speech recogniser heard from the microphone, what Vapi's transcriber
 * heard, what the model said, and every tool call with its arguments. Also
 * records the mic so a turn can be played back. Plain on purpose.
 */
import { useEffect, useRef, useState } from "react";
import { createVoiceClient, type VoiceConfig, type VoiceStatus } from "@/modules/voice";

type Line = { t: number; kind: "you-browser" | "you-vapi" | "you-vapi-partial" | "agent" | "tool-call" | "tool-result" | "status" | "raw"; text: string };

type SR = { start(): void; stop(): void; continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: SpeechRecognitionEventLike) => void) | null; onerror: ((e: unknown) => void) | null; onend: (() => void) | null };
type SpeechRecognitionEventLike = { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string; confidence: number } }> };

function stamp(t0: number, t: number) {
  return ((t - t0) / 1000).toFixed(1).padStart(6) + "s";
}

export function VoiceDebug({ config }: { config: VoiceConfig }) {
  const [status, setStatus] = useState<VoiceStatus>(config.publicKey ? "idle" : "unavailable");
  const [lines, setLines] = useState<Line[]>([]);
  const [showRaw, setShowRaw] = useState(false);
  const [browserSr, setBrowserSr] = useState<"off" | "on" | "unsupported">("off");
  const [clips, setClips] = useState<{ url: string; at: number }[]>([]);
  const t0 = useRef(performance.now());
  const clientRef = useRef<ReturnType<typeof createVoiceClient> | null>(null);
  const srRef = useRef<SR | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const push = (kind: Line["kind"], text: string) => setLines((l) => [...l, { t: performance.now(), kind, text }]);

  useEffect(() => {
    const client = createVoiceClient(config.publicKey, config.target, config.coverage);
    clientRef.current = client;
    const offs = [
      client.on("status", (s, d) => {
        setStatus(s);
        push("status", d ? `${s} — ${d}` : s);
      }),
      client.on("transcript", (t) => push(t.role === "user" ? (t.final ? "you-vapi" : "you-vapi-partial") : "agent", t.text)),
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
    // 1. the browser's own recogniser, as a second opinion on what you said
    const Ctor = (window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition;
    if (Ctor) {
      const sr = new Ctor();
      sr.continuous = true;
      sr.interimResults = false;
      sr.lang = "en-NG";
      sr.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) push("you-browser", `${r[0].transcript.trim()} (confidence ${Math.round(r[0].confidence * 100)}%)`);
        }
      };
      sr.onerror = (e) => push("status", `browser recogniser error: ${(e as { error?: string }).error ?? "unknown"}`);
      sr.onend = () => {
        if (srRef.current === sr) {
          try {
            sr.start();
          } catch {
            /* ended */
          }
        }
      };
      srRef.current = sr;
      sr.start();
      setBrowserSr("on");
    } else {
      setBrowserSr("unsupported");
      push("status", "This browser has no built-in speech recogniser (Chrome does); only Vapi's transcript is shown.");
    }
    // 2. record the mic, one clip per 8 seconds, for playback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) setClips((c) => [...c, { url: URL.createObjectURL(e.data), at: performance.now() }]);
      };
      rec.start(8000);
      recRef.current = rec;
    } catch (e) {
      push("status", `mic recording failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  function stopLocalCapture() {
    const sr = srRef.current;
    srRef.current = null;
    sr?.stop();
    recRef.current?.stop();
    recRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setBrowserSr("off");
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
      await clientRef.current?.start({});
    }
  }

  const colour: Record<Line["kind"], string> = {
    "you-browser": "#1d4ed8",
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
        Blue = what this browser&apos;s own recogniser heard from your mic. Orange = what Vapi&apos;s transcriber heard (the only thing the
        agent gets). Green = what the agent said. Purple = tool calls with the exact arguments. If blue and orange disagree, the
        problem is on Vapi&apos;s side; if blue is wrong too, it is the mic or the room.
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
          status: <b>{status}</b> · browser recogniser: <b>{browserSr}</b> · transcriber: <b>{transcriberName(config)}</b>
        </span>
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
          <b>Mic recordings</b> (8-second clips, this browser only — nothing is uploaded):
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
