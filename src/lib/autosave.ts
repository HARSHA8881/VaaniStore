/**
 * Auto-save scheduler for the owner dashboard.
 *
 * - Debounced: waits `delayMs` after the last change before saving.
 * - Latest wins: if more changes arrive while a save is running, only the newest
 *   snapshot is saved next (never a stale one, never two saves at once).
 * - Retries: a failed save is retried with backoff (2s, 5s, 10s) — a shopkeeper on
 *   patchy 3G shouldn't lose a price change.
 * Framework-free so it can be unit-tested with fake timers.
 */

export type SaveStatus =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "saving" }
  | { state: "saved"; at: number }
  | { state: "error"; message: string; willRetry: boolean };

export type AutoSaver<T> = {
  /** Queue the latest version. */
  schedule: (snapshot: T) => void;
  /** Save immediately (e.g. before leaving the page). */
  flush: () => Promise<void>;
  dispose: () => void;
};

const RETRY_DELAYS = [2000, 5000, 10000];

export function createAutoSaver<T>({
  save,
  onStatus,
  delayMs = 1200,
  now = Date.now,
}: {
  save: (snapshot: T) => Promise<void>;
  onStatus: (s: SaveStatus) => void;
  delayMs?: number;
  now?: () => number;
}): AutoSaver<T> {
  let latest: { value: T } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let retries = 0;
  let disposed = false;

  const clear = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  async function run() {
    clear();
    if (running || !latest || disposed) return;
    const snapshot = latest;
    latest = null;
    running = true;
    onStatus({ state: "saving" });
    try {
      await save(snapshot.value);
      retries = 0;
      running = false;
      if (latest) {
        // Changes arrived mid-save: save them next.
        onStatus({ state: "pending" });
        timer = setTimeout(run, delayMs);
      } else {
        onStatus({ state: "saved", at: now() });
      }
    } catch (e) {
      running = false;
      // Keep the failed snapshot unless something newer replaced it.
      latest ??= snapshot;
      const delay = RETRY_DELAYS[retries];
      const willRetry = delay !== undefined;
      onStatus({ state: "error", message: (e as Error).message, willRetry });
      if (willRetry && !disposed) {
        retries++;
        timer = setTimeout(run, delay);
      }
    }
  }

  return {
    schedule(snapshot) {
      if (disposed) return;
      latest = { value: snapshot };
      retries = 0;
      clear();
      onStatus({ state: "pending" });
      if (!running) timer = setTimeout(run, delayMs);
    },
    async flush() {
      await run();
    },
    dispose() {
      disposed = true;
      clear();
    },
  };
}
