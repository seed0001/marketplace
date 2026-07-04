import { auth } from "./auth";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session as typeof session & { user: NonNullable<typeof session.user> & { id: string } };
}
