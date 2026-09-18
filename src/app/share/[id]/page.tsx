import { notFound } from "next/navigation";
import { getProject, stateOfProjectId } from "@/modules/budget/server";
import { ShareSheet } from "@/modules/share";
import { publicBaseUrl } from "@/modules/voice/server";

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const registry = stateOfProjectId(id);
  const project = registry ? getProject(registry.slug, id) : null;
  if (!project || !registry) notFound();
  return <ShareSheet project={project} registry={registry} publicUrl={publicBaseUrl()} />;
}
