/**
 * Small guards shared by API routes.
 */

/** JSON bodies we accept are small (a profile is a few KB). */
export const MAX_JSON_BYTES = 64 * 1024;

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Reject requests a browser sent from another website. Our API routes are only
 * meant for our own pages; without this, any site could make a logged-in owner's
 * browser save changes (CSRF) or spend our AI quota.
 * Non-browser clients (curl, server-to-server) send no Origin and carry no
 * session cookie, so they're still subject to auth and rate limits.
 */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, "Bad origin.");
  }
  if (!host || originHost !== host) throw new HttpError(403, "Cross-site request blocked.");
}

/** Parse a JSON body with a size cap. Throws HttpError on oversize or invalid JSON. */
export async function readJson(request: Request, maxBytes = MAX_JSON_BYTES): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new HttpError(413, "Request is too large.");
  const text = await request.text();
  // content-length can be missing (chunked), so check the real size too.
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new HttpError(413, "Request is too large.");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
}

export function errorResponse(e: HttpError) {
  return Response.json({ error: e.message }, { status: e.status });
}
