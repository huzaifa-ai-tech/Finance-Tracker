import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  hashPassword,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { parseOrError, registerSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseOrError(registerSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: name ?? null,
      passwordHash: await hashPassword(password),
    },
  });

  const response = NextResponse.json(
    { user: { id: user.id, email: user.email, name: user.name } },
    { status: 201 },
  );
  response.cookies.set(SESSION_COOKIE, createSessionToken(user.id), sessionCookieOptions);
  return response;
}