import { forwardRef } from "react";
import { FitText, MicGlyph, SpendBar } from "@/components/ui";
import { formatNaira, type Project, type StateSummary } from "@/modules/budget";
import { spendStatus } from "@/modules/results";

/**
 * The 1080 × 1350 WhatsApp asset. Square corners and 2px ledger rules, since
 * the sheet has no app around it. Everything a stranger needs to check the
 * claim is on it: amount, the unspent fact, the document, the page.
 */
export const ShareCard = forwardRef<HTMLDivElement, { project: Project; registry: StateSummary; url?: string }>(function ShareCard(
  { project, registry, url },
  ref,
) {
  const s = spendStatus(project);
  const a25 = formatNaira(project.approved2025);
  const s25 = formatNaira(project.spent2025);
  return (
    <div
      ref={ref}
      className="flex flex-col bg-[#FFF4E8] text-[#241611]"
      style={{ width: 1080, height: 1350, padding: 72, fontFamily: "var(--font-figtree), Figtree, sans-serif" }}
    >
      <div className="flex items-center justify-between border-b-[3px] border-[#241611] pb-6">
        <span className="flex items-center gap-4">
          <span className="h-7 w-7 rounded-[9px] bg-[#F2911F]" />
          <span className="font-display text-[44px] font-bold tracking-[-0.02em]">Budget Line</span>
        </span>
        <span className="rounded-[10px] bg-[#F1E2D3] px-5 py-2 text-[24px] font-bold uppercase tracking-[0.12em] text-[#5C4237]">{registry.name} State</span>
      </div>

      <p className="mt-9 text-[26px] font-bold uppercase tracking-[0.08em] text-[#6B564D]">
        {project.lgaLabel} · {project.mda}
      </p>
      <h1 className="mt-4 font-display text-[64px] font-bold leading-[1.08] tracking-[-0.03em]">{project.project}</h1>

      <p className="mt-9 text-[26px] font-bold uppercase tracking-[0.1em] text-[#7A6355]">Approved 2026</p>
      <FitText data-num text={project.display} max={132} min={56} className="font-display font-extrabold tracking-[-0.05em]" />
      <p className="mt-2 text-[40px] font-bold uppercase tracking-[0.02em] text-[#7A6355]">{project.plain}</p>

      <div className="mt-10 flex flex-col gap-5 bg-[#FFE9CF] p-9">
        {s.kind === "no-record" ? (
          <p className="text-[32px] font-semibold text-[#5C4237]">{s.line}</p>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <span className="text-[32px] font-semibold text-[#5C4237]">2025 approved</span>
              <span data-num className="w-[58%] text-right font-display font-bold">
                <FitText text={a25.display} max={40} min={22} className="text-right" />
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[34px] font-bold">2025 spent</span>
              <span data-num className="w-[62%] text-right font-display font-extrabold tracking-[-0.03em] text-[#A5520B]">
                <FitText text={s25.display} max={72} min={28} className="text-right" />
              </span>
            </div>
            <SpendBar ratio={s.ratio} className="h-4 [&>span]:h-4" />
            <p className="text-[30px] leading-[1.35] text-[#5C4237]">{s.line}</p>
          </>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-8 border-t-[3px] border-[#241611] pt-7">
        <div className="min-w-0">
          <p className="text-[30px] font-bold leading-tight text-[#A5520B]">
            {registry.document}, page {project.page}
          </p>
          <p className="mt-1 break-all text-[26px] leading-tight text-[#6B564D]">
            {url ? `Check it: ${url.replace(/^https?:\/\//, "")}` : `${registry.pages} pages, read line by line`}
          </p>
        </div>
        <div className="shrink-0 whitespace-nowrap text-right">
          <p className="text-[24px] font-bold uppercase tracking-[0.1em] text-[#7A6355]">Read it yourself</p>
          <p data-num className="font-display text-[38px] font-bold">
            page {project.page} of {registry.pages}
          </p>
        </div>
      </div>
      <span className="sr-only">
        <MicGlyph size={1} />
      </span>
    </div>
  );
});
