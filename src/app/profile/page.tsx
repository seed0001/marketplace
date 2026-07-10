import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPortfolio } from "@/lib/portfolio";
import { Portfolio } from "@/components/Portfolio";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-lg mt-16 px-4 text-center">
        <p className="text-zinc-400">
          Sign in to view your portfolio.{" "}
          <Link href="/auth/signin" className="text-emerald-400 hover:text-emerald-300">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  const data = await getPortfolio(session.user.id, true, session.user.id);
  if (!data) {
    return (
      <div className="mx-auto max-w-lg mt-16 px-4 text-center">
        <p className="text-zinc-400">Profile not found.</p>
      </div>
    );
  }

  return <Portfolio data={data} isOwner />;
}
