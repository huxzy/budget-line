import type { CallContext, Coverage } from "../types";

/** The prompt variables for one conversation, from what the screen knows. Pure; client-safe. */
export function variablesFor(ctx: CallContext, coverage: Coverage, channel: "voice" | "chat"): Record<string, string> {
  const place = ctx.lgaLabel?.replace(/ LGA$/, "");
  const st = ctx.state;
  return {
    lga: ctx.lga ?? "none",
    lgaLabel: place ?? "none",
    stateName: st?.name ?? "any",
    stateScope: st ? `${st.name} State` : `${coverage.stateCount} states: ${coverage.coveredStates}`,
    coveredStates: coverage.coveredStates,
    documentName: st?.document ?? coverage.documentName,
    documentPages: String(st?.pages ?? coverage.documentPages),
    projectCount: (st?.projects ?? coverage.projectCount).toLocaleString("en-NG"),
    channelNote:
      channel === "chat"
        ? "This conversation is a text chat, not a voice call. Write each amount as its `display` field (for example ₦75,000,000) instead of the spoken words, and keep to a few short sentences."
        : "",
  };
}

/**
 * The opening line narrows one step at a time: the Nigeria view asks for a
 * state, a state page asks for a local government with three real examples,
 * an area page invites the question. A short list of options is much easier
 * to hear than an open question.
 */
export function firstMessageFor(ctx: CallContext, coverage: Coverage): string {
  const place = ctx.lgaLabel?.replace(/ LGA$/, "");
  if (place) {
    const sectors = ctx.sectors?.length ? listOf(ctx.sectors) : "health, roads, or education";
    return `This is Budget Line. For ${place}, do you want ${sectors} — or the biggest projects overall?`;
  }
  if (ctx.state) {
    const eg = ctx.examples?.length ? ` Say, for example, ${listOf(ctx.examples.map((n) => `${n} local government`))}.` : "";
    return `This is Budget Line. Which local government in ${ctx.state.name} State do you want to ask about?${eg}`;
  }
  return `This is Budget Line. Which state do you want to ask about? I have ${coverage.coveredStates}. Say, for example, Niger State.`;
}

function listOf(names: string[]): string {
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}` : (names[0] ?? "");
}
