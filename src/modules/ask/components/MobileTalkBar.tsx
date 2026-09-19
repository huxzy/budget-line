"use client";

import { Button, MicButton, type MicState } from "@/components/ui";

const LABEL: Record<MicState, string> = {
  idle: "Tap to talk",
  connecting: "Connecting…",
  listening: "Listening…",
  thinking: "Looking it up…",
  speaking: "Answering…",
  unavailable: "Voice unavailable",
};

/** Below lg: the talk button pinned to the bottom, within thumb reach. */
export function MobileTalkBar({
  state,
  onMic,
  onEnd,
  languageName,
}: {
  state: MicState;
  onMic: () => void;
  onEnd: () => void;
  languageName: string;
}) {
  const inCall = state === "listening" || state === "speaking" || state === "thinking" || state === "connecting";
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 bg-clay px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 text-on-clay shadow-[0_-12px_30px_-18px_rgba(36,22,17,0.7)] lg:hidden">
      <div className="flex items-center gap-4">
        <MicButton state={state} onPress={onMic} size={64} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[19px] font-bold leading-tight">{LABEL[state]}</p>
          <p className="truncate text-[12px] text-on-clay-muted">
            {state === "unavailable" ? "Browsing still works" : `Speaking ${languageName}`}
          </p>
        </div>
        {inCall && (
          <Button variant="pill" onClick={onEnd} className="border-0 bg-clay-raised text-on-clay">
            End
          </Button>
        )}
      </div>
    </div>
  );
}
