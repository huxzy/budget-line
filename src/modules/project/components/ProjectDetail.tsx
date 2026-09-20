"use client";

import { useRouter } from "next/navigation";
import { Amount, Button, SourceLine, SpendBar, Tag } from "@/components/ui";
import { formatNaira, isPlace, lgaSlug, sectorLabel, type Project, type StateSummary } from "@/modules/budget";
import { ChatBubble, useChat } from "@/modules/chat";
import { spendStatus } from "@/modules/results";

/** One project: the figure, the 2025 record, history and the source row. */
export function ProjectDetail({ project, registry, chatAvailable }: { project: Project; registry: StateSummary; chatAvailable: boolean }) {
  const router = useRouter();
  const chat = useChat({ state: registry.slug, lga: isPlace(project.lga) ? project.lga : undefined });
  const s = spendStatus(project);
  const a25 = formatNaira(project.approved2025);
  const s25 = formatNaira(project.spent2025);
  const place = project.lgaLabel.replace(/ LGA$/, "");
  const backHref = `/browse?state=${project.state}&lga=${encodeURIComponent(project.lga)}&sector=${encodeURIComponent(project.sector)}`;

  return (
    <div className="min-h-dvh bg-surface">
      <ChatBubble chat={chat} disabled={!chatAvailable} place={isPlace(project.lga) ? `${place} in ${registry.name} State` : `${registry.name} State`} />
      <header className="bg-clay px-5 pb-8 pt-5 text-on-clay sm:px-10">
        <div className="mx-auto flex max-w-[960px] flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push(backHref))}
            className="inline-flex items-center gap-2 text-[15px] font-semibold"
          >
            <span aria-hidden>←</span> {sectorLabel(project.sector)} · {isPlace(project.lga) ? place : project.lgaLabel}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <Button href={`/share/${project.id}`} variant="pill" className="border-0 bg-clay-raised text-on-clay hover:bg-clay-deep">
              Share
            </Button>
          </div>
        </div>
        <div className="mx-auto mt-6 flex max-w-[960px] flex-col gap-3">
          <div className="flex items-center gap-2">
            <Tag className="bg-clay-raised text-on-clay-muted">{registry.name}</Tag>
            <span className="text-[14px] font-semibold text-on-clay-muted">
              {project.lgaLabel} · {project.mda}
            </span>
          </div>
          <h1 className="font-display text-[22px] font-bold leading-[1.18] tracking-[-0.025em] sm:text-[28px]">{project.project}</h1>
        </div>
      </header>

      <main className="px-5 py-6 sm:px-10">
        <div className="mx-auto grid max-w-[960px] grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex flex-col gap-5">
            <section className="rounded-[22px] bg-card p-6 shadow-card">
              <span className="eyebrow">Approved this year</span>
              <Amount display={project.display} plain={project.plain} value={project.approved2026} size="hero" countUp className="mt-1" />
              <p className="mt-2 text-[13px] text-muted">
                {registry.document} · capital expenditure · {sectorLabel(project.sector)?.toLowerCase()}
              </p>
            </section>

            <section className="rounded-[22px] bg-inset p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="eyebrow">2025 approved</span>
                  <Amount display={a25.display} plain={project.approved2025 > 0 ? a25.plain : undefined} size="md" className="mt-1" />
                </div>
                <div>
                  <span className="eyebrow">2025 spent</span>
                  <Amount display={s25.display} size="md" accent={project.spent2025 === 0 && project.approved2025 > 0} className="mt-1" />
                </div>
              </div>
              <SpendBar ratio={s.ratio} className="mt-4" />
              <p className="mt-3 text-[14px] leading-relaxed text-label">
                {s.kind === "unspent"
                  ? `The full ${a25.display} was approved for this project in 2025. None of it was recorded as spent by September. ${project.approved2026 > 0 ? "It has been approved again for 2026." : "Nothing is approved for 2026."}`
                  : s.line}
              </p>
            </section>

            <section className="flex flex-wrap items-center gap-4 rounded-[22px] bg-card p-6 shadow-card">
              <div className="flex flex-col gap-1">
                <span className="eyebrow">Source</span>
                <SourceLine state={project.state} page={project.page} rowId={project.id} />
              </div>
              <Button href={`/source/${project.state}/${project.page}?row=${project.id}`} variant="clay" className="ml-auto">
                See the page
              </Button>
            </section>
          </div>

          <aside className="flex flex-col gap-5">
            <section className="rounded-[22px] bg-card p-5 shadow-card">
              <span className="eyebrow">History</span>
              <dl className="mt-3 divide-y divide-hairline text-[14px]">
                {[
                  ["2026 approved", project.display, false],
                  ["2025 approved", a25.display, false],
                  ["2025 spent", s25.display, project.spent2025 === 0 && project.approved2025 > 0],
                ].map(([k, v, accent]) => (
                  <div key={String(k)} className="flex items-center justify-between py-2.5">
                    <dt className="text-muted">{k}</dt>
                    <dd data-num className={`font-display text-[15px] font-bold ${accent ? "text-marigold-text" : ""}`}>
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="rounded-[22px] border border-hairline-strong bg-card-soft p-5">
              <span className="font-display text-[15px] font-bold">What the document records</span>
              <p className="mt-1 text-[13px] leading-snug text-muted">
                Amounts, the ministry and the local government — not the contractor, progress or completion. Asked about those, Budget Line
                says the document does not record them.
              </p>
            </section>
            <Button
              href={isPlace(project.lga) ? `/s/${project.state}/${lgaSlug(project.lga)}` : `/s/${project.state}`}
              variant="clay"
              size="lg"
              className="w-full"
            >
              Ask about {isPlace(project.lga) ? place : `${registry.name} State`}
            </Button>
          </aside>
        </div>
      </main>
    </div>
  );
}
