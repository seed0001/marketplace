"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { CATEGORIES, OTHER_CATEGORY } from "@/lib/categories";

export default function NewListing() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [readme, setReadme] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  if (!session) {
    return (
      <div className="mx-auto max-w-lg mt-16 px-4 text-center">
        <p className="text-zinc-400">You must be signed in to create a listing.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        price: parseFloat(form.get("price") as string),
        images,
        category: (category === OTHER_CATEGORY ? customCategory.trim() : category) || null,
        readme,
        adult: form.get("adult") === "on",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    const listing = await res.json();
    router.push(`/listings/${listing.id}`);
  }

  return (
    <div className="mx-auto max-w-lg mt-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Create a listing</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            name="title"
            required
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">README</label>
          <p className="text-xs text-zinc-400 mb-2">
            Upload a README.md — headings become page sections
          </p>
          <input
            type="file"
            accept=".md,text/markdown"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setReadme(await file.text());
            }}
            className="block w-full text-xs text-zinc-500 file:mr-2 file:rounded file:border-0 file:bg-emerald-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
          />
          <textarea
            name="readme"
            value={readme}
            onChange={(e) => setReadme(e.target.value)}
            rows={16}
            placeholder="Paste or write your README markdown..."
            className="w-full mt-2 rounded-lg border px-4 py-3 text-sm font-mono outline-none focus:border-emerald-500 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Price ($) *</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-emerald-500"
          >
            <option value="">Select...</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={OTHER_CATEGORY}>Other…</option>
          </select>
          {category === OTHER_CATEGORY && (
            <input
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Enter a custom category"
              className="mt-2 w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-emerald-500"
            />
          )}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            name="adult"
            type="checkbox"
            className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-zinc-400">18+ age-restricted content</span>
        </label>
        <div>
          <label className="block text-sm font-medium mb-1">Photos</label>
          <ImageUpload value={images} onChange={setImages} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create listing"}
        </button>
      </form>
    </div>
  );
}
