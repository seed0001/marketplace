import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

const MAX_IMAGE_BYTES = 4_000_000; // ~4MB; the client compresses well below this

function isValidImage(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^(https?:\/\/|data:image\/)/.test(value) &&
    value.length <= MAX_IMAGE_BYTES
  );
}

// The portfolio itself is system-generated and read-only; the profile photo is
// the one thing the user controls, so it gets its own tightly-scoped endpoint.
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const data: { image?: string | null } = {};

    if ("image" in body) {
      if (body.image === null || body.image === "") {
        data.image = null;
      } else if (isValidImage(body.image)) {
        data.image = body.image;
      } else {
        return NextResponse.json({ error: "Invalid image" }, { status: 400 });
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, name: true, image: true },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
