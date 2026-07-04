import type { SpecItem } from "@/lib/listing-sections";

export function SpecsSection({ content }: { content: SpecItem[] }) {
  if (!content || content.length === 0) return null;
  return (
    <dl className="divide-y divide-zinc-200">
      {content.map((item, i) => (
        <div key={i} className="grid grid-cols-3 gap-4 py-3 text-sm">
          <dt className="font-medium text-zinc-500">{item.label}</dt>
          <dd className="col-span-2 text-zinc-800">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
