import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SourceViewer } from "@/modules/source";
import { loadSourcePage } from "@/modules/source/server";

type Params = { state: string; page: string };

export default async function SourcePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ row?: string }>;
}) {
  const { state, page } = await params;
  const { row } = await searchParams;
  const data = loadSourcePage(state, Number(page), row);
  if (!data) notFound();
  return (
    <Suspense>
      <SourceViewer data={data} />
    </Suspense>
  );
}
