import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema, parseOrError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseOrError(loginSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const response = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
  response.cookies.set(SESSION_COOKIE, createSessionToken(user.id), sessionCookieOptions);
  return response;
}