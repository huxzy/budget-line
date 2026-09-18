"use client";

import { useEffect, useRef } from "react";
import type { Project } from "@/modules/budget";

/**
 * The rendered budget page with a full-width marigold band over the cited
 * row. Band position comes from the extractor (fractions of page height), so
 * it holds at any width or page shape. Zoomed, the page is 2.2× wide inside
 * a scroll box and opens centred on the row.
 */
export function PageImage({ src, page, cited, zoom }: { src: string; page: number; cited: Project | null; zoom: boolean }) {
  const bandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bandRef.current?.scrollIntoView({ block: "center", inline: "start", behavior: "smooth" });
  }, [cited?.id, zoom]);

  return (
    <div className={zoom ? "max-h-[70vh] overflow-auto rounded-[12px] bg-white shadow-card" : "rounded-[12px] bg-white shadow-card"}>
      <div className="relative" style={{ width: zoom ? "220%" : "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static pre-rendered page */}
        <img src={src} alt={`Budget document, page ${page}`} className="block h-auto w-full" loading="eager" decoding="async" />
        {cited && (
          <div
            ref={bandRef}
            className="pointer-events-none absolute inset-x-0 rounded-[4px] bg-marigold/25 outline outline-2 outline-marigold"
            style={{ top: `${cited.rowTop * 100}%`, height: `${(cited.rowBottom - cited.rowTop) * 100}%` }}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
