import { notFound } from "next/navigation";
import { BrowseScreen } from "@/modules/browse";
import { loadBrowse } from "@/modules/browse/server";

export const dynamic = "force-dynamic";

export default async function BrowsePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const data = loadBrowse(params.state ?? "", params);
  if (!data) notFound();
  return <BrowseScreen data={data} chatAvailable={Boolean(process.env.VAPI_PRIVATE_KEY)} />;
}
