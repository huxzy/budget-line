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

export function firstMessageFor(ctx: CallContext): string {
  const place = ctx.lgaLabel?.replace(/ LGA$/, "");
  if (place) return `This is Budget Line. Ask me what has been budgeted in ${place}.`;
  if (ctx.state) return `This is Budget Line. Which local government in ${ctx.state.name} State do you want to ask about?`;
  return "This is Budget Line. Which state or local government do you want to ask about?";
}
