import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeSpotifyUrl } from "@/lib/spotify";

export async function GET() {
  const settings = await prisma.siteAudioSettings.findUnique({
    where: { id: "default" },
    select: { enabled: true, label: true, spotifyUrl: true, updatedAt: true },
  });
  return NextResponse.json(settings || { enabled: false, label: "Builder Radio", spotifyUrl: null });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = await prisma.user.findFirst({ where: { id: session.user.id, role: "ADMIN" }, select: { id: true } });
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const label = typeof body.label === "string" ? body.label.trim().slice(0, 80) : "";
  const spotifyUrl = typeof body.spotifyUrl === "string" ? normalizeSpotifyUrl(body.spotifyUrl) : null;
  const enabled = body.enabled === true;
  if (!label) return NextResponse.json({ error: "Station name is required." }, { status: 400 });
  if (!spotifyUrl) {
    return NextResponse.json({ error: "Paste a direct Spotify playlist, album, artist, show, episode, or track URL." }, { status: 400 });
  }

  try {
    const validation = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`, {
      signal: AbortSignal.timeout(12000),
    });
    if (!validation.ok) return NextResponse.json({ error: "Spotify could not find that channel." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Could not verify that Spotify URL." }, { status: 502 });
  }

  const settings = await prisma.siteAudioSettings.upsert({
    where: { id: "default" },
    update: { enabled, label, spotifyUrl, updatedById: admin.id },
    create: { id: "default", enabled, label, spotifyUrl, updatedById: admin.id },
    select: { enabled: true, label: true, spotifyUrl: true, updatedAt: true },
  });
  return NextResponse.json(settings);
}
