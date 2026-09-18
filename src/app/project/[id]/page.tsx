import { notFound } from "next/navigation";
import { getProject, stateOfProjectId } from "@/modules/budget/server";
import { ProjectDetail } from "@/modules/project";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const registry = stateOfProjectId(id);
  const project = registry ? getProject(registry.slug, id) : null;
  if (!project || !registry) notFound();
  return <ProjectDetail project={project} registry={registry} />;
}
