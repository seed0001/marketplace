"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { ImageUpload } from "@/components/ImageUpload";

export default function EditListingPage(props: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [readme, setReadme] = useState("");
  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "",
    adult: false,
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
          price: data.price.toString(),
          category: data.category || "",
          adult: data.adult ?? false,
        });
        setImages(Array.isArray(data.images) ? data.images : []);
        setReadme(data.readme ?? "");
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

    const res = await fetch(`/api/listings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        price: parseFloat(form.price),
        category: form.category,
        images,
        readme,
        adult: form.adult,
      }),
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
            value={readme}
            onChange={(e) => setReadme(e.target.value)}
            rows={16}
            placeholder="Paste or write your README markdown..."
            className="w-full mt-2 rounded-lg border px-4 py-3 text-sm font-mono outline-none focus:border-emerald-500 resize-y"
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
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.adult}
            onChange={(e) => setForm({ ...form, adult: e.target.checked })}
            className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-zinc-600">18+ age-restricted content</span>
        </label>

        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-emerald-500"
          >
            <option value="">Select...</option>
            <option value="Web app">Web app</option>
            <option value="Mobile app">Mobile app</option>
            <option value="AI agent">AI agent</option>
            <option value="Automation">Automation</option>
            <option value="Prompt/template">Prompt/template</option>
            <option value="Component">Component</option>
          </select>
        </div>

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
          {loading ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
