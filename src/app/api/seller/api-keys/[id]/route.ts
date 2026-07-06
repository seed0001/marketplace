import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// Revoke a key. Soft-deletes by stamping `revokedAt` so any client still
// holding the token is immediately locked out on its next request.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const key = await prisma.sellerApiKey.findUnique({ where: { id } });
    if (!key || key.revokedAt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (key.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.sellerApiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
