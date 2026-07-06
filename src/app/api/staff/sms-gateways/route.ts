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

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const gateways = await prisma.smsGateway.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
  return NextResponse.json(gateways);
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const label = typeof body.label === "string" ? body.label.trim().slice(0, 60) : "";
  if (!label) return NextResponse.json({ error: "Carrier name is required." }, { status: 400 });
  if (!isValidGatewayDomain(body.domain)) {
    return NextResponse.json({ error: "Enter a valid gateway domain (e.g. vtext.com)." }, { status: 400 });
  }
  const domain = normalizeGatewayDomain(String(body.domain));
  const sortOrder = Number.isInteger(body.sortOrder) ? body.sortOrder : 0;

  try {
    const gateway = await prisma.smsGateway.create({
      data: { label, domain, sortOrder, enabled: body.enabled === false ? false : true },
    });
    return NextResponse.json(gateway, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "That gateway domain already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not create gateway." }, { status: 500 });
  }
}
