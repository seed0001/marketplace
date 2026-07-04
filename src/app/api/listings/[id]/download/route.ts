import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { parseGithubRepo, githubZipUrl } from "@/lib/github";
import { getInstallationToken } from "@/lib/githubApp";

export const dynamic = "force-dynamic";

/**
 * Streams the listing's GitHub repo to the buyer as a .zip, proxied through our
 * own domain. The client is never sent to or shown GitHub.
 *
 * Access requires the caller to own the listing, or to have an order the seller
 * has "released" (i.e. paid and cleared). Private repos are read with a
 * short-lived token minted from the seller's GitHub App installation.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || !listing.githubUrl) {
    return NextResponse.json({ error: "No download available" }, { status: 404 });
  }

  const isOwner = listing.userId === session.user.id;
  if (!isOwner) {
    const order = await prisma.order.findUnique({
      where: { listingId_buyerId: { listingId: id, buyerId: session.user.id } },
    });
    if (order?.status !== "released") {
      return NextResponse.json(
        { error: "The seller hasn't released this download yet." },
        { status: 403 }
      );
    }
  }

  const repo = parseGithubRepo(listing.githubUrl);
  if (!repo) {
    return NextResponse.json({ error: "Invalid source repository" }, { status: 422 });
  }

  const headers: Record<string, string> = {
    // GitHub's API requires a User-Agent.
    "User-Agent": "dev-marketplace",
    Accept: "application/vnd.github+json",
  };

  // Prefer a token scoped to the seller's GitHub App installation (works for
  // private and public repos). Fall back to a server token, then anonymous.
  const installation = await prisma.githubInstallation.findUnique({
    where: { userId: listing.userId },
  });
  const token =
    (installation ? await getInstallationToken(installation.installationId) : null) ||
    process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const upstream = await fetch(githubZipUrl(repo), { headers, redirect: "follow" });
  if (!upstream.ok || !upstream.body) {
    const hint =
      upstream.status === 404 && !token
        ? "If this is a private repo, the seller needs to connect GitHub."
        : "Could not fetch the file from the source.";
    return NextResponse.json({ error: hint }, { status: 502 });
  }

  const responseHeaders = new Headers({
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${repo.repo}.zip"`,
    "Cache-Control": "no-store",
  });
  const length = upstream.headers.get("content-length");
  if (length) responseHeaders.set("Content-Length", length);

  return new Response(upstream.body, { headers: responseHeaders });
}
