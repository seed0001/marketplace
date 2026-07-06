import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeImages } from "@/lib/utils";
import { queueDiscordEvent } from "@/lib/discord";
import { authenticateApiKey, jsonWithApiUsage } from "@/lib/api-keys";

// Programmatic listing management for external clients (a seller's local app
// or AI agent) authenticated with a personal API key. Scoped entirely to the
// key owner's own listings — a key can never see or touch another seller.

export async function GET(request: NextRequest) {
  const principal = await authenticateApiKey(request);
  if (!principal) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const listings = await prisma.listing.findMany({
    where: { userId: principal.userId },
    orderBy: { createdAt: "desc" },
  });
  return jsonWithApiUsage(request, principal, "GET /api/v1/listings", listings);
}

export async function POST(request: NextRequest) {
  const principal = await authenticateApiKey(request);
  if (!principal) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return jsonWithApiUsage(request, principal, "POST /api/v1/listings", { error: "Invalid JSON body" }, { status: 400 });

  const { title, description, price, images, category, condition, sections, readme, adult } = body;
  if (!title || price === undefined || price === null || price === "") {
    return jsonWithApiUsage(request, principal, "POST /api/v1/listings", { error: "Missing required fields: title, price" }, { status: 400 });
  }

  const parsedPrice = parseFloat(price);
  if (Number.isNaN(parsedPrice)) {
    return jsonWithApiUsage(request, principal, "POST /api/v1/listings", { error: "price must be a number" }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: {
      title,
      description: description ?? "",
      price: parsedPrice,
      images: sanitizeImages(images),
      category: category || null,
      condition: condition || null,
      sections: sections || undefined,
      readme: readme || undefined,
      adult: adult ?? false,
      userId: principal.userId,
    },
    include: { user: { select: { id: true, name: true } } },
  });

  await queueDiscordEvent("marketplace", `New listing · ${listing.title}`, {
    description: listing.description || "A new marketplace listing was published.",
    color: 0x34d399,
    fields: [
      { name: "Seller", value: listing.user.name || "Marketplace member", inline: true },
      { name: "Price", value: `$${listing.price.toLocaleString()}`, inline: true },
      { name: "Category", value: listing.category || "Uncategorized", inline: true },
    ],
  });

  return jsonWithApiUsage(request, principal, "POST /api/v1/listings", listing, { status: 201 });
}
