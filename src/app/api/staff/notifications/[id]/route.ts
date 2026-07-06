import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicUrl } from "@/lib/public-url";

const idSchema = z.string().cuid();

function staffRedirect(request: NextRequest, status: "archived" | "error") {
  const url = publicUrl("/staff/notifications", request);
  url.searchParams.set("status", status);
  return NextResponse.redirect(url, { status: 303 });
}

function signInRedirect(request: NextRequest) {
  return NextResponse.redirect(publicUrl("/auth/signin?callbackUrl=/staff/notifications", request), { status: 303 });
}

async function getStaffUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!user || !["STAFF", "ADMIN"].includes(user.role)) return null;
  return user;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const staff = await getStaffUser();
  if (!staff) return signInRedirect(request);

  const { id } = await params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return staffRedirect(request, "error");

  await prisma.siteNotification.updateMany({
    where: { id: parsed.data, archivedAt: null },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/notifications");
  revalidatePath("/staff/notifications");
  return staffRedirect(request, "archived");
}
