import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { currentMonthKey, monthKeyOf, monthLabel, monthRange } from "@/lib/format";
import type { BudgetStatus, StatsMonthly } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const month = new URL(request.url).searchParams.get("month") ?? currentMonthKey();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }

  const { start, end } = monthRange(month);

  const [transactions, budgets] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: start, lt: end } },
      include: { category: true },
      orderBy: { date: "asc" },
    }),
    prisma.budget.findMany({ where: { userId: user.id }, include: { category: true } }),
  ]);

  const totals = { income: 0, expense: 0, balance: 0 };
  const byCategoryMap = new Map<string, { category: (typeof transactions)[number]["category"]; total: number }>();

  for (const t of transactions) {
    if (t.category.type === "INCOME") totals.income += t.amount;
    else totals.expense += t.amount;
    const entry = byCategoryMap.get(t.category.id) ?? { category: t.category, total: 0 };
    entry.total += t.amount;
    byCategoryMap.set(t.category.id, entry);
  }
  totals.balance = totals.income - totals.expense;

  const monthly: StatsMonthly[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - i, 1));
    const key = monthKeyOf(d);
    const mStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    const mEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    const inRange = transactions.filter((t) => t.date >= mStart && t.date < mEnd);
    monthly.push({
      key,
      label: monthLabel(key),
      income: inRange.filter((t) => t.category.type === "INCOME").reduce((s, t) => s + t.amount, 0),
      expense: inRange.filter((t) => t.category.type === "EXPENSE").reduce((s, t) => s + t.amount, 0),
    });
  }

  const budgetStatuses: BudgetStatus[] = budgets.map((b) => {
    const spent = transactions.filter((t) => t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0);
    return {
      category: b.category,
      limit: b.monthlyLimit,
      spent,
      percent: b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0,
    };
  });

  return NextResponse.json({
    month,
    totals,
    monthly,
    byCategory: [...byCategoryMap.values()].sort((a, b) => b.total - a.total),
    budgets: budgetStatuses,
  });
}