import { AskRedirect } from "@/modules/ask";

/** /ask has no area of its own: go to the saved area, or to the map. */
export default function AskPage() {
  return <AskRedirect />;
}
