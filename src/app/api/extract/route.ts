import { z } from "zod";
import { aiErrorResponse, geminiGenerator } from "@/lib/ai/llm";
import { guardAiRequest } from "@/lib/apiGuard";
import { extractShopProfile, LlmExtractSchema } from "@/lib/extract";
import { errorResponse, HttpError, readJson } from "@/lib/http";

/** Transcript → { profile (partial), missing[] }. */

// Up to two model calls (first try + one retry) at ~25s each.
export const maxDuration = 60;

const BodySchema = z.object({ transcript: z.string().trim().min(3).max(8000) });

export async function POST(request: Request) {
  const blocked = await guardAiRequest(request);
  if (blocked) return blocked;

  let raw: unknown;
  try {
    raw = await readJson(request);
  } catch (e) {
    if (e instanceof HttpError) return errorResponse(e);
    throw e;
  }
  const body = BodySchema.safeParse(raw);
  if (!body.success) {
    return Response.json(
      { error: "Please say or type a few words about your shop." },
      { status: 400 },
    );
  }

  try {
    const started = Date.now();
    const result = await extractShopProfile(
      body.data.transcript,
      geminiGenerator(LlmExtractSchema),
    );
    return Response.json({ ...result, latencyMs: Date.now() - started });
  } catch (e) {
    return aiErrorResponse(e, "We couldn't understand that fully. Please fill in the details.");
  }
}
