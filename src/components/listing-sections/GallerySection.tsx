export function GallerySection({ content }: { content: string[] }) {
  if (!content || content.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {content.map((src, i) => (
        <div key={i} className="aspect-square rounded-lg bg-zinc-100 overflow-hidden">
          <img src={src} alt="" className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}
