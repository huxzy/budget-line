"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SourcePageData } from "../types";
import { ClaimCard } from "./ClaimCard";
import { PageImage } from "./PageImage";
import { TextOnlyRows } from "./TextOnlyRows";

function Chip({
  children,
  onClick,
  href,
  active,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  active?: boolean;
  disabled?: boolean;
}) {
  const cls = cn(
    "inline-flex items-center rounded-full px-3.5 py-2 text-[13px] font-semibold no-underline hover:no-underline",
    active ? "bg-clay text-on-clay" : "bg-card text-ink shadow-card hover:bg-hairline",
    disabled && "pointer-events-none opacity-40",
  );
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls} disabled={disabled} aria-pressed={active}>
      {children}
    </button>
  );
}

/**
 * Source verification: the page and the line, side by side. The single most
 * important screen. Text-only mode swaps the image for the extracted rows.
 */
export function SourceViewer({ data }: { data: SourcePageData }) {
  const router = useRouter();
  const params = useSearchParams();
  const [textOnly, setTextOnly] = useState(params.get("text") === "1");
  const [zoom, setZoom] = useState(true);
  const { state, page, range, rows, cited, line } = data;
  const doc = state.document ?? `${state.name} ${state.year} Approved Budget`;
  const rowQuery = cited ? `?row=${cited.id}` : "";
  const back = cited ? `/project/${cited.id}` : "/ask";

  return (
    <div className="flex min-h-dvh flex-col bg-clay-deep text-on-clay">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-8">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push(back))}
          className="inline-flex items-center gap-2 text-[15px] font-semibold text-on-clay"
        >
          <span aria-hidden>←</span> Back to the answer
        </button>
        <span className="text-[14px] text-on-clay-muted">
          {doc} · page <span data-num>{page}</span> of <span data-num>{state.pages}</span>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant={textOnly ? "marigold" : "pill"} onClick={() => setTextOnly((v) => !v)} aria-pressed={textOnly}>
            Text only
          </Button>
          <a
            href={data.imageSrc}
            download={`${state.slug}-${state.year}-page-${page}.webp`}
            className="inline-flex items-center rounded-full bg-card px-4 py-2 text-[14px] font-semibold text-ink no-underline hover:no-underline"
          >
            Download page
          </a>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 bg-surface p-5 text-ink sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:rounded-tl-[28px]">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Chip onClick={() => setZoom(false)} active={!zoom && !textOnly} disabled={textOnly}>
              Fit width
            </Chip>
            <Chip onClick={() => setZoom(true)} active={zoom && !textOnly} disabled={textOnly}>
              {cited ? "Zoom to the row" : "Zoom in"}
            </Chip>
            <span className="mx-1 h-5 w-px bg-hairline-strong" aria-hidden />
            <Chip href={`/source/${state.slug}/${page - 1}`} disabled={page <= range.first}>
              ← <span data-num className="ml-1">{page - 1}</span>
            </Chip>
            <Chip active>
              Page <span data-num className="ml-1">{page}</span>
            </Chip>
            <Chip href={`/source/${state.slug}/${page + 1}`} disabled={page >= range.last}>
              <span data-num className="mr-1">{page + 1}</span> →
            </Chip>
            {line && (
              <span className="ml-auto text-[13px] font-semibold text-muted">
                Cited row is line <span data-num>{line}</span> of {rows.length} on this page
              </span>
            )}
          </div>

          {textOnly ? (
            <TextOnlyRows rows={rows} citedId={cited?.id} page={page} />
          ) : (
            <PageImage src={data.imageSrc} page={page} cited={cited} zoom={zoom} />
          )}

          <p className="text-[13px] text-soft">
            {textOnly
              ? "Showing the rows as extracted from the PDF. Switch off text only to see the page image."
              : zoom
                ? "The band marks the cited row. Scroll the page to read the rest; fit width shows the whole page."
                : "The band marks the cited row. Zoom in to read the printed figures."}
          </p>
        </section>

        <aside className="order-first flex flex-col gap-5 rounded-[24px] bg-clay p-5 text-on-clay lg:order-none lg:sticky lg:top-6 lg:self-start">
          {cited ? (
            <>
              <span className="eyebrow text-on-clay-muted">The figure being checked</span>
              <ClaimCard project={cited} />
              <div>
                <span className="eyebrow text-on-clay-muted">How it was matched</span>
                <ol className="mt-3 flex flex-col gap-2.5 text-[14px] leading-snug">
                  {[
                    <>
                      Page <span data-num>{page}</span>, line <span data-num>{line}</span> — highlighted at left.
                    </>,
                    <>Figures read from the published PDF, never retyped.</>,
                    <>
                      All <span data-num>{state.projects?.toLocaleString("en-NG")}</span> rows reconcile to the official state total within ₦1.
                    </>,
                  ].map((t, i) => (
                    <li key={i} className="flex gap-3">
                      <span data-num className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-clay-raised text-[11px] font-bold">
                        {i + 1}
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <Button href={`/share/${cited.id}`} variant="marigold" size="lg" className="mt-auto w-full">
                Share this proof
              </Button>
            </>
          ) : (
            <>
              <span className="eyebrow text-on-clay-muted">This page</span>
              <p className="text-[15px] leading-relaxed">
                <span data-num>{rows.length}</span> capital projects are read from this page. Open a project to see its row highlighted.
              </p>
            </>
          )}
          <p className="text-[12px] leading-snug text-on-clay-muted">
            {doc} · <span data-num>{state.pages}</span> pages
            {state.published
              ? ` · published ${new Date(state.published).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}`
              : ""}
          </p>
          {cited && (
            <Link href={`/source/${state.slug}/${page}${rowQuery}&text=1`} className="sr-only">
              Text-only version
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
