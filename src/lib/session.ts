import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "pb_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type SessionPayload = { uid: string; exp: number };

function hmacKey(): string {
  return process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me";
}

function base64urlEncode(data: Buffer): string {
  return data.toString("base64url");
}

function base64urlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

function buildToken(userId: string, expiresAtMs: number): string {
  const payload: SessionPayload = { uid: userId, exp: expiresAtMs };
  const payloadB64 = base64urlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const signature = createHmac("sha256", hmacKey()).update(payloadB64).digest("base64url");
  return `${signature}.${payloadB64}`;
}

export function createSessionToken(userId: string): string {
  return buildToken(userId, Date.now() + SESSION_TTL_SECONDS * 1000);
}

export function buildSessionTokenWithExpiry(userId: string, expiresAtMs: number): string {
  return buildToken(userId, expiresAtMs);
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [signature, payloadB64] = token.split(".");
  if (!signature || !payloadB64) return null;
  const expected = createHmac("sha256", hmacKey()).update(payloadB64).digest("base64url");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const payload = JSON.parse(base64urlDecode(payloadB64).toString("utf8")) as SessionPayload;
    if (typeof payload.uid !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};