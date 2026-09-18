import type { StarterQuestion } from "../types";

/** Starter questions for a chosen place. Each is a real question the tools can answer. */
export function startersFor(place: string | null): StarterQuestion[] {
  if (!place) return [{ text: "Which local governments do you cover?" }];
  return [
    { text: `What wasn't spent last year in ${place}?` },
    { text: `Health projects in ${place}` },
    { text: `Biggest project in ${place}` },
  ];
}
