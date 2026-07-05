import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { deliverDiscordEvent } from "@/lib/discord";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = await prisma.user.findFirst({ where: { id: session.user.id, role: "ADMIN" }, select: { id: true } });
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = z.object({ deliveryId: z.string().cuid() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid delivery." }, { status: 400 });
  await prisma.discordDelivery.update({ where: { id: parsed.data.deliveryId }, data: { status: "pending", lastError: null } });
  await deliverDiscordEvent(parsed.data.deliveryId);
  const result = await prisma.discordDelivery.findUnique({ where: { id: parsed.data.deliveryId } });
  if (result?.status !== "delivered") return NextResponse.json({ error: result?.lastError || "Retry failed." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
