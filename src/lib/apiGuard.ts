import { assertSameOrigin, errorResponse, HttpError } from "./http";
import { aiQuota, clientIp, tooManyRequests } from "./rateLimit";

/**
 * Runs before every AI route: same-origin check, then rate limits / budget.
 * Returns a Response to send back if the request should stop, else null.
 */
export async function guardAiRequest(request: Request): Promise<Response | null> {
  try {
    assertSameOrigin(request);
  } catch (e) {
    if (e instanceof HttpError) return errorResponse(e);
    throw e;
  }
  const quota = await aiQuota()(clientIp(request));
  if (!quota.ok) return tooManyRequests(quota.retryAfterSeconds, quota.scope);
  return null;
}
