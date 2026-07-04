"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function EditListingPage(props: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    images: "",
    category: "",
    condition: "",
  });

  useEffect(() => {
    props.params.then((p) => setId(p.id));
  }, [props.params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/listings/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          title: data.title,
          description: data.description,
          price: data.price.toString(),
          images: data.images.join("\n"),
          category: data.category || "",
          condition: data.condition || "",
        });
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, [id]);

  if (!session) {
    return (
      <div className="mx-auto max-w-lg mt-16 px-4 text-center">
        <p className="text-zinc-600">You must be signed in.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const images = form.images
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch(`/api/listings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: parseFloat(form.price), images }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    router.push(`/listings/${id}`);
  }

  if (fetching) return <div className="text-center py-16 text-zinc-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-lg mt-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Edit listing</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            rows={4}
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price ($)</label>
          <input
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            type="number"
            step="0.01"
            required
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Condition</label>
          <select
            value={form.condition}
            onChange={(e) => setForm({ ...form, condition: e.target.value })}
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
            value={form.images}
            onChange={(e) => setForm({ ...form, images: e.target.value })}
            rows={3}
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
