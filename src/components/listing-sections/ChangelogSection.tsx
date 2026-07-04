import type { ChangelogEntry } from "@/lib/listing-sections";

export function ChangelogSection({ content }: { content: ChangelogEntry[] }) {
  if (!content || content.length === 0) return null;
  return (
    <div className="space-y-6">
      {content.map((entry, i) => (
        <div key={i}>
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-sm font-semibold text-zinc-800">{entry.version}</span>
            <span className="text-xs text-zinc-400">{entry.date}</span>
          </div>
          <p className="text-sm text-zinc-600 whitespace-pre-wrap">{entry.notes}</p>
        </div>
      ))}
    </div>
  );
}
