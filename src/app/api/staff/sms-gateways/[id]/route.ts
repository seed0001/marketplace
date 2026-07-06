import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidGatewayDomain, normalizeGatewayDomain } from "@/lib/sms-carriers";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const admin = await prisma.user.findFirst({ where: { id: session.user.id, role: "ADMIN" }, select: { id: true } });
  return admin;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const data: { label?: string; domain?: string; enabled?: boolean; sortOrder?: number } = {};
  if ("label" in body) {
    const label = typeof body.label === "string" ? body.label.trim().slice(0, 60) : "";
    if (!label) return NextResponse.json({ error: "Carrier name is required." }, { status: 400 });
    data.label = label;
  }
  if ("domain" in body) {
    if (!isValidGatewayDomain(body.domain)) {
      return NextResponse.json({ error: "Enter a valid gateway domain (e.g. vtext.com)." }, { status: 400 });
    }
    data.domain = normalizeGatewayDomain(String(body.domain));
  }
  if ("enabled" in body) data.enabled = Boolean(body.enabled);
  if ("sortOrder" in body && Number.isInteger(body.sortOrder)) data.sortOrder = body.sortOrder;

  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  try {
    const gateway = await prisma.smsGateway.update({ where: { id }, data });
    return NextResponse.json(gateway);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") return NextResponse.json({ error: "That gateway domain already exists." }, { status: 409 });
      if (error.code === "P2025") return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Could not update gateway." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  try {
    await prisma.smsGateway.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
