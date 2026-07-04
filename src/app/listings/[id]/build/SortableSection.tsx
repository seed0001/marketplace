"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import type { Section, SectionType, SpecItem, FaqItem, ChangelogEntry } from "@/lib/listing-sections";
import { sectionLabel } from "@/lib/listing-sections";

type Props = {
  section: Section;
  onUpdate: (patch: Partial<Section>) => void;
  onRemove: () => void;
};

export function SortableSection({ section, onUpdate, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border bg-white shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-zinc-50">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600"
          aria-label="Drag to reorder"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="3" r="1.5" />
            <circle cx="11" cy="3" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="13" r="1.5" />
            <circle cx="11" cy="13" r="1.5" />
          </svg>
        </button>

        <span className="rounded bg-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
          {sectionLabel(section.type as SectionType)}
        </span>

        <input
          value={section.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Section title"
          className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-zinc-300"
        />

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-zinc-500 hover:text-zinc-700"
        >
          {expanded ? "Collapse" : "Edit"}
        </button>

        <button
          onClick={onRemove}
          className="text-zinc-400 hover:text-red-500 transition"
          aria-label="Remove section"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="p-4">
          <SectionEditor section={section} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}

function SectionEditor({
  section,
  onUpdate,
}: {
  section: Section;
  onUpdate: (patch: Partial<Section>) => void;
}) {
  switch (section.type) {
    case "richtext":
      return <RichTextEditor content={section.content as string} onUpdate={onUpdate} />;
    case "specs":
      return <SpecsEditor content={section.content as SpecItem[]} onUpdate={onUpdate} />;
    case "features":
      return <FeaturesEditor content={section.content as string[]} onUpdate={onUpdate} />;
    case "gallery":
      return <GalleryEditor content={section.content as string[]} onUpdate={onUpdate} />;
    case "faq":
      return <FaqEditor content={section.content as FaqItem[]} onUpdate={onUpdate} />;
    case "changelog":
      return <ChangelogEditor content={section.content as ChangelogEntry[]} onUpdate={onUpdate} />;
    default:
      return null;
  }
}

function RichTextEditor({
  content,
  onUpdate,
}: {
  content: string;
  onUpdate: (patch: Partial<Section>) => void;
}) {
  return (
    <textarea
      value={content}
      onChange={(e) => onUpdate({ content: e.target.value })}
      rows={8}
      placeholder="Write in markdown..."
      className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-emerald-500 resize-y font-mono"
    />
  );
}

function SpecsEditor({
  content,
  onUpdate,
}: {
  content: SpecItem[];
  onUpdate: (patch: Partial<Section>) => void;
}) {
  function setItem(i: number, item: SpecItem) {
    const next = [...content];
    next[i] = item;
    onUpdate({ content: next });
  }
  function addItem() {
    onUpdate({ content: [...content, { label: "", value: "" }] });
  }
  function removeItem(i: number) {
    onUpdate({ content: content.filter((_, idx) => idx !== i) });
  }
  return (
    <div className="space-y-2">
      {content.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item.label}
            onChange={(e) => setItem(i, { ...item, label: e.target.value })}
            placeholder="Label"
            className="w-2/5 rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
          />
          <input
            value={item.value}
            onChange={(e) => setItem(i, { ...item, value: e.target.value })}
            placeholder="Value"
            className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
          />
          <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-1">
            &times;
          </button>
        </div>
      ))}
      <button onClick={addItem} className="text-sm text-emerald-600 hover:text-emerald-700">
        + Add row
      </button>
    </div>
  );
}

function FeaturesEditor({
  content,
  onUpdate,
}: {
  content: string[];
  onUpdate: (patch: Partial<Section>) => void;
}) {
  function setItem(i: number, val: string) {
    const next = [...content];
    next[i] = val;
    onUpdate({ content: next });
  }
  function addItem() {
    onUpdate({ content: [...content, ""] });
  }
  function removeItem(i: number) {
    onUpdate({ content: content.filter((_, idx) => idx !== i) });
  }
  return (
    <div className="space-y-2">
      {content.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item}
            onChange={(e) => setItem(i, e.target.value)}
            placeholder="Feature"
            className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
          />
          <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-1">
            &times;
          </button>
        </div>
      ))}
      <button onClick={addItem} className="text-sm text-emerald-600 hover:text-emerald-700">
        + Add feature
      </button>
    </div>
  );
}

function GalleryEditor({
  content,
  onUpdate,
}: {
  content: string[];
  onUpdate: (patch: Partial<Section>) => void;
}) {
  return (
    <div>
      <ImageUpload value={content} onChange={(val) => onUpdate({ content: val })} />
    </div>
  );
}

function FaqEditor({
  content,
  onUpdate,
}: {
  content: FaqItem[];
  onUpdate: (patch: Partial<Section>) => void;
}) {
  function setItem(i: number, item: FaqItem) {
    const next = [...content];
    next[i] = item;
    onUpdate({ content: next });
  }
  function addItem() {
    onUpdate({ content: [...content, { question: "", answer: "" }] });
  }
  function removeItem(i: number) {
    onUpdate({ content: content.filter((_, idx) => idx !== i) });
  }
  return (
    <div className="space-y-3">
      {content.map((item, i) => (
        <div key={i} className="rounded-lg border bg-zinc-50 p-3 space-y-2">
          <div className="flex gap-2">
            <input
              value={item.question}
              onChange={(e) => setItem(i, { ...item, question: e.target.value })}
              placeholder="Question"
              className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
            />
            <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-1">
              &times;
            </button>
          </div>
          <textarea
            value={item.answer}
            onChange={(e) => setItem(i, { ...item, answer: e.target.value })}
            rows={2}
            placeholder="Answer"
            className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-emerald-500 resize-y"
          />
        </div>
      ))}
      <button onClick={addItem} className="text-sm text-emerald-600 hover:text-emerald-700">
        + Add Q&A
      </button>
    </div>
  );
}

function ChangelogEditor({
  content,
  onUpdate,
}: {
  content: ChangelogEntry[];
  onUpdate: (patch: Partial<Section>) => void;
}) {
  function setItem(i: number, item: ChangelogEntry) {
    const next = [...content];
    next[i] = item;
    onUpdate({ content: next });
  }
  function addItem() {
    onUpdate({ content: [...content, { version: "", date: "", notes: "" }] });
  }
  function removeItem(i: number) {
    onUpdate({ content: content.filter((_, idx) => idx !== i) });
  }
  return (
    <div className="space-y-3">
      {content.map((item, i) => (
        <div key={i} className="rounded-lg border bg-zinc-50 p-3 space-y-2">
          <div className="flex gap-2">
            <input
              value={item.version}
              onChange={(e) => setItem(i, { ...item, version: e.target.value })}
              placeholder="v1.0.0"
              className="w-1/3 rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
            />
            <input
              value={item.date}
              onChange={(e) => setItem(i, { ...item, date: e.target.value })}
              placeholder="2024-01-01"
              className="w-1/3 rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
            />
            <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-1">
              &times;
            </button>
          </div>
          <textarea
            value={item.notes}
            onChange={(e) => setItem(i, { ...item, notes: e.target.value })}
            rows={2}
            placeholder="What changed?"
            className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-emerald-500 resize-y"
          />
        </div>
      ))}
      <button onClick={addItem} className="text-sm text-emerald-600 hover:text-emerald-700">
        + Add entry
      </button>
    </div>
  );
}
