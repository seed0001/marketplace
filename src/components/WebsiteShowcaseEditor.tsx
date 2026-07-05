"use client";

import { useState } from "react";

type Website = {
  id?: string;
  title: string;
  description: string;
  url: string;
};

const EMPTY_WEBSITE: Website = { title: "", description: "", url: "" };

export function WebsiteShowcaseEditor({
  initialWebsites,
}: {
  initialWebsites: Website[];
}) {
  const [websites, setWebsites] = useState<Website[]>(initialWebsites);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function update(index: number, field: keyof Website, value: string) {
    setWebsites((current) =>
      current.map((website, websiteIndex) =>
        websiteIndex === index ? { ...website, [field]: value } : website,
      ),
    );
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/profile/websites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websites }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save websites.");
      setWebsites(data.websites);
      setEditing(false);
      setMessage("Your website showcase is live in the broadcast.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save websites.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Website showcase</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Add up to five sites to your profile and the marketplace broadcast.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (websites.length === 0) setWebsites([{ ...EMPTY_WEBSITE }]);
              setEditing(true);
              setMessage("");
            }}
            className="shrink-0 rounded-full border border-emerald-500/40 px-4 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10"
          >
            {websites.length ? "Edit websites" : "Add websites"}
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Edit website showcase</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Write the short blurb visitors will see moving across the broadcast bar.
        </p>
      </div>
      <div className="space-y-4">
        {websites.map((website, index) => (
          <div key={website.id || index} className="rounded-xl border border-border bg-zinc-950/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500">
                Website {index + 1}
              </span>
              <button
                type="button"
                onClick={() => setWebsites((current) => current.filter((_, i) => i !== index))}
                className="text-xs text-zinc-500 hover:text-red-400"
              >
                Remove
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-zinc-400">
                Website name
                <input
                  value={website.title}
                  onChange={(event) => update(index, "title", event.target.value)}
                  maxLength={60}
                  placeholder="Northstar Studio"
                  className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </label>
              <label className="text-xs font-medium text-zinc-400">
                Website link
                <input
                  value={website.url}
                  onChange={(event) => update(index, "url", event.target.value)}
                  type="url"
                  maxLength={500}
                  placeholder="https://example.com"
                  className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </label>
            </div>
            <label className="mt-3 block text-xs font-medium text-zinc-400">
              Broadcast blurb
              <input
                value={website.description}
                onChange={(event) => update(index, "description", event.target.value)}
                maxLength={140}
                placeholder="Check out this fast, friendly booking site for local creatives."
                className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </label>
          </div>
        ))}
      </div>
      {websites.length < 5 && (
        <button
          type="button"
          onClick={() => setWebsites((current) => [...current, { ...EMPTY_WEBSITE }])}
          className="mt-4 text-sm font-medium text-emerald-400 hover:text-emerald-300"
        >
          + Add another website
        </button>
      )}
      {message && <p className="mt-4 text-sm text-red-400">{message}</p>}
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save showcase"}
        </button>
        <button
          type="button"
          onClick={() => {
            setWebsites(initialWebsites);
            setEditing(false);
            setMessage("");
          }}
          disabled={saving}
          className="rounded-full border border-border px-5 py-2 text-sm text-zinc-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
