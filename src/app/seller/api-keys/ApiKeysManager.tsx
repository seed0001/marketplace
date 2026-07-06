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
    try {
      await navigator.clipboard.writeText(freshToken.token);
      setCopied(true);
    } catch {
      setCopied(false);
    }
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
