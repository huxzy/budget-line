"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, MicButton, Wordmark } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatCompact } from "@/modules/budget";
import { usePreferences } from "@/modules/prefs";
import type { FirstRunData, LgaOption } from "../types";
import { LanguagePicker } from "./LanguagePicker";
import { LgaPicker } from "./LgaPicker";

/** First run: choose your area, then your language. Saved in this browser. */
export function FirstRun({ data }: { data: FirstRunData }) {
  const router = useRouter();
  const { prefs, update } = usePreferences();
  const [step, setStep] = useState<1 | 2>(1);
  const [lga, setLga] = useState<LgaOption | null>(null);
  const [lang, setLang] = useState(prefs.lang ?? "en");
  const chosenLang = data.languages.find((l) => l.code === lang);
  const place = lga?.lgaLabel.replace(/ LGA$/, "");

  function finish() {
    if (!lga) return;
    update({ lga: lga.lga, lgaLabel: lga.lgaLabel, lang });
    router.replace("/");
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-surface lg:grid-cols-[440px_minmax(0,1fr)]">
      <aside className="flex flex-col bg-clay px-8 py-8 text-on-clay lg:px-10 lg:py-10">
        <Wordmark onClay />
        <h1 className="mt-8 font-display text-[40px] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-[48px]">
          What has government budgeted where you live?
        </h1>
        <p className="mt-4 max-w-[340px] text-[16px] leading-relaxed text-on-clay/85">
          Ask out loud in your language. Every figure comes back with the page of the approved budget it was read from.
        </p>
        <div className="mt-8 flex flex-col items-center gap-2 self-center">
          <MicButton state="idle" onPress={() => setStep(1)} size={120} label="Pick your area first" />
          <span className="font-display text-[20px] font-bold">Tap to talk</span>
          <span className="text-[13px] text-on-clay-muted">Pick your area first so answers are local</span>
        </div>
        <div className="mt-auto pt-10">
          <p data-num className="font-display text-[16px] font-bold">
            {data.registry.projects?.toLocaleString("en-NG")} projects · {formatCompact(data.registry.total_2026 ?? 0)} · {data.lgas.length} local
            governments
          </p>
          <p className="mt-1 text-[12px] leading-snug text-on-clay-muted">
            Phone and USSD access for people without data is planned, not live yet.
          </p>
        </div>
      </aside>

      <main className="flex flex-col gap-6 px-5 py-6 sm:px-10 sm:py-10">
        <ol className="flex items-center gap-3 text-[13px] font-semibold">
          <li className={cn("rounded-full px-3.5 py-2", step === 1 ? "bg-clay text-on-clay" : "bg-card text-muted")}>1 · Your area</li>
          <li className="h-px flex-1 bg-hairline-strong" aria-hidden />
          <li className={cn("rounded-full px-3.5 py-2", step === 2 ? "bg-clay text-on-clay" : "bg-card text-muted")}>2 · Language</li>
        </ol>

        {step === 1 ? (
          <LgaPicker lgas={data.lgas} states={data.states} value={lga} onChange={(l) => setLga(l)} />
        ) : (
          <>
            <span className="eyebrow">Languages for {place}</span>
            <LanguagePicker languages={data.languages} value={lang} onChange={setLang} />
          </>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-4 pt-4">
          {step === 1 ? (
            <Button variant="clay" size="lg" disabled={!lga} onClick={() => setStep(2)}>
              Continue{place ? ` · ${place}` : ""}
            </Button>
          ) : (
            <>
              <Button variant="clay" size="lg" disabled={!lga || !chosenLang} onClick={finish}>
                Continue · {place} in {chosenLang?.name}
              </Button>
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
            </>
          )}
          <span className="text-[13px] text-muted">Saved in this browser. Change it any time.</span>
        </div>
      </main>
    </div>
  );
}
