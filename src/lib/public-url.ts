import type { NextRequest } from "next/server";

// Route handlers run behind Railway's proxy, where `request.url` reflects the
// container's internal binding (e.g. http://localhost:8080) rather than the
// domain the visitor is on. Any absolute URL built from it — most importantly
// post-form 303 redirects — sends the browser to localhost. Resolve the real
// public origin instead: forwarded headers from the proxy first, then the
// configured canonical AUTH_URL, then request.url (correct in local dev,
// where no proxy is involved).
export function publicOrigin(request: NextRequest): string {
  // May be a comma-separated chain when several proxies are involved; the
  // first entry is the client-facing host.
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    return `${proto}://${forwardedHost}`;
  }
  if (process.env.AUTH_URL) return process.env.AUTH_URL;
  return request.url;
}

export function publicUrl(path: string, request: NextRequest): URL {
  return new URL(path, publicOrigin(request));
}
