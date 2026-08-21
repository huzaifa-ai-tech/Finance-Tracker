import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { categoryUpdateSchema, parseOrError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await ctx.params;
  const existing = await prisma.category.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = parseOrError(categoryUpdateSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { name, type, color, monthlyLimit } = parsed.data;

  if (name && name !== existing.name) {
    const conflict = await prisma.category.findFirst({ where: { userId: user.id, name } });
    if (conflict) return NextResponse.json({ error: "A category with this name already exists" }, { status: 409 });
  }

  await prisma.category.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(type ? { type } : {}),
      ...(color ? { color } : {}),
    },
  });

  if (monthlyLimit !== undefined) {
    if (monthlyLimit === null) {
      await prisma.budget.deleteMany({ where: { categoryId: id } });
    } else {
      await prisma.budget.upsert({
        where: { categoryId: id },
        create: { userId: user.id, categoryId: id, monthlyLimit },
        update: { monthlyLimit },
      });
    }
  }

  const updated = await prisma.category.findUnique({
    where: { id },
    include: { budget: true },
  });

  return NextResponse.json({ category: updated });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await ctx.params;
  const existing = await prisma.category.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const inUse = await prisma.transaction.count({ where: { categoryId: id } });
  if (inUse > 0) {
    return NextResponse.json(
      { error: "Cannot delete a category that has transactions" },
      { status: 409 },
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}