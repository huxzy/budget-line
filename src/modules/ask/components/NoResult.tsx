"use client";

import Link from "next/link";
import { PlannedTag } from "@/components/ui";
import type { StateSummary } from "@/modules/budget";
import type { MissPayload, ProjectsPayload } from "../types";
import { ResultCardLike } from "./NoResult.parts";

/**
 * Honest, not an error. The place exists and was searched; nothing matched —
 * or the place is not one we have. Never speculates about where money went.
 * Suggestions are things to say next, not buttons: the call is the way in.
 */
export function NoResult({ payload, registry }: { payload: ProjectsPayload | MissPayload; registry: StateSummary }) {
  const miss = payload.found === false ? payload : null;
  const empty = payload.found === true ? payload : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[16px] bg-card p-4 shadow-card">
          <p data-num className="font-display text-[26px] font-bold">
            {registry.projects?.toLocaleString("en-NG")}
          </p>
          <p className="text-[13px] text-muted">capital projects searched</p>
        </div>
        <div className="rounded-[16px] bg-card p-4 shadow-card">
          <p data-num className="font-display text-[26px] font-bold">
            {registry.pages}
          </p>
          <p className="text-[13px] text-muted">pages read line by line</p>
        </div>
      </div>

      {miss?.reason === "unknown_lga" && miss.nearest && miss.nearest.length > 0 && (
        <p className="text-[15px] text-muted">
          <span className="eyebrow mr-2">Did you mean</span>
          {miss.nearest.map((n) => n.lgaLabel.replace(/ LGA$/, "")).join(", ")}? Say the name again.
        </p>
      )}

      {miss?.reason === "not_live" && (
        <p className="text-[15px] text-muted">
          Right now the document on file is {registry.document}. Other states are listed as planned until their approved budgets are
          extracted and reconciled.
        </p>
      )}

      {empty && <ResultCardLike empty={empty} />}

      <div className="flex flex-wrap items-center gap-2">
        {empty && (
          <Link href={`/browse?state=${empty.state}&lga=${encodeURIComponent(empty.lga)}`} className="rounded-full bg-card px-4 py-2.5 text-[14px] font-semibold no-underline shadow-card hover:bg-hairline hover:no-underline">
            See every sector in {empty.lgaLabel.replace(/ LGA$/, "")}
          </Link>
        )}
        <span className="inline-flex items-center gap-2 rounded-full bg-card/60 px-4 py-2.5 text-[14px] font-semibold text-muted">
          Report a missing project <PlannedTag />
        </span>
      </div>
    </div>
  );
}
