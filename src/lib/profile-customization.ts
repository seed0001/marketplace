export const profileThemes = ["midnight", "forest", "sunset", "ocean", "violet"] as const;

export type ProfileTheme = (typeof profileThemes)[number];

export type NormalizedProfileSong = {
  provider: "spotify" | "youtube";
  title: string;
  artist: string | null;
  url: string;
  embedUrl: string;
};

const MAX_IMAGE_LENGTH = 4_000_000;
const MAX_SONGS = 5;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,20}$/;

export function normalizeOptionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length > maxLength) return null;
  return trimmed;
}

export function normalizeProfileImage(value: unknown) {
  if (value === null || value === "") return "";
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length > MAX_IMAGE_LENGTH) return null;
  if (trimmed.startsWith("data:image/")) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeAccentColor(value: unknown) {
  if (typeof value !== "string") return "#34d399";
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toLowerCase() : null;
}

export function normalizeProfileTheme(value: unknown): ProfileTheme {
  return profileThemes.includes(value as ProfileTheme) ? value as ProfileTheme : "midnight";
}

function normalizeSpotifyTrack(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.hostname !== "open.spotify.com") return null;
    const [type, id] = url.pathname.split("/").filter(Boolean);
    if (type !== "track" || !/^[A-Za-z0-9]+$/.test(id || "")) return null;
    return {
      provider: "spotify" as const,
      url: `https://open.spotify.com/track/${id}`,
      embedUrl: `https://open.spotify.com/embed/track/${id}`,
    };
  } catch {
    return null;
  }
}

function extractYoutubeId(url: URL) {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || null;
  if (host !== "youtube.com" && host !== "music.youtube.com") return null;

  if (url.pathname === "/watch") return url.searchParams.get("v");
  const [type, id] = url.pathname.split("/").filter(Boolean);
  if (type === "shorts" || type === "embed") return id || null;
  return null;
}

function normalizeYoutubeVideo(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    const id = extractYoutubeId(url);
    if (!id || !YOUTUBE_ID.test(id)) return null;
    return {
      provider: "youtube" as const,
      url: `https://www.youtube.com/watch?v=${id}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    };
  } catch {
    return null;
  }
}

export function normalizeProfileSong(input: { title?: unknown; artist?: unknown; url?: unknown }, index: number) {
  const rawUrl = typeof input.url === "string" ? input.url.trim() : "";
  if (!rawUrl) throw new Error(`Song ${index + 1} needs a Spotify or YouTube link.`);

  const media = normalizeSpotifyTrack(rawUrl) || normalizeYoutubeVideo(rawUrl);
  if (!media) {
    throw new Error(`Song ${index + 1} must be a Spotify track link or YouTube video link.`);
  }

  const title = normalizeOptionalText(input.title, 90);
  if (title === null) throw new Error(`Song ${index + 1} title must be 90 characters or fewer.`);

  const artist = normalizeOptionalText(input.artist, 90);
  if (artist === null) throw new Error(`Song ${index + 1} artist must be 90 characters or fewer.`);

  return {
    ...media,
    title: title || `${media.provider === "spotify" ? "Spotify" : "YouTube"} favorite ${index + 1}`,
    artist: artist || null,
  };
}

export function normalizeProfileSongs(value: unknown) {
  if (!Array.isArray(value)) throw new Error("Songs must be a list.");
  if (value.length > MAX_SONGS) throw new Error(`You can add up to ${MAX_SONGS} favorite songs.`);
  return value.map((item, index) => normalizeProfileSong(item, index));
}
