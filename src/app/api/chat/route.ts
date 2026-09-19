/** Text chat: the same assistant and tools as the call, through Vapi's Chat API. */
import { NextResponse } from "next/server";
import { sendChat } from "@/modules/chat/server";

export async function POST(req: Request) {
  let body: { input?: string; previousChatId?: string; state?: string; lga?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const input = (body.input ?? "").trim().slice(0, 500);
  if (!input) return NextResponse.json({ error: "Say what you want to know." }, { status: 400 });
  try {
    return NextResponse.json(await sendChat({ input, previousChatId: body.previousChatId, state: body.state, lga: body.lga }));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Chat failed" }, { status: 502 });
  }
}
