"use client";

import { LiveTag, PlannedTag } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Language } from "@/modules/budget";

/** Step 2: language. Only live languages can be chosen; the rest are labelled planned and inert. */
export function LanguagePicker({ languages, value, onChange }: { languages: Language[]; value: string; onChange: (code: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {languages.map((l) => {
        const live = l.status === "live";
        const selected = value === l.code;
        return (
          <button
            key={l.code}
            type="button"
            disabled={!live}
            onClick={() => onChange(l.code)}
            aria-pressed={selected}
            className={cn(
              "flex items-center justify-between rounded-[16px] px-5 py-4 text-left shadow-card",
              live ? "bg-card hover:bg-hairline" : "bg-card/60 text-muted",
              selected && "outline outline-2 -outline-offset-2 outline-marigold",
            )}
          >
            <span>
              <span className="block font-display text-[19px] font-bold">
                {l.name}
                {l.native !== l.name ? <span className="font-sans text-[15px] font-semibold text-muted"> · {l.native}</span> : null}
              </span>
              {live && <span className="text-[13px] text-muted">Speak and listen</span>}
            </span>
            {live ? <LiveTag /> : <PlannedTag />}
          </button>
        );
      })}
    </div>
  );
}
