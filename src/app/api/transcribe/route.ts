import { guardAiRequest } from "@/lib/apiGuard";

/**
 * Audio → text using Groq's hosted Whisper. This is the FALLBACK path, used only
 * when the browser has no Web Speech API (Firefox, some Android browsers).
 */

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_SECONDS = 120; // 2 minutes (+ small grace below for encoder padding)
// Upload + Whisper on up to 2 minutes of audio.
export const maxDuration = 45;

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export async function POST(request: Request) {
  const blocked = await guardAiRequest(request);
  if (blocked) return blocked;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Speech-to-text is not configured on the server." },
      { status: 503 },
    );
  }

  // Reject big uploads before reading the body into memory.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES + 64 * 1024) return tooLarge();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "No audio file received." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return tooLarge();
  if (!file.type.startsWith("audio/") && !file.type.startsWith("video/webm")) {
    return Response.json({ error: "File must be audio." }, { status: 415 });
  }

  const language = form.get("language") === "hi" ? "hi" : "en";

  const upstream = new FormData();
  upstream.set("file", file, file.name || "audio.webm");
  upstream.set("model", "whisper-large-v3");
  upstream.set("language", language);
  // verbose_json includes `duration`, which lets us enforce the 2-minute limit.
  upstream.set("response_format", "verbose_json");
  upstream.set("temperature", "0");

  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return Response.json({ error: "Speech service did not respond." }, { status: 504 });
  }

  if (res.status === 429) {
    return Response.json(
      { error: "Speech service is busy. Please try again in a minute." },
      { status: 503, headers: { "Retry-After": "60" } },
    );
  }
  if (!res.ok) {
    console.error("Groq transcription failed", res.status, await res.text().catch(() => ""));
    return Response.json({ error: "Could not transcribe audio." }, { status: 502 });
  }

  const data = (await res.json()) as { text?: string; duration?: number };
  // The client also stops at 2 minutes; this is the server-side guarantee.
  if (data.duration !== undefined && data.duration > MAX_SECONDS + 5) {
    return Response.json({ error: "Recording is longer than 2 minutes." }, { status: 413 });
  }

  const text = (data.text ?? "").trim();
  if (!text) return Response.json({ error: "No speech detected." }, { status: 422 });
  return Response.json({ text });
}

function tooLarge() {
  return Response.json({ error: "Audio file is larger than 10 MB." }, { status: 413 });
}
