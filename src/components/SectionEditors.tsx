"use client";

import { ImageUpload } from "@/components/ImageUpload";
import type { Section, SpecItem, FaqItem, ChangelogEntry } from "@/lib/listing-sections";

type Props = {
  sections: Section[];
  onChange: (sections: Section[]) => void;
};

export function SectionEditors({ sections, onChange }: Props) {
  function updateSection(index: number, patch: Partial<Section>) {
    const next = [...sections];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  if (sections.length === 0) return null;

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold border-b pb-2">Page sections</h2>
      {sections.map((section, i) => (
        <fieldset key={section.id}>
          <label className="block text-sm font-medium mb-2">{section.title}</label>
          <SectionEditor section={section} onUpdate={(patch) => updateSection(i, patch)} />
        </fieldset>
      ))}
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
      rows={6}
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
          <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-1">&times;</button>
        </div>
      ))}
      <button type="button" onClick={addItem} className="text-sm text-emerald-600 hover:text-emerald-700">+ Add row</button>
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
          <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-1">&times;</button>
        </div>
      ))}
      <button type="button" onClick={addItem} className="text-sm text-emerald-600 hover:text-emerald-700">+ Add feature</button>
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
  return <ImageUpload value={content} onChange={(val) => onUpdate({ content: val })} />;
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
            <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-1">&times;</button>
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
      <button type="button" onClick={addItem} className="text-sm text-emerald-600 hover:text-emerald-700">+ Add Q&A</button>
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
            <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-1">&times;</button>
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
      <button type="button" onClick={addItem} className="text-sm text-emerald-600 hover:text-emerald-700">+ Add entry</button>
    </div>
  );
}
