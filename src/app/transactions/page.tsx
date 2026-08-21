import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import TransactionsView from "@/components/TransactionsView";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  return <TransactionsView categories={categories} />;
}