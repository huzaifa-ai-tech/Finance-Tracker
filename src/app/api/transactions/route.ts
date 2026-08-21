import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import {
  bulkDeleteSchema,
  parseOrError,
  transactionCreateSchema,
  transactionQuerySchema,
} from "@/lib/validation";

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

export async function GET(request: Request) {
  const user = await requireSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const parsed = parseOrError(transactionQuerySchema, {
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    categoryId: params.get("categoryId") ?? undefined,
    type: params.get("type") ?? undefined,
    q: params.get("q") ?? undefined,
    limit: params.get("limit") ?? undefined,
  });
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { from, to, categoryId, type, q, limit } = parsed.data;

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      ...(categoryId ? { categoryId } : {}),
      ...(type ? { category: { type } } : {}),
      ...(q ? { note: { contains: q } } : {}),
      ...(from && to ? { date: { gte: new Date(from), lt: new Date(to) } } : {}),
    },
    include: { category: true },
    orderBy: { date: "desc" },
    take: limit,
  });

  return NextResponse.json({ transactions: transactions.map(mapTransaction) });
}

export async function POST(request: Request) {
  const user = await requireSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = parseOrError(transactionCreateSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { categoryId, amount, date, note } = parsed.data;

  const category = await prisma.category.findFirst({ where: { id: categoryId, userId: user.id } });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 400 });

  const transaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      categoryId,
      amount,
      date: new Date(date),
      note: note ?? null,
    },
    include: { category: true },
  });

  return NextResponse.json({ transaction: mapTransaction(transaction) }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await requireSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = parseOrError(bulkDeleteSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { count } = await prisma.transaction.deleteMany({
    where: { id: { in: parsed.data.ids }, userId: user.id },
  });

  return NextResponse.json({ deleted: count });
}