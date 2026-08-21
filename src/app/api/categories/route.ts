import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { categoryCreateSchema, parseOrError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    include: { budget: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const user = await requireSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = parseOrError(categoryCreateSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { name, type, color } = parsed.data;

  const existing = await prisma.category.findFirst({ where: { userId: user.id, name } });
  if (existing) return NextResponse.json({ error: "A category with this name already exists" }, { status: 409 });

  const category = await prisma.category.create({
    data: { userId: user.id, name, type, color },
    include: { budget: true },
  });

  return NextResponse.json({ category }, { status: 201 });
}