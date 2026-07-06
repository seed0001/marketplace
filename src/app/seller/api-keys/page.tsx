import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiKeysManager } from "./ApiKeysManager";

export const dynamic = "force-dynamic";

export default async function SellerApiKeysPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/seller/api-keys");

  const [keys, requestHeaders] = await Promise.all([
    prisma.sellerApiKey.findMany({
      where: { userId: session.user.id, revokedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    headers(),
  ]);

  const host = requestHeaders.get("host") || "your-marketplace.example";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const apiBase = `${protocol}://${host}`;

  const initialKeys = keys.map((key) => ({
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    createdAt: key.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#080a0a] text-zinc-100">
      <div className="border-b border-white/[.07] bg-[#0b0e0d]/95">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-7">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[.3em] text-emerald-400">Seller · API keys</div>
            <h1 className="mt-1 text-lg font-semibold tracking-tight">Connect your own app or AI</h1>
          </div>
          <Link href="/seller/studio" className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5">
            ← Studio
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <p className="mb-6 text-sm leading-6 text-zinc-500">
          Generate a personal API key to let a local application or AI agent sign in on your behalf and manage your
          listings through the marketplace API. Each key acts only on your own account and can be revoked at any time.
        </p>
        <ApiKeysManager initialKeys={initialKeys} apiBase={apiBase} />
      </main>
    </div>
  );
}
