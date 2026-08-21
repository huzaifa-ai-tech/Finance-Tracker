import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser, verifyPassword } from "@/lib/auth";
import { accountDeleteSchema, parseOrError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const user = await requireSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = parseOrError(accountDeleteSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record || !(await verifyPassword(parsed.data.password, record.passwordHash))) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
  }

  await prisma.user.delete({ where: { id: user.id } });

  const response = NextResponse.json({ ok: true });
  response.cookies.set("pb_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}