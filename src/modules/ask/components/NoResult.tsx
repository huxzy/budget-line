"use client";

import { PlannedTag, ResultCardLike } from "./NoResult.parts";
import type { MissPayload, ProjectsPayload } from "../types";
import type { StateSummary } from "@/modules/budget";

/**
 * Honest, not an error. The place exists and was searched; nothing matched —
 * or the place is not one we have. Never speculates about where money went.
 */
export function NoResult({
  payload,
  registry,
  onAsk,
}: {
  payload: ProjectsPayload | MissPayload;
  registry: StateSummary;
  onAsk: (text: string) => void;
}) {
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
        <div>
          <span className="eyebrow">Did you mean</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {miss.nearest.map((n) => (
              <button
                key={n.lga}
                type="button"
                onClick={() => onAsk(`Projects in ${n.lgaLabel}`)}
                className="rounded-full bg-card px-4 py-2 text-[14px] font-semibold shadow-card hover:bg-hairline"
              >
                {n.lgaLabel} · <span data-num>{n.projects}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {miss?.reason === "not_live" && (
        <p className="text-[15px] text-muted">
          Right now the document on file is {registry.document}. Other states are listed as planned until their approved budgets are
          extracted and reconciled.
        </p>
      )}

      {empty && <ResultCardLike empty={empty} onAsk={onAsk} />}

      <div className="flex flex-wrap gap-2">
        {empty && (
          <button type="button" onClick={() => onAsk(`All projects in ${empty.lgaLabel}`)} className="rounded-full bg-card px-4 py-2.5 text-[14px] font-semibold shadow-card hover:bg-hairline">
            Try another sector
          </button>
        )}
        <button type="button" onClick={() => onAsk("Which local governments do you cover?")} className="rounded-full bg-card px-4 py-2.5 text-[14px] font-semibold shadow-card hover:bg-hairline">
          Ask about a nearby local government
        </button>
        <span className="inline-flex items-center gap-2 rounded-full bg-card/60 px-4 py-2.5 text-[14px] font-semibold text-muted">
          Report a missing project <PlannedTag />
        </span>
      </div>
    </div>
  );
}
