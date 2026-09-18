"use client";

import { toPng } from "html-to-image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { Project, StateSummary } from "@/modules/budget";
import { shareCaption } from "../services/caption";
import { ShareCard } from "./ShareCard";

/** Share: the portrait asset with a caption, sent on WhatsApp or saved. */
export function ShareSheet({ project, registry, publicUrl }: { project: Project; registry: StateSummary; publicUrl: string }) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [scale, setScale] = useState(0.5);

  // Preview scale follows the frame's width; the card itself stays 1080 wide.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / 1080));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const url = publicUrl ? `${publicUrl}/source/${project.state}/${project.page}?row=${project.id}` : undefined;
  const caption = shareCaption(project, registry, url);
  const wa = `https://wa.me/?text=${encodeURIComponent(caption)}`;

  async function save() {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, { width: 1080, height: 1350, pixelRatio: 1, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `budget-line-${project.id}.png`;
      a.click();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#120b08] text-on-clay">
      <div className="flex items-center justify-between px-5 py-4 sm:px-8">
        <span className="text-[15px] font-semibold">Share</span>
        <Button variant="pill" onClick={() => (window.history.length > 1 ? router.back() : router.push(`/project/${project.id}`))} className="border-0 bg-clay-raised text-on-clay">
          Close
        </Button>
      </div>
      <div className="grid flex-1 grid-cols-1 items-start gap-8 px-5 pb-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="mx-auto w-full max-w-[540px]">
          <div ref={frameRef} className="relative overflow-hidden" style={{ aspectRatio: "1080 / 1350" }}>
            <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${scale})` }}>
              <ShareCard ref={cardRef} project={project} registry={registry} url={url} />
            </div>
          </div>
          <p className="mt-3 text-center text-[12px] text-on-clay-muted">1080 × 1350 · readable at thumbnail size · no app needed to check it</p>
        </div>
        <aside className="flex flex-col gap-4 rounded-[20px] bg-clay p-5">
          <span className="eyebrow text-on-clay-muted">Caption sent with it</span>
          <p className="text-[15px] leading-relaxed">{caption}</p>
          <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full bg-marigold px-6 py-3.5 text-[16px] font-semibold text-clay no-underline hover:no-underline">
            Send on WhatsApp
          </a>
          <Button variant="pill" size="lg" onClick={save} disabled={saving} className="border-0">
            {saving ? "Saving…" : "Save image"}
          </Button>
          {!publicUrl && <p className="text-[12px] text-on-clay-muted">No public link on this deployment, so the card shows the page number only.</p>}
        </aside>
      </div>
    </div>
  );
}
