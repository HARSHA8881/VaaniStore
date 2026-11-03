import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAutoSaver, type SaveStatus } from "./autosave";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup(save = vi.fn().mockResolvedValue(undefined)) {
  const statuses: SaveStatus["state"][] = [];
  const saver = createAutoSaver<string>({
    save,
    onStatus: (s) => statuses.push(s.state),
    delayMs: 1000,
    now: () => 0,
  });
  return { saver, save, statuses };
}

describe("createAutoSaver", () => {
  it("debounces rapid changes into one save of the latest value", async () => {
    const { saver, save } = setup();
    saver.schedule("a");
    await vi.advanceTimersByTimeAsync(500);
    saver.schedule("ab");
    await vi.advanceTimersByTimeAsync(500);
    saver.schedule("abc");
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("abc");
  });

  it("never runs two saves at once; changes made mid-save are saved next", async () => {
    let finish!: () => void;
    const save = vi
      .fn()
      .mockImplementationOnce(() => new Promise<void>((r) => (finish = r)))
      .mockResolvedValue(undefined);
    const { saver, statuses } = setup(save);
    saver.schedule("v1");
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledTimes(1);

    saver.schedule("v2"); // while v1 is still saving
    await vi.advanceTimersByTimeAsync(5000);
    expect(save).toHaveBeenCalledTimes(1); // still waiting for v1

    finish();
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("v2");
    expect(statuses.at(-1)).toBe("saved");
  });

  it("retries a failed save with backoff, then succeeds", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
    const { saver, statuses } = setup(save);
    saver.schedule("price 290");
    await vi.advanceTimersByTimeAsync(1000);
    expect(statuses).toContain("error");
    await vi.advanceTimersByTimeAsync(2000);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("price 290");
    expect(statuses.at(-1)).toBe("saved");
  });

  it("stops retrying after three attempts", async () => {
    const save = vi.fn().mockRejectedValue(new Error("down"));
    const statuses: SaveStatus[] = [];
    const saver = createAutoSaver<string>({ save, onStatus: (s) => statuses.push(s), delayMs: 10 });
    saver.schedule("x");
    await vi.advanceTimersByTimeAsync(10 + 2000 + 5000 + 10000 + 50000);
    expect(save).toHaveBeenCalledTimes(4);
    expect(statuses.at(-1)).toEqual({ state: "error", message: "down", willRetry: false });
  });

  it("flush saves immediately", async () => {
    const { saver, save } = setup();
    saver.schedule("now");
    await saver.flush();
    expect(save).toHaveBeenCalledWith("now");
  });
});
