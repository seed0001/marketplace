export function FeaturesSection({ content }: { content: string[] }) {
  if (!content || content.length === 0) return null;
  return (
    <ul className="space-y-2">
      {content.map((feature, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          {feature}
        </li>
      ))}
    </ul>
  );
}
