import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

const MAX_WEBSITES = 5;
const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 140;
const MAX_URL_LENGTH = 500;

type WebsiteInput = {
  title?: unknown;
  description?: unknown;
  url?: unknown;
};

function normalizeWebsite(input: WebsiteInput) {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description =
    typeof input.description === "string" ? input.description.trim() : "";
  const rawUrl = typeof input.url === "string" ? input.url.trim() : "";

  if (!title || !description || !rawUrl) {
    throw new Error("Every website needs a name, description, and link.");
  }
  if (title.length > MAX_TITLE_LENGTH) {
    throw new Error(`Website names must be ${MAX_TITLE_LENGTH} characters or fewer.`);
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(`Website descriptions must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
  }
  if (rawUrl.length > MAX_URL_LENGTH) {
    throw new Error("That website link is too long.");
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Enter a complete website link, including https://.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Website links must begin with https:// or http://.");
  }

  return { title, description, url: url.toString() };
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    if (!Array.isArray(body.websites)) {
      return NextResponse.json({ error: "Websites must be a list." }, { status: 400 });
    }
    if (body.websites.length > MAX_WEBSITES) {
      return NextResponse.json(
        { error: `You can showcase up to ${MAX_WEBSITES} websites.` },
        { status: 400 },
      );
    }

    let websites: ReturnType<typeof normalizeWebsite>[];
    try {
      websites = body.websites.map(normalizeWebsite);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid website." },
        { status: 400 },
      );
    }

    const saved = await prisma.$transaction(async (tx) => {
      await tx.sellerWebsite.deleteMany({ where: { userId: session.user.id } });
      if (websites.length) {
        await tx.sellerWebsite.createMany({
          data: websites.map((website) => ({
            ...website,
            userId: session.user.id,
          })),
        });
      }
      return tx.sellerWebsite.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
      });
    });

    return NextResponse.json({ websites: saved });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
