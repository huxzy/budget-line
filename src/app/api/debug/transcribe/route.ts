/**
 * Troubleshooting only: transcribe a short mic clip with OpenAI's speech
 * model, independently of Vapi, so what you said can be compared with what
 * Vapi's transcriber heard. Needs OPENAI_API_KEY. Not linked from the app.
 */
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "OPENAI_API_KEY is not set on the server." }, { status: 503 });
  const form = await req.formData();
  const clip = form.get("clip");
  if (!(clip instanceof Blob) || clip.size === 0) return NextResponse.json({ error: "no clip" }, { status: 400 });
  if (clip.size > 8_000_000) return NextResponse.json({ error: "clip too large" }, { status: 413 });

  const body = new FormData();
  body.append("file", clip, "clip.webm");
  body.append("model", "gpt-4o-transcribe");
  body.append("language", "en");
  body.append("prompt", "Nigerian place names: Bida, Borno, Sokoto, Bauchi, Plateau, Ogun, Anambra, Ebonyi, Niger, Jos, Abeokuta.");
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { authorization: `Bearer ${key}` }, body });
  if (!res.ok) return NextResponse.json({ error: `OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}` }, { status: 502 });
  const data = (await res.json()) as { text?: string };
  // On near-silent clips the model echoes its prompt back; treat that as nothing said.
  const text = (data.text ?? "").trim();
  return NextResponse.json({ text: text.startsWith("Nigerian place names") || text.startsWith("Bida, Borno, Sokoto") ? "" : text });
}
