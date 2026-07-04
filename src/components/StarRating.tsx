const SIZES = {
  xs: "text-[11px]",
  sm: "text-sm",
  lg: "text-lg",
} as const;

/**
 * Read-only star display. Rounds `value` (0–5, may be fractional) to whole
 * stars, filling them amber over a muted track.
 */
export function StarRating({
  value,
  size = "sm",
}: {
  value: number;
  size?: keyof typeof SIZES;
}) {
  const filled = Math.round(value);
  return (
    <span
      className={`inline-flex leading-none tracking-tight ${SIZES[size]}`}
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      <span className="text-amber-500">{"★".repeat(filled)}</span>
      <span className="text-zinc-300">{"★".repeat(5 - filled)}</span>
    </span>
  );
}
