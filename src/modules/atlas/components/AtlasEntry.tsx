"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, type MicState, PlannedTag } from "@/components/ui";
import { MobileTalkBar } from "@/modules/ask";
import { ChatBubble, useChat } from "@/modules/chat";
import { useVoiceSession, type VoiceConfig } from "@/modules/voice";
import { useAtlasView } from "../hooks/useMotion";
import type { AtlasData } from "../types";
import { AtlasHeader } from "./AtlasHeader";
import { ListView } from "./ListView";
import { NigeriaView } from "./NigeriaView";
import { SearchPanel } from "./SearchPanel";
import { StateView } from "./StateView";
import { VoiceOverlay } from "./VoiceOverlay";

type Props = { data: AtlasData; voice: VoiceConfig; level: "nigeria" | "state"; stateSlug?: string };

/**
 * The entry experience. Nigeria view or a state expanded; the list view under
 * reduced motion or by choice; search and voice available on every level.
 */
export function AtlasEntry({ data, voice, level, stateSlug }: Props) {
  const { view, reduced, ready, set } = useAtlasView();
  const [searchOpen, setSearchOpen] = useState(false);
  const [overlay, setOverlay] = useState(false);
  // On a state page the call knows the state; the Nigeria view starts by asking for one.
  const r = data.registry;
  const session = useVoiceSession(
    voice,
    level === "state" && r.slug === stateSlug
      ? { state: { slug: r.slug, name: r.name, document: r.document ?? "", pages: r.pages, projects: r.projects }, examples: voice.examples }
      : {},
  );
  const micState: MicState = session.status === "error" ? "idle" : session.status;
  const chat = useChat({ state: level === "state" ? stateSlug : undefined });

  const state = level === "state" ? data.states.find((s) => s.key === stateSlug) : null;
  const pendingState = level === "state" && state && state.status !== "live";

  function closeOverlay() {
    session.stop();
    setOverlay(false);
  }
  function mic() {
    if (session.inCall) {
      session.stop();
      setOverlay(false);
    } else {
      setSearchOpen(false);
      setOverlay(true);
      session.start();
    }
  }

  const listMode = ready && view === "list" && level === "nigeria";

  return (
    <div className="relative flex min-h-dvh flex-col bg-surface pb-28 lg:pb-0">
      <AtlasHeader
        back={level === "state" ? { href: "/", label: "Nigeria" } : undefined}
        crumb={state ? `${state.name} State · ${state.status === "live" ? `${data.lgas.length} local governments` : "budget not available yet"}` : undefined}
        view={level === "state" && state?.status === "live" ? view : undefined}
        onView={set}
        onSearch={() => setSearchOpen(true)}
        motionOff={reduced && view === "list"}
      />

      {pendingState && state ? (
        <main className="mx-auto flex w-full max-w-[640px] flex-col gap-4 px-5 py-10">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-[32px] font-bold tracking-[-0.03em]">{state.name} State</h1>
            <PlannedTag />
          </div>
          <p className="text-[16px] leading-relaxed text-muted">
            Budget not available yet. {data.registry.name} is the only state read so far — {state.name}&apos;s approved budget hasn&apos;t been
            processed. When it is, it goes through the same extraction and reconciliation as {data.registry.name}&apos;s.
          </p>
          <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-muted">
            Tell me when {state.name} lands <PlannedTag />
          </span>
          <span className="eyebrow mt-4">You can look at</span>
          <Link href="/s/niger" className="flex items-center justify-between rounded-[14px] bg-card px-5 py-4 no-underline shadow-card outline outline-2 -outline-offset-2 outline-marigold hover:no-underline">
            <span>
              <span className="block font-display text-[19px] font-bold text-ink">{data.registry.name} State</span>
              <span className="text-[13px] text-muted">Available now · {data.lgas.length} local governments</span>
            </span>
            <span className="font-display font-bold text-ink" aria-hidden>
              →
            </span>
          </Link>
          <Button href="/" variant="ghost" className="w-fit">
            ← Back to Nigeria
          </Button>
        </main>
      ) : !ready ? (
        <div className="flex-1" aria-busy />
      ) : listMode ? (
        <ListView data={data} reduced={reduced} onShowMap={() => set("map")} micState={micState} onMic={mic} />
      ) : level === "nigeria" ? (
        <NigeriaView data={data} micState={micState} onMic={mic} onSearch={() => setSearchOpen(true)} />
      ) : (
        <StateView data={data} view={view} micState={micState} onMic={mic} />
      )}

      <SearchPanel data={data} open={searchOpen} onClose={() => setSearchOpen(false)} onMic={mic} />
      {overlay && <VoiceOverlay session={session} data={data} onClose={closeOverlay} />}

      <ChatBubble
        chat={chat}
        disabled={!voice.chatAvailable}
        offset="raised"
        hint="Type a state or a local government and ask."
        place={state?.status === "live" ? `${state.name} State` : undefined}
       
      />
      <div className="lg:hidden">
        <MobileTalkBar state={micState} onMic={mic} onEnd={closeOverlay} languageName="English" />
      </div>
    </div>
  );
}
