import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { exportQuerySchema, parseOrError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const parsed = parseOrError(exportQuerySchema, {
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
  });
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { from, to } = parsed.data;

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      ...(from && to ? { date: { gte: new Date(from), lt: new Date(to) } } : {}),
    },
    include: { category: true },
    orderBy: { date: "asc" },
  });

  const rows = transactions.map((t) => {
    const date = t.date.toISOString().slice(0, 10);
    const amountPkr = (t.amount / 100).toFixed(2);
    const note = t.note ? `"${t.note.replace(/"/g, '""')}"` : "";
    return [date, t.category.name, t.category.type, amountPkr, note].join(",");
  });

  const csv = "\uFEFFDate,Category,Type,Amount (PKR),Note\n" + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}