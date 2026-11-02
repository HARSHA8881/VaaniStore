import { ApiError } from "@google/genai";
import { describe, expect, it, vi } from "vitest";
import {
  aiErrorResponse,
  AiBusyError,
  AiNotConfiguredError,
  AiTimeoutError,
  AiValidationError,
  toAiError,
  withFallback,
} from "./llm";

describe("withFallback", () => {
  const args = { system: "s", user: "u" };

  it("uses the primary model when it answers", async () => {
    const fallback = vi.fn();
    const gen = withFallback(vi.fn().mockResolvedValue("primary"), fallback);
    await expect(gen(args)).resolves.toBe("primary");
    expect(fallback).not.toHaveBeenCalled();
  });

  it.each([new AiBusyError("503"), new AiTimeoutError("slow")])(
    "switches to the fallback when the primary is %o",
    async (error) => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const gen = withFallback(
        vi.fn().mockRejectedValue(error),
        vi.fn().mockResolvedValue("fallback"),
      );
      await expect(gen(args)).resolves.toBe("fallback");
    },
  );

  it("does not hide real errors (e.g. a bad API key)", async () => {
    const fallback = vi.fn();
    const gen = withFallback(vi.fn().mockRejectedValue(new Error("bad key")), fallback);
    await expect(gen(args)).rejects.toThrow("bad key");
    expect(fallback).not.toHaveBeenCalled();
  });
});

describe("toAiError", () => {
  it("treats provider 429/503 as busy", () => {
    expect(toAiError(new ApiError({ message: "quota", status: 429 }))).toBeInstanceOf(AiBusyError);
    expect(toAiError(new ApiError({ message: "overloaded", status: 503 }))).toBeInstanceOf(
      AiBusyError,
    );
  });

  it("treats abort/timeouts as timeouts", () => {
    const e = new Error("timed out");
    e.name = "TimeoutError";
    expect(toAiError(e)).toBeInstanceOf(AiTimeoutError);
  });

  it("passes other errors through", () => {
    const e = new ApiError({ message: "bad key", status: 400 });
    expect(toAiError(e)).toBe(e);
  });
});

describe("aiErrorResponse", () => {
  it.each([
    [new AiNotConfiguredError(), 503],
    [new AiBusyError(), 503],
    [new AiTimeoutError(), 504],
    [new AiValidationError("x", ""), 422],
  ])("%o → %i", (error, status) => {
    expect(aiErrorResponse(error, "msg").status).toBe(status);
  });

  it("asks the client to show the manual form on validation failure", async () => {
    const body = await aiErrorResponse(new AiValidationError("x", ""), "Fill it in").json();
    expect(body).toEqual({ error: "Fill it in", manual: true });
  });
});
