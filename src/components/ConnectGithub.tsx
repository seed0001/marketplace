"use client";

import { useEffect, useState } from "react";

type Status = {
  configured: boolean;
  installUrl: string | null;
  connected: boolean;
  accountLogin: string | null;
};

export function ConnectGithub() {
  const [status, setStatus] = useState<Status | null>(null);

  function load() {
    fetch("/api/github")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => setStatus(null));
  }

  useEffect(load, []);

  async function disconnect() {
    await fetch("/api/github", { method: "DELETE" });
    load();
  }

  if (!status) return null;

  return (
    <section className="mb-10 rounded-xl border bg-white p-5">
      <h2 className="text-lg font-semibold">GitHub for private repos</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Connect GitHub so buyers can download your <strong>private</strong> repos. We only ever mint
        short-lived, read-only access when a cleared buyer downloads — nothing is stored. Public
        repos need no connection.
      </p>

      {!status.configured ? (
        <p className="mt-4 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
          GitHub App isn&apos;t configured on this server yet. Public-repo downloads still work.
        </p>
      ) : status.connected ? (
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
            ✓ Connected{status.accountLogin ? ` as ${status.accountLogin}` : ""}
          </span>
          {status.installUrl && (
            <a href={status.installUrl} className="text-sm text-zinc-600 underline">
              Manage repos
            </a>
          )}
          <button onClick={disconnect} className="text-sm text-red-600 underline">
            Disconnect
          </button>
        </div>
      ) : (
        status.installUrl && (
          <a
            href={status.installUrl}
            className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Connect GitHub
          </a>
        )
      )}
    </section>
  );
}
