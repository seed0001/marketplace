import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { githubAppConfigured, githubInstallUrl } from "@/lib/githubApp";

/** Connection status for the signed-in seller's "Connect GitHub" UI. */
export async function GET() {
  try {
    const session = await requireAuth();
    const installation = await prisma.githubInstallation.findUnique({
      where: { userId: session.user.id },
    });
    return NextResponse.json({
      configured: githubAppConfigured(),
      installUrl: githubInstallUrl(),
      connected: !!installation,
      accountLogin: installation?.accountLogin ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** Seller disconnects — we forget their installation (they can also uninstall on GitHub). */
export async function DELETE() {
  try {
    const session = await requireAuth();
    await prisma.githubInstallation.deleteMany({ where: { userId: session.user.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
