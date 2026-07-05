import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deliverDiscordEvent } from "@/lib/discord";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = await prisma.user.findFirst({ where: { id: session.user.id, role: "ADMIN" }, select: { id: true } });
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { eventType } = await request.json();
  const channel = await prisma.discordChannelConfig.findUnique({ where: { eventType } });
  if (!channel) return NextResponse.json({ error: "Unknown reporting channel." }, { status: 400 });
  const delivery = await prisma.discordDelivery.create({
    data: {
      eventType,
      title: `Test: ${channel.label}`,
      channelConfigId: channel.id,
      payload: { description: "This is a live configuration test from the VibeMarket Discord management portal.", color: 0x8b5cf6, fields: [{ name: "Result", value: "Website → Discord delivery is connected." }] },
    },
  });
  await deliverDiscordEvent(delivery.id);
  const result = await prisma.discordDelivery.findUnique({ where: { id: delivery.id } });
  if (result?.status !== "delivered") return NextResponse.json({ error: result?.lastError || "Test delivery failed." }, { status: 502 });
  return NextResponse.json({ ok: true, messageId: result.discordMessageId });
}
