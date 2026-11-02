import { z } from "zod";
import { aiErrorResponse, generateValidated, geminiGenerator } from "@/lib/ai/llm";
import { guardAiRequest } from "@/lib/apiGuard";
import { errorResponse, HttpError, readJson } from "@/lib/http";
import { editResponseSchemaFor, LlmEditResponseShape } from "@/lib/patch";
import { buildEditUserPrompt, EDIT_SYSTEM_PROMPT } from "@/lib/prompts/edit";
import { DraftProfileSchema } from "@/lib/schema";

/** Current profile + spoken instruction → validated list of edit operations. */

// Up to two model calls (first try + one retry) at ~25s each.
export const maxDuration = 60;

const BodySchema = z.object({
  profile: DraftProfileSchema,
  instruction: z.string().trim().min(2).max(2000),
});

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
  if (!body.success) return Response.json({ error: "Invalid request." }, { status: 400 });
  const { profile, instruction } = body.data;

  try {
    const { data } = await generateValidated({
      generate: geminiGenerator(LlmEditResponseShape),
      system: EDIT_SYSTEM_PROMPT,
      user: buildEditUserPrompt(profile, instruction),
      schema: editResponseSchemaFor(profile),
    });
    // The client applies the ops and shows a diff; nothing is saved until the owner confirms.
    return Response.json({ operations: data.operations });
  } catch (e) {
    return aiErrorResponse(e, "Couldn't understand that change. Please edit it in the form.");
  }
}
