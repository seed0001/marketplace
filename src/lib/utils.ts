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

/** The star dimensions a customer rates a listing on. */
export const REVIEW_DIMENSIONS = ["quality", "usability", "value"] as const;
export type ReviewDimension = (typeof REVIEW_DIMENSIONS)[number];

type ReviewScores = { quality: number; usability: number; value: number };

export type ReviewSummary = {
  count: number;
  overall: number;
  quality: number;
  usability: number;
  value: number;
};

/**
 * Average a listing's per-dimension star scores into a summary used on the
 * product card and detail page. `overall` is the mean of the three dimensions.
 */
export function summarizeReviews(reviews?: ReviewScores[] | null): ReviewSummary {
  const count = reviews?.length ?? 0;
  if (!reviews || count === 0) {
    return { count: 0, overall: 0, quality: 0, usability: 0, value: 0 };
  }
  const totals = reviews.reduce(
    (acc, r) => ({
      quality: acc.quality + r.quality,
      usability: acc.usability + r.usability,
      value: acc.value + r.value,
    }),
    { quality: 0, usability: 0, value: 0 },
  );
  const quality = totals.quality / count;
  const usability = totals.usability / count;
  const value = totals.value / count;
  return { count, overall: (quality + usability + value) / 3, quality, usability, value };
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
