const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 4_000_000; // ~4MB per image (generous; client compresses to a few hundred KB)

/**
 * Keep only valid image entries: http(s) URLs or image data URLs, capped in
 * count and per-item size so a listing can't store a runaway payload.
 */
export function sanitizeImages(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((v): v is string => typeof v === "string")
    .filter((s) => /^(https?:\/\/|data:image\/)/.test(s))
    .filter((s) => s.length <= MAX_IMAGE_BYTES)
    .slice(0, MAX_IMAGES);
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}
