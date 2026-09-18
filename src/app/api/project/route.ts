/** Vapi tool: project_detail. Logic lives in @/modules/tools. */
import { projectDetail, toolRoute } from "@/modules/tools/server";

export const POST = toolRoute(projectDetail);
