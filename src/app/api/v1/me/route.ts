import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, jsonWithApiUsage } from "@/lib/api-keys";

// Whoami for API-key clients: lets a local app confirm its key works and
// discover which seller account it is acting on before making changes.
export async function GET(request: NextRequest) {
  const principal = await authenticateApiKey(request);
  if (!principal) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: principal.userId },
    select: { id: true, name: true, email: true, image: true },
  });
  if (!user) return jsonWithApiUsage(request, principal, "GET /api/v1/me", { error: "Account not found" }, { status: 404 });

  return jsonWithApiUsage(request, principal, "GET /api/v1/me", { user });
}
