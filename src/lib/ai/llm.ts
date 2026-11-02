import { ApiError, GoogleGenAI, type ThinkingLevel } from "@google/genai";
import { z } from "zod";

/**
 * A "generate" function takes a prompt and returns raw model text.
 * Everything AI-related depends on this type, not on Gemini directly, so tests and
 * the eval can swap in a fake model and we could change providers in one place.
 */
/** An image sent alongside the prompt (base64, no data: prefix). */
export type InlineImage = { mimeType: string; data: string };
export type GenerateJson = (args: {
  system: string;
  user: string;
  images?: InlineImage[];
}) => Promise<string>;

export class AiNotConfiguredError extends Error {}

/** Provider is rate-limiting us or overloaded (HTTP 429/503) — worth retrying later. */
export class AiBusyError extends Error {}

/** The model didn't answer in time. */
export class AiTimeoutError extends Error {}

export class AiValidationError extends Error {
  constructor(
    message: string,
    public readonly lastOutput: string,
  ) {
    super(message);
  }
}

/**
 * Zod → JSON Schema for Gemini's structured output. We drop keywords Gemini may
 * reject (regex patterns, string lengths). That's safe because Zod still checks
 * them afterwards, and a failure triggers the retry with the exact error.
 */
const UNSUPPORTED_KEYS = new Set([
  "$schema",
  "additionalProperties",
  "pattern",
  "minLength",
  "maxLength",
]);
export function toGeminiSchema(schema: z.ZodType): unknown {
  const json = z.toJSONSchema(schema);
  const strip = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(strip);
    if (node && typeof node === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node)) {
        if (UNSUPPORTED_KEYS.has(k)) continue;
        out[k] = strip(v);
      }
      return out;
    }
    return node;
  };
  return strip(json);
}

/** Defaults chosen by measurement (see README): fast, accurate, and a fixed version. */
export const DEFAULT_MODEL = "gemini-3.5-flash";
export const DEFAULT_FALLBACK_MODEL = "gemini-3.5-flash-lite";

/**
 * Real Gemini call with JSON response mode.
 *  - Model names are configurable because Google renames/retires them often.
 *  - "Thinking" is kept minimal: extraction doesn't need reasoning, and thinking
 *    made calls 10x slower in testing.
 *  - If the main model is busy (429/503) or slow, we retry once on a lighter
 *    fallback model, so an owner doesn't see an error during a demand spike.
 */
export function geminiGenerator(responseSchema: z.ZodType): GenerateJson {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AiNotConfiguredError("GEMINI_API_KEY is not set");
  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const fallback = process.env.GEMINI_FALLBACK_MODEL ?? DEFAULT_FALLBACK_MODEL;
  const thinking = process.env.GEMINI_THINKING || "minimal";
  const jsonSchema = toGeminiSchema(responseSchema);

  const call =
    (name: string, timeoutMs: number, withThinking: boolean) =>
    async (args: { system: string; user: string; images?: InlineImage[] }) => {
      try {
        const res = await ai.models.generateContent({
          model: name,
          contents: args.images?.length
            ? [
                {
                  role: "user",
                  parts: [
                    ...args.images.map((inlineData) => ({ inlineData })),
                    { text: args.user },
                  ],
                },
              ]
            : args.user,
          config: {
            systemInstruction: args.system,
            responseMimeType: "application/json",
            responseJsonSchema: jsonSchema,
            // Low temperature: we want faithful extraction, not creativity.
            temperature: 0.1,
            ...(withThinking &&
              thinking !== "off" && {
                thinkingConfig: { thinkingLevel: thinking.toUpperCase() as ThinkingLevel },
              }),
            abortSignal: AbortSignal.timeout(timeoutMs),
          },
        });
        return res.text ?? "";
      } catch (e) {
        throw toAiError(e);
      }
    };

  const primary = call(model, 15_000, true);
  return fallback ? withFallback(primary, call(fallback, 15_000, false)) : primary;
}

/** Try `primary`; if the provider is busy or times out, try `fallback` once. */
export function withFallback(primary: GenerateJson, fallback: GenerateJson): GenerateJson {
  return async (args) => {
    try {
      return await primary(args);
    } catch (e) {
      if (e instanceof AiBusyError || e instanceof AiTimeoutError) {
        console.warn(
          "primary AI model unavailable, using fallback:",
          (e as Error).message.slice(0, 120),
        );
        return fallback(args);
      }
      throw e;
    }
  };
}

/** Translate SDK/network errors into our error types so routes can answer clearly. */
export function toAiError(e: unknown): unknown {
  if (e instanceof ApiError && (e.status === 429 || e.status === 503)) {
    return new AiBusyError(e.message);
  }
  if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
    return new AiTimeoutError(e.message);
  }
  return e;
}

/** Shared mapping from AI errors to HTTP responses for all AI routes. */
export function aiErrorResponse(e: unknown, validationMessage: string): Response {
  if (e instanceof AiNotConfiguredError) {
    return Response.json({ error: "AI is not configured on the server." }, { status: 503 });
  }
  if (e instanceof AiBusyError) {
    return Response.json(
      { error: "The AI service is busy. Please try again in a minute." },
      { status: 503, headers: { "Retry-After": "60" } },
    );
  }
  if (e instanceof AiTimeoutError) {
    return Response.json({ error: "The AI took too long. Please try again." }, { status: 504 });
  }
  if (e instanceof AiValidationError) {
    // Client shows the manual form so the owner is never stuck.
    return Response.json({ error: validationMessage, manual: true }, { status: 422 });
  }
  console.error("AI request failed", e);
  return Response.json({ error: "AI service error. Please try again." }, { status: 502 });
}

/**
 * Call the model, parse JSON, validate with Zod. If validation fails, retry ONCE
 * with the exact Zod error appended so the model can fix its own mistake.
 * A second failure throws — the UI then falls back to the manual edit form.
 */
export async function generateValidated<T>({
  generate,
  system,
  user,
  schema,
  images,
}: {
  generate: GenerateJson;
  system: string;
  user: string;
  schema: z.ZodType<T>;
  images?: InlineImage[];
}): Promise<{ data: T; attempts: number }> {
  let prompt = user;
  let lastOutput = "";
  let lastError = "";

  for (let attempt = 1; attempt <= 2; attempt++) {
    lastOutput = await generate({ system, user: prompt, images });
    const parsed = safeJsonParse(lastOutput);
    const result = parsed.ok
      ? schema.safeParse(parsed.value)
      : ({ success: false, error: parsed.error } as const);

    if (result.success) return { data: result.data, attempts: attempt };

    lastError =
      result.error instanceof z.ZodError ? z.prettifyError(result.error) : String(result.error);
    prompt = `${user}

Your previous answer was invalid:
${lastOutput.slice(0, 4000)}

Validation error:
${lastError}

Return corrected JSON only.`;
  }

  throw new AiValidationError(`AI output failed validation twice: ${lastError}`, lastOutput);
}

function safeJsonParse(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    // Some models wrap JSON in ```json fences even in JSON mode; strip them defensively.
    const cleaned = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
    return { ok: true, value: JSON.parse(cleaned) };
  } catch (e) {
    return { ok: false, error: `Not valid JSON: ${(e as Error).message}` };
  }
}
