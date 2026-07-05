import { marked } from "marked";

export function RichTextSection({ content }: { content: string }) {
  if (!content) return null;
  const html = marked.parse(content, { async: false }) as string;
  return (
    <div
      className="prose prose-invert max-w-none text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
