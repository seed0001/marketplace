import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VISITOR_COOKIE = "vm_vid";
const SESSION_COOKIE = "vm_sid";
const MAX_TEXT = 500;

function text(value: unknown, max = MAX_TEXT) {
  return typeof value === "string" ? value.slice(0, max) : undefined;
}

function device(userAgent: string) {
  if (/bot|crawler|spider|slurp/i.test(userAgent)) return { deviceType: "bot", browser: "Bot" };
  const deviceType = /tablet|ipad/i.test(userAgent) ? "tablet" : /mobile|android|iphone/i.test(userAgent) ? "mobile" : "desktop";
  const browser = /edg\//i.test(userAgent) ? "Edge" : /firefox\//i.test(userAgent) ? "Firefox" : /chrome\//i.test(userAgent) ? "Chrome" : /safari\//i.test(userAgent) ? "Safari" : "Other";
  return { deviceType, browser };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!["page_view", "click"].includes(body.type) || typeof body.path !== "string") {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    const now = new Date();
    const visitorKey = request.cookies.get(VISITOR_COOKIE)?.value || randomUUID();
    const sessionKey = request.cookies.get(SESSION_COOKIE)?.value || randomUUID();
    const url = new URL(request.url);
    const pageUrl = new URL(body.path.slice(0, 500), url.origin);
    const userAgent = request.headers.get("user-agent") || "";
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const salt = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "vibemarket";
    const networkHash = forwarded ? createHash("sha256").update(`${salt}:${forwarded}`).digest("hex") : null;
    const session = await auth();
    const visitor = await prisma.analyticsVisitor.upsert({
      where: { visitorKey },
      update: { lastSeenAt: now },
      create: { visitorKey, firstSeenAt: now, lastSeenAt: now },
    });

    const existingSession = await prisma.analyticsSession.findUnique({ where: { sessionKey }, select: { id: true } });
    const analyticsSession = existingSession
      ? await prisma.analyticsSession.update({
          where: { sessionKey },
          data: { lastSeenAt: now, exitPath: pageUrl.pathname },
        })
      : await prisma.analyticsSession.create({
          data: {
            sessionKey,
            visitorId: visitor.id,
            entryPath: pageUrl.pathname,
            exitPath: pageUrl.pathname,
            referrer: text(request.headers.get("referer")),
            source: text(pageUrl.searchParams.get("utm_source"), 100),
            medium: text(pageUrl.searchParams.get("utm_medium"), 100),
            campaign: text(pageUrl.searchParams.get("utm_campaign"), 100),
            ...device(userAgent),
            country: text(request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry"), 10),
            region: text(request.headers.get("x-vercel-ip-country-region"), 100),
            networkHash,
          },
        });

    await prisma.analyticsEvent.create({
      data: {
        type: body.type,
        path: pageUrl.pathname,
        title: text(body.title),
        element: text(body.element, 50),
        label: text(body.label, 160),
        href: text(body.href),
        listingId: text(body.listingId, 100),
        visitorId: visitor.id,
        sessionId: analyticsSession.id,
        userId: session?.user?.id || null,
      },
    });

    const response = NextResponse.json({ ok: true }, { status: 202 });
    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    };
    response.cookies.set(VISITOR_COOKIE, visitorKey, { ...cookieOptions, maxAge: 60 * 60 * 24 * 365 });
    response.cookies.set(SESSION_COOKIE, sessionKey, { ...cookieOptions, maxAge: 60 * 30 });
    return response;
  } catch {
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}
