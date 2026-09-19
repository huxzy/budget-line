"use client";

import { useEffect, useState } from "react";
import type { SummaryPayload } from "../types";

/** The LGA's totals, from the same summary tool the assistant uses. */
export function useLgaSummary(lga: string | null, state?: string) {
  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  useEffect(() => {
    if (!lga) return;
    let live = true;
    fetch("/api/summary", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lga, state }) })
      .then((r) => r.json())
      .then((p) => live && p.found && setSummary(p))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [lga, state]);
  return summary;
}
