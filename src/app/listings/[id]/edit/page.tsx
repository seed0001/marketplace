"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { SectionEditors } from "@/components/SectionEditors";
import { createDefaultSection } from "@/lib/listing-sections";
import type { Section, SectionType } from "@/lib/listing-sections";

const allTypes: SectionType[] = ["richtext", "specs", "features", "gallery", "faq", "changelog"];

export default function EditListingPage(props: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
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
          category: data.category || "",
        });
        setImages(Array.isArray(data.images) ? data.images : []);
        if (Array.isArray(data.sections) && data.sections.length > 0) {
          setSections(data.sections);
        } else {
          setSections(allTypes.map((t, i) => createDefaultSection(t, i)));
        }
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
      body: JSON.stringify({ ...form, price: parseFloat(form.price), images, sections }),
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
    <div className="mx-auto max-w-4xl mt-8 px-4">
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
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            rows={4}
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-emerald-500"
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

        <hr className="my-6" />

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            <h2 className="text-lg font-semibold border-b pb-2">Content</h2>
            <SectionEditors
              sections={sections}
              onChange={setSections}
              filter={(t) => t !== "specs" && t !== "gallery"}
            />
          </div>

          <div className="space-y-8">
            <h2 className="text-lg font-semibold border-b pb-2">Details</h2>
            <SectionEditors
              sections={sections}
              onChange={setSections}
              filter={(t) => t === "specs" || t === "gallery"}
            />
          </div>
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
