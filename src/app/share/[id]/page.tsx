import { notFound } from "next/navigation";
import { getProject, getState } from "@/modules/budget/server";
import { ShareSheet } from "@/modules/share";
import { publicBaseUrl } from "@/modules/voice/server";

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slug = id.split("-")[0];
  const project = getProject(slug, id);
  const registry = getState(slug);
  if (!project || !registry) notFound();
  return <ShareSheet project={project} registry={registry} publicUrl={publicBaseUrl()} />;
}
