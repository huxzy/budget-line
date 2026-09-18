/** Vapi tool endpoint types. */
export type ToolArgs = Record<string, unknown>;
export type ToolHandler = (args: ToolArgs) => unknown;

export type ToolName = "projects_by_lga" | "lga_summary" | "project_detail" | "state_coverage";

/** Route each tool posts to, relative to the site root. */
export const TOOL_ROUTES: Record<ToolName, string> = {
  projects_by_lga: "/api/projects",
  lga_summary: "/api/summary",
  project_detail: "/api/project",
  state_coverage: "/api/coverage",
};
