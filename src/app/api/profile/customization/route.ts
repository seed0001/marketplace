import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import {
  normalizeAccentColor,
  normalizeOptionalText,
  normalizeProfileImage,
  normalizeProfileSongs,
  normalizeProfileTheme,
} from "@/lib/profile-customization";

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const profileBio = normalizeOptionalText(body.profileBio, 700);
    if (profileBio === null) {
      return NextResponse.json({ error: "Bio must be 700 characters or fewer." }, { status: 400 });
    }

    const profileStatus = normalizeOptionalText(body.profileStatus, 140);
    if (profileStatus === null) {
      return NextResponse.json({ error: "Status must be 140 characters or fewer." }, { status: 400 });
    }

    const profileCoverImage = normalizeProfileImage(body.profileCoverImage);
    if (profileCoverImage === null) {
      return NextResponse.json({ error: "Cover image must be a secure image URL." }, { status: 400 });
    }

    const profileBackgroundImage = normalizeProfileImage(body.profileBackgroundImage);
    if (profileBackgroundImage === null) {
      return NextResponse.json({ error: "Background image must be a secure image URL." }, { status: 400 });
    }

    const profileAccentColor = normalizeAccentColor(body.profileAccentColor);
    if (profileAccentColor === null) {
      return NextResponse.json({ error: "Choose a valid profile accent color." }, { status: 400 });
    }

    let songs;
    try {
      songs = normalizeProfileSongs(body.songs || []);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid song list." },
        { status: 400 },
      );
    }

    const saved = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          profileBio: profileBio || null,
          profileStatus: profileStatus || null,
          profileCoverImage: profileCoverImage || null,
          profileBackgroundImage: profileBackgroundImage || null,
          profileAccentColor,
          profileTheme: normalizeProfileTheme(body.profileTheme),
        },
      });

      await tx.profileSong.deleteMany({ where: { userId: session.user.id } });
      if (songs.length) {
        await tx.profileSong.createMany({
          data: songs.map((song, index) => ({
            ...song,
            userId: session.user.id,
            sortOrder: index,
          })),
        });
      }

      return tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          profileBio: true,
          profileStatus: true,
          profileCoverImage: true,
          profileBackgroundImage: true,
          profileAccentColor: true,
          profileTheme: true,
          profileSongs: { orderBy: { sortOrder: "asc" } },
        },
      });
    });

    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
