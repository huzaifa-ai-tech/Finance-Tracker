import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { parseOrError, transactionUpdateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Category = { id: string; name: string; type: "INCOME" | "EXPENSE"; color: string };

function mapTransaction(t: {
  id: string;
  categoryId: string;
  amount: number;
  date: Date;
  note: string | null;
  category: Category;
}) {
  return {
    id: t.id,
    categoryId: t.categoryId,
    amount: t.amount,
    date: t.date.toISOString(),
    note: t.note,
    category: t.category,
  };
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await ctx.params;
  const existing = await prisma.transaction.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = parseOrError(transactionUpdateSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { categoryId, amount, date, note } = parsed.data;

  if (categoryId && categoryId !== existing.categoryId) {
    const category = await prisma.category.findFirst({ where: { id: categoryId, userId: user.id } });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 400 });
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      ...(categoryId ? { categoryId } : {}),
      ...(amount !== undefined ? { amount } : {}),
      ...(date ? { date: new Date(date) } : {}),
      ...(note !== undefined ? { note: note ?? null } : {}),
    },
    include: { category: true },
  });

  return NextResponse.json({ transaction: mapTransaction(transaction) });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await ctx.params;
  const existing = await prisma.transaction.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}