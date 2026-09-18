import { formatCompact } from "@/modules/budget";
import type { ToolResult } from "@/modules/voice";
import type { MissPayload, ProjectsPayload, SummaryPayload, Turn } from "../types";

const SECTOR_LABEL: Record<string, string> = {
  health: "Health",
  "roads and works": "Roads and works",
  education: "Education",
  water: "Water",
  agriculture: "Agriculture",
  other: "Other",
};

export function sectorLabel(s: string | null | undefined) {
  return s ? (SECTOR_LABEL[s] ?? s) : null;
}

export function isProjects(p: unknown): p is ProjectsPayload {
  return !!p && typeof p === "object" && (p as ProjectsPayload).found === true && Array.isArray((p as ProjectsPayload).projects);
}
export function isSummary(p: unknown): p is SummaryPayload {
  return !!p && typeof p === "object" && (p as SummaryPayload).found === true && Array.isArray((p as SummaryPayload).bySector);
}
export function isMiss(p: unknown): p is MissPayload {
  return !!p && typeof p === "object" && (p as MissPayload).found === false;
}

const NUMBER_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
export function countWord(n: number) {
  return n <= 10 ? NUMBER_WORDS[n] : String(n);
}

/** A rail line for one tool result: "Bida · 41 projects, ₦37.2bn". */
export function toTurn(r: ToolResult, id: number): Turn {
  const p = r.payload;
  if (isSummary(p)) {
    return { id, tool: r.name, label: p.lgaLabel.replace(/ LGA$/, ""), detail: `${p.projects} projects, ${formatCompact(p.total)}`, payload: p };
  }
  if (isProjects(p)) {
    const shown = p.projects.reduce((s, x) => s + x.approved2026, 0);
    const what = [sectorLabel(p.sector), p.unspentOnly ? "approved but unspent" : null].filter(Boolean).join(" · ");
    return {
      id,
      tool: r.name,
      label: what || p.lgaLabel.replace(/ LGA$/, ""),
      detail: p.total === 0 ? "No match in this document" : `${countWord(p.total)} project${p.total === 1 ? "" : "s"} · ${formatCompact(shown)}${p.total > p.returned ? ` in the top ${p.returned}` : ""}`,
      payload: p,
    };
  }
  if (isMiss(p)) {
    const label =
      p.reason === "unknown_lga" ? `"${p.query ?? ""}"` : p.reason === "not_live" ? (typeof p.state === "string" ? p.state : (p.state?.name ?? "That state")) : "Not found";
    const detail = p.reason === "unknown_lga" ? "Not a local government we recognise" : p.reason === "not_live" ? "Not covered yet" : "Not found";
    return { id, tool: r.name, label, detail, payload: p };
  }
  return { id, tool: r.name, label: r.name.replace(/_/g, " "), detail: "", payload: p };
}
