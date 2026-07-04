"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function NewListing() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!session) {
    return (
      <div className="mx-auto max-w-lg mt-16 px-4 text-center">
        <p className="text-zinc-600">You must be signed in to create a listing.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const imagesStr = form.get("images") as string;
    const images = imagesStr ? imagesStr.split("\n").map((s) => s.trim()).filter(Boolean) : [];

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        price: form.get("price"),
        images,
        category: form.get("category"),
        condition: form.get("condition"),
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
      <h1 className="text-2xl font-bold mb-6">Create listing</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            name="title"
            required
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea
            name="description"
            required
            rows={4}
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
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
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input
            name="category"
            placeholder="e.g. Electronics, Clothing, Furniture"
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Condition</label>
          <select
            name="condition"
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Select...</option>
            <option value="new">New</option>
            <option value="like-new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Image URLs (one per line)</label>
          <textarea
            name="images"
            rows={3}
            placeholder="https://example.com/image1.jpg"
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create listing"}
        </button>
      </form>
    </div>
  );
}
