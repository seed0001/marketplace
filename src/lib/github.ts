const NAME = /^[A-Za-z0-9._-]+$/;

export type GithubRepo = { owner: string; repo: string; ref?: string };

/**
 * Parse a GitHub repo URL into its owner/repo (and optional branch/tag).
 *
 * Returns null for anything that isn't a github.com repo URL. Reconstructing
 * the archive URL ourselves from these validated parts (rather than fetching a
 * user-supplied URL directly) is what keeps the download proxy SSRF-safe.
 *
 * Accepts, e.g.:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   https://github.com/owner/repo/tree/some-branch
 *   github.com/owner/repo
 */
export function parseGithubRepo(input: unknown): GithubRepo | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");
  if (!NAME.test(owner) || !NAME.test(repo)) return null;

  // Optional /tree/<ref> (a ref can contain slashes, e.g. feature/x)
  let ref: string | undefined;
  if (parts[2] === "tree" && parts.length > 3) {
    ref = parts.slice(3).join("/");
    if (![...ref].every((c) => /[A-Za-z0-9._/-]/.test(c))) return null;
  }

  return ref ? { owner, repo, ref } : { owner, repo };
}

/**
 * Normalize a seller-provided GitHub URL to a canonical `owner/repo` link, or
 * null if it isn't a valid GitHub repo URL. Used to sanitize what we store.
 */
export function normalizeGithubUrl(input: unknown): string | null {
  const parsed = parseGithubRepo(input);
  if (!parsed) return null;
  const base = `https://github.com/${parsed.owner}/${parsed.repo}`;
  return parsed.ref ? `${base}/tree/${parsed.ref}` : base;
}

/**
 * GitHub's zipball endpoint for a repo. It responds with a redirect to the
 * archive of the given ref (or the default branch when omitted); `fetch`
 * follows the redirect automatically.
 */
export function githubZipUrl({ owner, repo, ref }: GithubRepo): string {
  const base = `https://api.github.com/repos/${owner}/${repo}/zipball`;
  return ref ? `${base}/${ref.split("/").map(encodeURIComponent).join("/")}` : base;
}
