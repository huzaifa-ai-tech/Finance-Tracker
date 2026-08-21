import { describe, expect, it } from "vitest";
import {
  buildSessionTokenWithExpiry,
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  verifySessionToken,
} from "@/lib/session";

describe("session", () => {
  it("round-trips a valid token", () => {
    const token = createSessionToken("user-123");
    expect(verifySessionToken(token)?.uid).toBe("user-123");
  });

  it("rejects a tampered signature", () => {
    const [sig, payload] = createSessionToken("user-123").split(".");
    expect(verifySessionToken(`${sig}x.${payload}`)).toBeNull();
    expect(verifySessionToken(`${sig}.${payload}x`)).toBeNull();
  });

  it("rejects expired tokens", () => {
    const token = buildSessionTokenWithExpiry("user-123", Date.now() - 1000);
    expect(verifySessionToken(token)).toBeNull();
  });

  it("is httpOnly with a 30-day lifetime", () => {
    expect(sessionCookieOptions.httpOnly).toBe(true);
    expect(sessionCookieOptions.maxAge).toBe(SESSION_TTL_SECONDS);
    expect(SESSION_TTL_SECONDS).toBe(60 * 60 * 24 * 30);
  });

  it("exposes the session cookie name", () => {
    expect(SESSION_COOKIE).toBe("pb_session");
  });
});