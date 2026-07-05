import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireStaff() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/staff/analytics");

  // Re-check the database on every staff request so demotions take effect
  // immediately instead of waiting for an auth token to expire.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user || !["STAFF", "ADMIN"].includes(user.role)) redirect("/");
  return user;
}

export async function requireAdministrator() {
  const user = await requireStaff();
  if (user.role !== "ADMIN") redirect("/staff/analytics");
  return user;
}
