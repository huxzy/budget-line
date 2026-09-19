"use client";

import { useRouter } from "next/navigation";
import { Button, PlannedTag } from "@/components/ui";
import type { Project } from "@/modules/budget";
import type { Chat } from "@/modules/chat";
import { ResultCard } from "@/modules/results";
import type { VoiceSession } from "@/modules/voice";
import type { AtlasData, Place } from "../types";

/**
 * Saying a place from the map: the cluster dims behind a clay veil and the
 * heard words type in. A tool result raises a match card; confirming opens
 * the place. A place we don't cover returns the pending answer, not a guess.
 * The map stays underneath and is untouched when this closes.
 */
export function VoiceOverlay({
  session,
  chat,
  typed,
  data,
  onClose,
  composer,
}: {
  session: VoiceSession;
  chat: Chat;
  /** True when this overlay was opened by typing rather than the mic. */
  typed: boolean;
  data: AtlasData;
  onClose: () => void;
  /** The composer, so a typed conversation can continue inside the overlay. */
  composer?: React.ReactNode;
}) {
  const router = useRouter();
  const lastTyped = [...chat.messages].reverse().find((m) => m.role === "user")?.text ?? "";
  const reply = [...chat.messages].reverse().find((m) => m.role === "assistant" && !m.pending)?.text ?? "";
  const heard = typed
    ? lastTyped
    : session.partial?.role === "user"
      ? session.partial.text
      : ([...session.lines].reverse().find((l) => l.role === "user")?.text ?? "");
  const pool = typed ? chat.results : session.results;
  const last = pool[pool.length - 1]?.payload as Record<string, unknown> | undefined;

  let match: Place | null = null;
  let pending: { name: string } | null = null;
  let cited: Project[] = [];
  let total = 0;
  if (last?.found === true && typeof last.lga === "string") {
    match = data.lgas.find((l) => l.key === last.lga) ?? null;
    if (Array.isArray(last.projects)) cited = (last.projects as Project[]).slice(0, 2);
    if (typeof last.total === "number") total = last.total;
  } else if (last?.found === false && last.reason === "not_live") {
    const st = last.state as { name?: string } | string | undefined;
    pending = { name: typeof st === "string" ? st : (st?.name ?? "That state") };
  } else if (typed && !last && lastTyped) {
    // A typed state name is enough to offer the state, without waiting on a tool.
    const q = lastTyped.toLowerCase().replace(/\s+state$/, "").trim();
    match = data.states.find((s) => s.status === "live" && s.name.toLowerCase() === q) ?? null;
  } else if (last?.found === true && typeof last.covered === "boolean" && last.state && typeof last.state === "object") {
    const st = last.state as { slug?: string; name?: string };
    if (last.covered) match = data.states.find((s) => s.key === st.slug) ?? null;
    else pending = { name: st.name ?? "That state" };
  }

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-clay/55 p-6 motion-safe:animate-veil"
      role="dialog"
      aria-modal="true"
      aria-label="Say a place"
    >
      {!typed && (
        <div className="flex h-8 items-end gap-1" aria-hidden>
          {[0.4, 0.7, 1, 0.6, 0.8].map((h, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full bg-on-clay/80 motion-safe:animate-wave"
              style={{ height: `${h * 100}%`, animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>
      )}
      <p className="max-w-[720px] text-center font-display text-[36px] font-extrabold leading-tight tracking-[-0.03em] text-on-clay sm:text-[44px]">
        {heard ||
          (typed
            ? "…"
            : session.status === "connecting"
              ? "Connecting…"
              : session.status === "speaking"
                ? "Budget Line is speaking…"
                : "Your turn — name a place")}
        {!typed && <span className="ml-1 inline-block h-9 w-[3px] bg-marigold align-[-4px] motion-safe:animate-caret" aria-hidden />}
      </p>
      {typed &&
        (chat.pending ? (
          <p className="text-[15px] text-on-clay/85">Budget Line is checking…</p>
        ) : reply ? (
          <p className="max-w-[560px] text-center text-[16px] leading-relaxed text-on-clay/90">{reply}</p>
        ) : null)}
      {typed && chat.error && <p className="text-[14px] text-marigold">{chat.error}</p>}

      {match && cited.length > 0 && (
        <div className="flex w-full max-w-[560px] flex-col gap-3 motion-safe:animate-rise">
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-marigold">Just cited</span>
            <span className="h-px flex-1 bg-on-clay/25" />
            <span data-num className="text-[13px] font-semibold text-on-clay/85">
              {cited.length} of {total} · {match.name}
            </span>
          </div>
          {cited.map((p, i) => (
            <ResultCard key={p.id} project={p} variant="compact" cited={i === 0} index={i} countUp={false} />
          ))}
          <Button variant="marigold" size="lg" onClick={() => router.push(match!.href)} className="self-center">
            Open {match.name} · all {total}
          </Button>
        </div>
      )}
      {match && cited.length === 0 && (
        <div className="flex w-full max-w-[440px] items-center gap-4 rounded-[18px] bg-surface p-5 shadow-hero motion-safe:animate-rise">
          <div className="min-w-0 flex-1">
            <span className="eyebrow">{match.kind === "lga" ? `Local government · ${match.stateName} State` : "State"}</span>
            <p className="font-display text-[24px] font-bold text-ink">{match.name}</p>
            {match.figures && (
              <p data-num className="text-[13px] text-muted">
                {match.figures.projects.toLocaleString("en-NG")} projects · {match.figures.compact} · {match.figures.plain}
              </p>
            )}
          </div>
          <Button variant="marigold" size="lg" onClick={() => router.push(match!.href)}>
            Open {match.name}
          </Button>
        </div>
      )}
      {pending && (
        <div className="w-full max-w-[440px] rounded-[18px] bg-surface p-5 shadow-hero motion-safe:animate-rise">
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-[24px] font-bold text-ink">{pending.name} State</p>
            <PlannedTag />
          </div>
          <p className="mt-1 text-[14px] text-muted">Budget not available yet. {data.registry.name} is the first state on Budget Line.</p>
        </div>
      )}
      {typed && composer && <div className="w-full max-w-[440px]">{composer}</div>}
      <p className="text-[13px] text-on-clay/85">
        {typed ? "A place we don't cover yet? It says so instead of guessing." : "Heard a place we don't cover yet? It says so instead of guessing."}
      </p>
      <Button variant="pill" onClick={onClose} className="border-0">
        Close
      </Button>
    </div>
  );
}
