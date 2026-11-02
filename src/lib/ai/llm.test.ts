import { ApiError } from "@google/genai";
import { describe, expect, it } from "vitest";
import {
  aiErrorResponse,
  AiBusyError,
  AiNotConfiguredError,
  AiTimeoutError,
  AiValidationError,
  toAiError,
} from "./llm";

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
