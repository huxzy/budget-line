/** Vapi tool: state_coverage. Logic lives in @/modules/tools. */
import { stateCoverage, toolRoute } from "@/modules/tools/server";

export const POST = toolRoute(stateCoverage);
