import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authenticated");
  }
}

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.uid } });
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt.toISOString() };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}