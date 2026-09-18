/** Vapi tool: projects_by_lga. Logic lives in @/modules/tools. */
import { projectsByLga, toolRoute } from "@/modules/tools/server";

export const POST = toolRoute(projectsByLga);
