import { aiErrorResponse, generateValidated, geminiGenerator } from "@/lib/ai/llm";
import { guardAiRequest } from "@/lib/apiGuard";
import { SCAN_SYSTEM_PROMPT, SCAN_USER_PROMPT } from "@/lib/prompts/scan";
import { ScanAnswerSchema, ScanResponseShape } from "@/lib/scan";

/** Photo of a price list → [{ name, priceInr?, unit? }]. Nothing is saved here. */

export const maxDuration = 60;

// The client resizes photos to ~1600px JPEG (< 1.5 MB); this cap is the server guarantee.
const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const blocked = await guardAiRequest(request);
  if (blocked) return blocked;

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BYTES + 64 * 1024) {
    return Response.json({ error: "Photo is too large." }, { status: 413 });
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected a photo." }, { status: 400 });
  }
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "No photo received." }, { status: 400 });
  }
  if (file.size > MAX_BYTES)
    return Response.json({ error: "Photo is too large." }, { status: 413 });
  if (!TYPES.has(file.type)) {
    return Response.json({ error: "Please use a JPG, PNG or WebP photo." }, { status: 415 });
  }

  try {
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    const { data: result } = await generateValidated({
      generate: geminiGenerator(ScanResponseShape),
      system: SCAN_SYSTEM_PROMPT,
      user: SCAN_USER_PROMPT,
      images: [{ mimeType: file.type, data }],
      schema: ScanAnswerSchema,
    });
    return Response.json({ products: result.products });
  } catch (e) {
    return aiErrorResponse(e, "Couldn't read that photo. Try a clearer, straight-on picture.");
  }
}
