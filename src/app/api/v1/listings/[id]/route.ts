import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeImages } from "@/lib/utils";
import { authenticateApiKey, jsonWithApiUsage } from "@/lib/api-keys";

// Read, update, or delete a single listing via a personal API key. Every
// handler verifies the listing belongs to the key owner before acting.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const principal = await authenticateApiKey(request);
  if (!principal) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.userId !== principal.userId) {
    return jsonWithApiUsage(request, principal, "GET /api/v1/listings/:id", { error: "Not found" }, { status: 404 });
  }
  return jsonWithApiUsage(request, principal, "GET /api/v1/listings/:id", listing);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const principal = await authenticateApiKey(request);
  if (!principal) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }
  const { id } = await params;

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.userId !== principal.userId) {
    return jsonWithApiUsage(request, principal, "PUT /api/v1/listings/:id", { error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return jsonWithApiUsage(request, principal, "PUT /api/v1/listings/:id", { error: "Invalid JSON body" }, { status: 400 });

  const data: Record<string, unknown> = {
    title: body.title,
    description: body.description,
    price: body.price !== undefined && body.price !== null && body.price !== "" ? parseFloat(body.price) : undefined,
    images: body.images !== undefined ? sanitizeImages(body.images) : undefined,
    category: body.category,
    condition: body.condition,
    status: body.status,
  };
  if (data.price !== undefined && Number.isNaN(data.price)) {
    return jsonWithApiUsage(request, principal, "PUT /api/v1/listings/:id", { error: "price must be a number" }, { status: 400 });
  }
  if (body.sections !== undefined) data.sections = body.sections;
  if (body.readme !== undefined) data.readme = body.readme;
  if (body.adult !== undefined) data.adult = body.adult;

  const updated = await prisma.listing.update({ where: { id }, data });
  return jsonWithApiUsage(request, principal, "PUT /api/v1/listings/:id", updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const principal = await authenticateApiKey(request);
  if (!principal) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }
  const { id } = await params;

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.userId !== principal.userId) {
    return jsonWithApiUsage(request, principal, "DELETE /api/v1/listings/:id", { error: "Not found" }, { status: 404 });
  }

  await prisma.listing.delete({ where: { id } });
  return jsonWithApiUsage(request, principal, "DELETE /api/v1/listings/:id", { success: true });
}
