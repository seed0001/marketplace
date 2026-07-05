import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPortfolio } from "@/lib/portfolio";
import { Portfolio } from "@/components/Portfolio";

export const dynamic = "force-dynamic";

export default async function UserProfilePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/users/${id}`)}`);
  const isOwner = session?.user?.id === id;

  // Owners get their private analytics even when landing on their public URL.
  const data = await getPortfolio(id, isOwner);
  if (!data) notFound();

  return <Portfolio data={data} isOwner={isOwner} />;
}
