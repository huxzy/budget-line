/**
 * project_detail({ state?, id })
 */
import { getProject } from "@/lib/data";
import { requireLiveState, str, toolRoute } from "@/lib/tools";

export const POST = toolRoute((args) => {
  const st = requireLiveState(args.state);
  if (!st.ok) return st.payload;
  const id = str(args.id);
  const project = getProject(st.state.slug, id);
  if (!project) return { found: false, reason: "unknown_project", id, state: st.state.slug };
  return { found: true, project };
});
