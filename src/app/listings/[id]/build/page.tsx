"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableSection } from "./SortableSection";
import type { Section, SectionType } from "@/lib/listing-sections";
import { createDefaultSection, sectionLabel } from "@/lib/listing-sections";

const sectionTypes: SectionType[] = [
  "richtext",
  "specs",
  "features",
  "gallery",
  "faq",
  "changelog",
];

export default function BuildPage(props: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [listingId, setListingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sections, setSections] = useState<Section[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    props.params.then((p) => setListingId(p.id));
  }, [props.params]);

  useEffect(() => {
    if (!listingId) return;
    fetch(`/api/listings/${listingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.sections)) {
          setSections(data.sections);
        }
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, [listingId]);

  if (!session) {
    return (
      <div className="mx-auto max-w-lg mt-16 px-4 text-center">
        <p className="text-zinc-600">You must be signed in.</p>
      </div>
    );
  }

  if (fetching) return <div className="text-center py-16 text-zinc-500">Loading...</div>;

  function addSection(type: SectionType) {
    setSections((prev) => [...prev, createDefaultSection(type, prev.length)]);
  }

  function updateSection(id: string, patch: Partial<Section>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeSection(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((prev) => {
        const oldIndex = prev.findIndex((s) => s.id === active.id);
        const newIndex = prev.findIndex((s) => s.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/listings/${listingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
      setSaving(false);
      return;
    }
    setSaving(false);
    router.push(`/listings/${listingId}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Build your page</h1>
          <p className="text-sm text-zinc-500 mt-1">Add, edit, and reorder sections</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onUpdate={(patch) => updateSection(section.id, patch)}
                onRemove={() => removeSection(section.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sections.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-zinc-200 py-16 text-center">
          <p className="text-sm text-zinc-400 mb-4">No sections yet. Add one below.</p>
        </div>
      )}

      <div className="mt-8">
        <p className="text-sm font-medium text-zinc-600 mb-3">Add a section</p>
        <div className="flex flex-wrap gap-2">
          {sectionTypes.map((type) => (
            <button
              key={type}
              onClick={() => addSection(type)}
              className="rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 transition"
            >
              + {sectionLabel(type)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
