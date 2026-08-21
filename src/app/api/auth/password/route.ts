import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireSessionUser, verifyPassword } from "@/lib/auth";
import { changePasswordSchema, parseOrError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await requireSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = parseOrError(changePasswordSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { currentPassword, newPassword } = parsed.data;

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record || !(await verifyPassword(currentPassword, record.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return NextResponse.json({ ok: true });
}