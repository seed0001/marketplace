export function RichTextSection({ content }: { content: string }) {
  if (!content) return null;
  return (
    <div className="prose prose-zinc max-w-none text-zinc-600 whitespace-pre-wrap">
      {content}
    </div>
  );
}
