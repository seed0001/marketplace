import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { isValidGatewayDomain, normalizeGatewayDomain } from "@/lib/sms-carriers";

const MAX_IMAGE_BYTES = 4_000_000; // ~4MB; the client compresses well below this

function isValidImage(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^(https?:\/\/|data:image\/)/.test(value) &&
    value.length <= MAX_IMAGE_BYTES
  );
}

function normalizePhone(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return "";
  const cleaned = trimmed.replace(/[^\d+]/g, "");
  if (!/^\+?\d{10,15}$/.test(cleaned)) return null;
  return cleaned.startsWith("+") ? cleaned : `+1${cleaned}`;
}

// The portfolio itself is system-generated and mostly read-only; this endpoint
// covers private profile settings such as photo and phone notification opt-in.
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const data: {
      image?: string | null;
      phoneNumber?: string | null;
      phoneCarrier?: string | null;
      phoneNotificationsEnabled?: boolean;
      emailNotificationsEnabled?: boolean;
    } = {};

    if ("image" in body) {
      if (body.image === null || body.image === "") {
        data.image = null;
      } else if (isValidImage(body.image)) {
        data.image = body.image;
      } else {
        return NextResponse.json({ error: "Invalid image" }, { status: 400 });
      }
    }

    if ("phoneNumber" in body) {
      const phoneNumber = normalizePhone(body.phoneNumber);
      if (phoneNumber === null) {
        return NextResponse.json({ error: "Enter a valid phone number with area code." }, { status: 400 });
      }
      data.phoneNumber = phoneNumber || null;
      // Clearing the number also clears the carrier and opt-in — they only make
      // sense together.
      if (!phoneNumber) {
        data.phoneNotificationsEnabled = false;
        data.phoneCarrier = null;
      }
    }

    // Stored as the carrier's email-to-SMS gateway domain (e.g. "vtext.com"),
    // whether chosen from the catalog or typed into the profile "Other" field.
    if ("phoneCarrier" in body) {
      if (body.phoneCarrier === null || body.phoneCarrier === "") {
        data.phoneCarrier = null;
      } else if (isValidGatewayDomain(body.phoneCarrier)) {
        data.phoneCarrier = normalizeGatewayDomain(String(body.phoneCarrier));
      } else {
        return NextResponse.json({ error: "Enter a valid carrier gateway domain (e.g. vtext.com)." }, { status: 400 });
      }
    }

    if ("phoneNotificationsEnabled" in body) {
      data.phoneNotificationsEnabled = Boolean(body.phoneNotificationsEnabled);
    }

    if ("emailNotificationsEnabled" in body) {
      data.emailNotificationsEnabled = Boolean(body.emailNotificationsEnabled);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        name: true,
        image: true,
        phoneNumber: true,
        phoneCarrier: true,
        phoneNotificationsEnabled: true,
        emailNotificationsEnabled: true,
      },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
