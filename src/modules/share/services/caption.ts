import type { Project, StateSummary } from "@/modules/budget";
import { formatNaira } from "@/modules/budget";
import { spendStatus } from "@/modules/results";

/** The caption sent with the image. Every clause comes from the row. */
export function shareCaption(p: Project, registry: StateSummary, url?: string): string {
  const s = spendStatus(p);
  const place = p.lgaLabel.replace(/ LGA$/, "");
  const parts = [`${p.display} is approved for "${p.project}" (${place}) in the ${registry.document}.`];
  if (s.kind === "unspent") parts.push(`${formatNaira(p.approved2025).display} was approved for it in 2025 and nothing was recorded as spent by September.`);
  else if (s.kind === "no-record") parts.push("It has no 2025 record in this document.");
  parts.push(`Page ${p.page} of ${registry.pages}.`);
  if (url) parts.push(url);
  return parts.join(" ");
}
