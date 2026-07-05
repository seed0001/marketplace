const ALLOWED_TYPES = new Set(["playlist", "album", "artist", "show", "episode", "track"]);

export function normalizeSpotifyUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.hostname !== "open.spotify.com") return null;
    const [type, id] = url.pathname.split("/").filter(Boolean);
    if (!ALLOWED_TYPES.has(type) || !/^[A-Za-z0-9]+$/.test(id || "")) return null;
    return `https://open.spotify.com/${type}/${id}`;
  } catch {
    return null;
  }
}
