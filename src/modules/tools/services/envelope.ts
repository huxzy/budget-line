/**
 * Shared plumbing for the four Vapi tool endpoints.
 *
 * Each route accepts two body shapes:
 *   1. Vapi's tool-calls envelope:
 *        { message: { type: "tool-calls", toolCallList: [
 *            { id, type: "function", function: { name, arguments: "<json string>" } } ] } }
 *      → { results: [{ toolCallId, name, result: "<json string>" }] }
 *      (Some docs show a flat { id, name, arguments }; both are accepted.)
 *   2. Plain JSON arguments (for curl and the UI) → the payload itself.
 *
 * Handlers never throw for bad input; they return a structured `found: false`
 * so the assistant can say "not found" instead of the call failing.
 */
import { NextResponse } from "next/server";
import { getState, getStates, resolveState, type StateSummary } from "@/modules/budget/server";

import type { ToolArgs as Args, ToolHandler as Handler } from "../types";

type VapiToolCall = {
  id: string;
  name?: string;
  arguments?: Args | string;
  function?: { name: string; arguments: Args | string };
};

type VapiEnvelope = {
  message?: { type?: string; toolCallList?: VapiToolCall[] };
};

function parseArgs(a: Args | string): Args {
  if (typeof a === "string") {
    try {
      return JSON.parse(a);
    } catch {
      return {};
    }
  }
  return a ?? {};
}

export function toolRoute(handler: Handler) {
  return async (req: Request) => {
    let body: VapiEnvelope & Args = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const calls = body.message?.toolCallList;
    if (body.message?.type === "tool-calls" && Array.isArray(calls)) {
      const results = calls.map((call) => {
        const name = call.function?.name ?? call.name ?? "";
        const args = parseArgs(call.function?.arguments ?? call.arguments ?? {});
        if (process.env.NODE_ENV !== "production") console.log(`[tool] ${name}`, JSON.stringify(args));
        return { toolCallId: call.id, name, result: JSON.stringify(handler(args)) };
      });
      return NextResponse.json({ results });
    }

    return NextResponse.json(handler(body));
  };
}

export function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function bool(v: unknown): boolean {
  return v === true || v === "true";
}

export function int(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : parseInt(str(v), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** The registry rows a "not covered" answer should name. */
export function liveStates(): StateSummary[] {
  return getStates().filter((s) => s.status === "live");
}

export type StateResolution =
  | { ok: true; state: StateSummary }
  | { ok: false; payload: { found: false; reason: "unknown_state" | "not_live"; query: string; state?: StateSummary; covered: StateSummary[] } };

/**
 * Resolve a spoken state name. With nothing given, the first live state is
 * used; handlers that take an LGA search every live state instead.
 */
export function requireLiveState(input: unknown): StateResolution {
  const query = str(input);
  const state = query ? resolveState(query) : (liveStates()[0] ?? getState("niger"));
  if (!state) return { ok: false, payload: { found: false, reason: "unknown_state", query, covered: liveStates() } };
  if (state.status !== "live") {
    return { ok: false, payload: { found: false, reason: "not_live", query, state, covered: liveStates() } };
  }
  return { ok: true, state };
}
