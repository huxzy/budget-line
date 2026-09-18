"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/modules/budget";
import { ResultCard } from "@/modules/results";
import type { ProjectsPayload } from "../types";

export { PlannedTag } from "@/components/ui";

/** For an empty sector search: the largest project in the same place, any sector. */
export function ResultCardLike({ empty, onAsk }: { empty: ProjectsPayload; onAsk: (t: string) => void }) {
  const [nearest, setNearest] = useState<Project | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lga: empty.lga, limit: 1 }) })
      .then((r) => r.json())
      .then((p) => live && p.found && p.projects?.[0] && setNearest(p.projects[0]))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [empty.lga]);
  if (!nearest) return null;
  return (
    <div>
      <span className="eyebrow">The largest project in {empty.lgaLabel}, any sector</span>
      <div className="mt-2">
        <ResultCard project={nearest} variant="compact" countUp={false} />
      </div>
      <button type="button" onClick={() => onAsk(`What is the biggest project in ${empty.lgaLabel}?`)} className="sr-only">
        Ask about it
      </button>
    </div>
  );
}
