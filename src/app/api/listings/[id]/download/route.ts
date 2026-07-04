import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { parseGithubRepo, githubZipUrl } from "@/lib/github";

export const dynamic = "force-dynamic";

/**
 * Streams the listing's GitHub repo to the buyer as a .zip, proxied through our
 * own domain. The client never sees or is redirected to GitHub. Requires the
 * caller to own the listing or to have a paid Purchase for it.
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
    const purchase = await prisma.purchase.findUnique({
      where: { listingId_buyerId: { listingId: id, buyerId: session.user.id } },
    });
    if (purchase?.status !== "paid") {
      return NextResponse.json({ error: "Purchase required" }, { status: 403 });
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
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const upstream = await fetch(githubZipUrl(repo), { headers, redirect: "follow" });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Could not fetch the file from the source" },
      { status: 502 }
    );
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
