import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import CategoryManager from "@/components/CategoryManager";
import DeleteAccountForm from "@/components/DeleteAccountForm";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [categories, budgets] = await Promise.all([
    prisma.category.findMany({
      where: { userId: user.id },
      include: { budget: true },
      orderBy: { name: "asc" },
    }),
    prisma.budget.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Settings</h1>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Name</dt>
            <dd className="font-medium text-zinc-800">{user.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Email</dt>
            <dd className="font-medium text-zinc-800">{user.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Member since</dt>
            <dd className="font-medium text-zinc-800">{formatDate(user.createdAt)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Active budgets</dt>
            <dd className="font-medium text-zinc-800">{budgets}</dd>
          </div>
        </dl>
      </div>

      <CategoryManager categories={categories} />

      <ChangePasswordForm />

      <DeleteAccountForm />
    </div>
  );
}