import crypto from "node:crypto";

/**
 * GitHub App helpers for accessing sellers' private repos.
 *
 * Sellers install our GitHub App on the specific repo(s) they sell; we store
 * only their installation id. To read a repo we mint a short-lived installation
 * access token on demand from the app's private key — so no long-lived,
 * broadly-scoped credential is ever stored in our database.
 *
 * Required env:
 *   GITHUB_APP_ID           – the App's numeric id
 *   GITHUB_APP_PRIVATE_KEY  – the App's private key PEM (literal \n allowed)
 *   GITHUB_APP_SLUG         – the App's slug, for building the install URL
 */

const API = "https://api.github.com";
const UA = "dev-marketplace";

export function githubAppConfigured(): boolean {
  return !!(process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY);
}

/** URL where a seller installs (or manages) the app on their repos. */
export function githubInstallUrl(): string | null {
  const slug = process.env.GITHUB_APP_SLUG;
  return slug ? `https://github.com/apps/${slug}/installations/new` : null;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

/** A short-lived JWT identifying the app itself (used to mint install tokens). */
function appJwt(): string {
  const key = (process.env.GITHUB_APP_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({ iat: now - 60, exp: now + 9 * 60, iss: process.env.GITHUB_APP_ID })
  );
  const data = `${header}.${payload}`;
  const signature = crypto.createSign("RSA-SHA256").update(data).sign(key, "base64url");
  return `${data}.${signature}`;
}

/**
 * Mint a short-lived installation access token for a seller's installation.
 * Returns null if the app isn't configured or GitHub rejects the request.
 */
export async function getInstallationToken(installationId: string): Promise<string | null> {
  if (!githubAppConfigured()) return null;
  try {
    const res = await fetch(`${API}/app/installations/${installationId}/access_tokens`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appJwt()}`,
        Accept: "application/vnd.github+json",
        "User-Agent": UA,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string };
    return data.token ?? null;
  } catch {
    return null;
  }
}

/**
 * Look up which installation account (org/user login) an installation belongs
 * to — used to confirm and display the connection after a seller installs.
 */
export async function getInstallationAccount(installationId: string): Promise<string | null> {
  if (!githubAppConfigured()) return null;
  try {
    const res = await fetch(`${API}/app/installations/${installationId}`, {
      headers: {
        Authorization: `Bearer ${appJwt()}`,
        Accept: "application/vnd.github+json",
        "User-Agent": UA,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { account?: { login?: string } };
    return data.account?.login ?? null;
  } catch {
    return null;
  }
}
