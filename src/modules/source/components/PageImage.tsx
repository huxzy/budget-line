"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "@/modules/budget";

/**
 * The rendered budget page with a full-width marigold band over the cited
 * row. Band position comes from the extractor (fractions of page height), so
 * it holds at any width or page shape. Zoomed, the page is 2.2× wide inside
 * a scroll box and opens centred on the row.
 */
export function PageImage({ src, page, cited, zoom }: { src: string; page: number; cited: Project | null; zoom: boolean }) {
  const bandRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // A cached image can finish before React attaches onLoad; check on mount so
  // the page is never left hidden behind the shimmer.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src]);

  // Centre on the row once the image has its real height (the band sits at 0 before then).
  useEffect(() => {
    if (loaded) bandRef.current?.scrollIntoView({ block: "center", inline: "start", behavior: "smooth" });
  }, [cited?.id, zoom, loaded]);

  return (
    <div className={zoom ? "max-h-[70vh] overflow-auto rounded-[12px] bg-white shadow-card" : "rounded-[12px] bg-white shadow-card"}>
      <div className="relative" style={{ width: zoom ? "220%" : "100%", minHeight: loaded ? undefined : "40vh" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static pre-rendered page */}
        {!loaded && <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,var(--hairline)_0%,var(--card-soft)_50%,var(--hairline)_100%)] bg-[length:240px_100%]" style={{ aspectRatio: "792 / 612" }} aria-busy aria-label="Loading the page image" />}
        <img
          ref={imgRef}
          src={src}
          alt={`Budget document, page ${page}`}
          className={loaded ? "block h-auto w-full" : "block h-auto w-full opacity-0"}
          loading="eager"
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
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
