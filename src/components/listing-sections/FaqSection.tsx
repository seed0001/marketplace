import type { FaqItem } from "@/lib/listing-sections";

export function FaqSection({ content }: { content: FaqItem[] }) {
  if (!content || content.length === 0) return null;
  return (
    <div className="space-y-4">
      {content.map((item, i) => (
        <div key={i} className="rounded-lg border bg-white p-4">
          <h4 className="text-sm font-semibold text-zinc-800 mb-1">{item.question}</h4>
          <p className="text-sm text-zinc-600 whitespace-pre-wrap">{item.answer}</p>
        </div>
      ))}
    </div>
  );
}
