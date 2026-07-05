import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { queueDiscordEvent } from "@/lib/discord";

export async function POST(request: NextRequest) {
  const { name, email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });
  await queueDiscordEvent("members", "New marketplace member", {
    description: `${user.name || "A new member"} created a VibeMarket account.`,
    color: 0x60a5fa,
    fields: [{ name: "Account", value: user.email }],
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
}
