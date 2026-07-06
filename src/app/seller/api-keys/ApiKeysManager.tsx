"use client";

import { useState } from "react";

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

// Copy text to the clipboard, returning whether it succeeded. Prefers the
// async Clipboard API, which browsers only expose in a secure context (HTTPS
// or localhost). On a plain-HTTP origin — e.g. an app reached by bare IP —
// that API is unavailable, so fall back to a hidden-textarea execCommand copy
// that works without a secure context or any browser launch flags.
async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path below
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function ApiKeysManager({ initialKeys, apiBase }: { initialKeys: ApiKey[]; apiBase: string }) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [freshToken, setFreshToken] = useState<{ token: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createKey(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    setFreshToken(null);
    try {
      const response = await fetch("/api/seller/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create the key.");
      const { token, ...meta } = data as ApiKey & { token: string };
      setKeys((current) => [meta, ...current]);
      setFreshTokenSafe({ token, name: meta.name });
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the key.");
    } finally {
      setCreating(false);
    }
  }

  // Small helper so the "reveal once" panel and copied-state reset together.
  function setFreshTokenSafe(value: { token: string; name: string }) {
    setFreshToken(value);
    setCopied(false);
  }

  async function revokeKey(id: string) {
    if (!confirm("Revoke this key? Any app or agent using it will immediately lose access.")) return;
    setRevoking(id);
    setError(null);
    try {
      const response = await fetch(`/api/seller/api-keys/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not revoke the key.");
      }
      setKeys((current) => current.filter((key) => key.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke the key.");
    } finally {
      setRevoking(null);
    }
  }

  async function copyToken() {
    if (!freshToken) return;
    setCopied(await copyText(freshToken.token));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[.07] bg-white/[.025] p-5">
        <h2 className="text-sm font-semibold">Generate a key</h2>
        <p className="mt-0.5 text-[11px] leading-5 text-zinc-500">
          Name it after the app or agent that will use it, so you can revoke exactly that one later.
        </p>
        <form onSubmit={createKey} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
            required
            placeholder="e.g. Local inventory agent"
            className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-emerald-400/50"
          />
          <button
            disabled={creating || !name.trim()}
            className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-40"
          >
            {creating ? "Generating…" : "Generate key"}
          </button>
        </form>
      </section>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/[.06] px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {freshToken && (
        <section className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[.06] p-5">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.15em] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
            Copy your key now
          </div>
          <h3 className="mt-2 text-sm font-semibold text-emerald-100">“{freshToken.name}” is ready</h3>
          <p className="mt-1 text-[11px] leading-5 text-emerald-200/70">
            This is the only time the full key is shown. Store it somewhere safe — you can’t view it again, only revoke it.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 break-all rounded-xl border border-emerald-400/20 bg-black/40 px-4 py-3 font-mono text-xs text-emerald-100">
              {freshToken.token}
            </code>
            <button
              type="button"
              onClick={copyToken}
              className="rounded-xl border border-emerald-400/30 px-4 py-3 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/10"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/[.07] bg-white/[.025] p-5">
        <h2 className="text-sm font-semibold">Your keys</h2>
        {keys.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-white/10 p-4 text-center text-[11px] leading-5 text-zinc-600">
            No keys yet. Generate one above to connect a local app or AI.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-white/[.06]">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-zinc-200">{key.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-zinc-600">
                    <span className="text-zinc-500">{key.prefix}…</span>
                    <span>created {formatDate(key.createdAt)}</span>
                    <span>{key.lastUsedAt ? `last used ${formatDate(key.lastUsedAt)}` : "never used"}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => revokeKey(key.id)}
                  disabled={revoking === key.id}
                  className="rounded-lg border border-red-400/20 px-3 py-1.5 text-[11px] text-red-300 transition hover:bg-red-400/10 disabled:opacity-40"
                >
                  {revoking === key.id ? "Revoking…" : "Revoke"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/[.07] bg-white/[.025] p-5">
        <h2 className="text-sm font-semibold">What you can do with a key</h2>
        <p className="mt-0.5 text-[11px] leading-5 text-zinc-500">
          A key lets an app or AI agent act as you over the marketplace API. Every request is scoped to your own
          account — a key can only ever read and change <span className="text-zinc-300">your</span> listings, and never
          touches another seller, your messages, or your account settings.
        </p>

        <div className="mt-4 space-y-2">
          {[
            { label: "Check the connection", detail: "Confirm the key works and see which account it’s acting on." },
            { label: "List your listings", detail: "Pull all of your listings — any status — to sync or review them." },
            { label: "Create a listing", detail: "Publish a new listing with title, price, description, images, and more. Creation is rate limited to 3 new listings per 5 minutes — over the limit, the API returns 429 with a Retry-After header." },
            { label: "Update a listing", detail: "Edit any field, or flip status between active, sold, and draft." },
            { label: "Delete a listing", detail: "Permanently remove one of your listings." },
          ].map((item) => (
            <div key={item.label} className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/80" />
              <p className="text-[11px] leading-5 text-zinc-400">
                <span className="font-medium text-zinc-200">{item.label}.</span> {item.detail}
              </p>
            </div>
          ))}
        </div>

        <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-[.15em] text-zinc-500">Endpoints</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-left font-mono text-[11px]">
            <tbody className="text-zinc-400">
              {[
                { method: "GET", path: "/api/v1/me", note: "Who this key belongs to" },
                { method: "GET", path: "/api/v1/listings", note: "All of your listings" },
                { method: "POST", path: "/api/v1/listings", note: "Create a listing" },
                { method: "GET", path: "/api/v1/listings/:id", note: "One listing" },
                { method: "PUT", path: "/api/v1/listings/:id", note: "Update a listing" },
                { method: "DELETE", path: "/api/v1/listings/:id", note: "Delete a listing" },
              ].map((row) => (
                <tr key={`${row.method} ${row.path}`} className="border-b border-white/[.05] last:border-0">
                  <td className="whitespace-nowrap py-2 pr-3 align-top font-semibold text-emerald-300">{row.method}</td>
                  <td className="whitespace-nowrap py-2 pr-4 align-top text-zinc-200">{row.path}</td>
                  <td className="py-2 align-top text-zinc-500">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-[.15em] text-zinc-500">Listing fields</h3>
        <p className="mt-2 text-[11px] leading-5 text-zinc-500">
          When creating or updating, send a JSON body. <code className="text-zinc-300">title</code> and{" "}
          <code className="text-zinc-300">price</code> are required on create; everything else is optional:{" "}
          <code className="text-zinc-400">description</code>, <code className="text-zinc-400">images</code> (URLs),{" "}
          <code className="text-zinc-400">category</code>, <code className="text-zinc-400">condition</code>,{" "}
          <code className="text-zinc-400">status</code>, <code className="text-zinc-400">readme</code>,{" "}
          <code className="text-zinc-400">adult</code>.
        </p>
      </section>

      <section className="rounded-2xl border border-white/[.07] bg-white/[.025] p-5">
        <h2 className="text-sm font-semibold">Connect your app</h2>
        <p className="mt-0.5 text-[11px] leading-5 text-zinc-500">
          Send the key as a bearer token. It acts only on your own listings.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-5 text-zinc-300">
{`# Who am I?
curl ${apiBase}/api/v1/me \\
  -H "Authorization: Bearer YOUR_KEY"

# List your listings
curl ${apiBase}/api/v1/listings \\
  -H "Authorization: Bearer YOUR_KEY"

# Create a listing
curl -X POST ${apiBase}/api/v1/listings \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"My product","price":49}'`}
        </pre>
      </section>
    </div>
  );
}
