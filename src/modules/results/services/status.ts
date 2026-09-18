import type { Project } from "@/modules/budget";

export type SpendStatus =
  | { kind: "unspent"; ratio: 0; line: string; short: string }
  | { kind: "partial"; ratio: number; line: string; short: string }
  | { kind: "spent"; ratio: number; line: string; short: string }
  | { kind: "no-record"; ratio: 0; line: string; short: string };

/**
 * What the 2025 columns say about a project, in fixed, factual wording.
 * Never "abandoned", never a reason — the document does not give one.
 */
export function spendStatus(p: Project): SpendStatus {
  const again = p.approved2026 > 0 ? "Approved again for 2026." : "Nothing approved for 2026.";
  if (p.approved2025 === 0 && p.spent2025 === 0) {
    return {
      kind: "no-record",
      ratio: 0,
      line: p.approved2026 > 0 ? "No 2025 record in this document. First approved for 2026." : "No 2025 record in this document.",
      short: p.approved2026 > 0 ? "First approved 2026" : "No 2025 record",
    };
  }
  if (p.unspent2025) {
    return { kind: "unspent", ratio: 0, line: `Approved last year, none of it spent. ${again}`, short: "₦0 spent" };
  }
  const ratio = p.approved2025 > 0 ? Math.min(1, p.spent2025 / p.approved2025) : 1;
  const pct = Math.round(ratio * 100);
  if (ratio >= 1) {
    return { kind: "spent", ratio, line: `Approved last year and fully spent by September. ${again}`, short: "Fully spent" };
  }
  return {
    kind: "partial",
    ratio,
    line: `${pct}% of last year's approval was spent by September. ${again}`,
    short: `${pct}% spent`,
  };
}
