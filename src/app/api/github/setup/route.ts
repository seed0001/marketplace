import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getInstallationAccount } from "@/lib/githubApp";

export const dynamic = "force-dynamic";

/**
 * GitHub redirects here (the App's "Setup URL") after a seller installs or
 * updates the app on their repos, with ?installation_id=...&setup_action=...
 * We link that installation to the signed-in seller so downloads of their
 * private repos can mint access tokens later.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const installationId = searchParams.get("installation_id");
  const action = searchParams.get("setup_action");

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // "request" means the org owner still has to approve; nothing to store yet.
  if (!installationId || action === "request") {
    return NextResponse.redirect(new URL("/profile?github=pending", request.url));
  }

  const accountLogin = await getInstallationAccount(installationId);

  await prisma.githubInstallation.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, installationId, accountLogin },
    update: { installationId, accountLogin },
  });

  return NextResponse.redirect(new URL("/profile?github=connected", request.url));
}
