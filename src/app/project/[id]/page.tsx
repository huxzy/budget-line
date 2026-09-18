import { notFound } from "next/navigation";
import { getProject, getState } from "@/modules/budget/server";
import { ProjectDetail } from "@/modules/project";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slug = id.split("-")[0];
  const project = getProject(slug, id);
  const registry = getState(slug);
  if (!project || !registry) notFound();
  return <ProjectDetail project={project} registry={registry} />;
}
