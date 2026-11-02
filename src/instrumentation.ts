import type { Instrumentation } from "next";
import { checkEnv } from "./lib/env";

/** Runs once when the server starts: report config problems in plain words. */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { errors, warnings } = checkEnv(process.env, process.env.NODE_ENV === "production");
  for (const w of warnings) console.warn(`[env] ${w}`);
  for (const e of errors) console.error(`[env] ${e}`);
}

/**
 * Logs every server error as one JSON line, which Vercel's log search (and any
 * log drain like Axiom or Better Stack) can filter and alert on.
 * If ERROR_WEBHOOK_URL is set, errors are also POSTed there (e.g. a Slack or
 * Discord webhook) so someone actually hears about them.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const error = err instanceof Error ? err : new Error(String(err));
  const digest =
    typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined;

  const entry = {
    level: "error",
    message: error.message,
    digest,
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    stack: error.stack?.split("\n").slice(0, 6).join("\n"),
  };
  console.error(JSON.stringify(entry));

  const webhook = process.env.ERROR_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // "content" works for Discord, "text" for Slack.
        body: JSON.stringify({
          text: `VaaniStore error on ${entry.method} ${entry.path}: ${entry.message}`,
          content: `VaaniStore error on ${entry.method} ${entry.path}: ${entry.message}`,
        }),
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      /* never let alerting break the request */
    }
  }
};
