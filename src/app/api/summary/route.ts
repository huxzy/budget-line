/** Vapi tool: lga_summary. Logic lives in @/modules/tools. */
import { lgaSummary, toolRoute } from "@/modules/tools/server";

export const POST = toolRoute(lgaSummary);
