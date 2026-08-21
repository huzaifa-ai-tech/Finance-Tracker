import { describe, expect, it } from "vitest";
import {
  accountDeleteSchema,
  bulkDeleteSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  changePasswordSchema,
  exportQuerySchema,
  loginSchema,
  registerSchema,
  transactionCreateSchema,
  transactionQuerySchema,
  transactionUpdateSchema,
} from "@/lib/validation";

describe("registerSchema", () => {
  it("accepts valid input and normalizes email", () => {
    const result = registerSchema.safeParse({ email: "  Jane@Example.COM ", password: "password123" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("jane@example.com");
    }
  });

  it("rejects short passwords and bad emails", () => {
    expect(registerSchema.safeParse({ email: "jane@example.com", password: "short" }).success).toBe(false);
    expect(registerSchema.safeParse({ email: "not-an-email", password: "password123" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("rejects empty passwords", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("categoryCreateSchema", () => {
  it("defaults type to EXPENSE", () => {
    const result = categoryCreateSchema.safeParse({ name: "Groceries" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.type).toBe("EXPENSE");
  });

  it("rejects invalid colors and empty names", () => {
    expect(categoryCreateSchema.safeParse({ name: "", type: "EXPENSE" }).success).toBe(false);
    expect(categoryCreateSchema.safeParse({ name: "X", color: "red" }).success).toBe(false);
    expect(categoryCreateSchema.safeParse({ name: "X", type: "NOPE" }).success).toBe(false);
  });
});

describe("categoryUpdateSchema", () => {
  it("accepts a nullable monthlyLimit for removing budgets", () => {
    expect(categoryUpdateSchema.safeParse({ monthlyLimit: null }).success).toBe(true);
    expect(categoryUpdateSchema.safeParse({ monthlyLimit: 1000 }).success).toBe(true);
    expect(categoryUpdateSchema.safeParse({ monthlyLimit: 0 }).success).toBe(false);
    expect(categoryUpdateSchema.safeParse({ monthlyLimit: -5 }).success).toBe(false);
  });
});

describe("transactionCreateSchema", () => {
  it("accepts a valid transaction", () => {
    const result = transactionCreateSchema.safeParse({
      categoryId: "cat-1",
      amount: 1234,
      date: "2026-08-19T12:00:00.000Z",
      note: "Lunch",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-positive amounts, bad dates and long notes", () => {
    expect(transactionCreateSchema.safeParse({ categoryId: "c", amount: 0, date: "2026-08-19T12:00:00.000Z" }).success).toBe(false);
    expect(transactionCreateSchema.safeParse({ categoryId: "c", amount: 100, date: "yesterday" }).success).toBe(false);
    expect(transactionCreateSchema.safeParse({ categoryId: "c", amount: 100, date: "2026-08-19T12:00:00.000Z", note: "x".repeat(201) }).success).toBe(false);
  });
});

describe("transactionUpdateSchema", () => {
  it("allows partial updates", () => {
    expect(transactionUpdateSchema.safeParse({ note: "Updated" }).success).toBe(true);
    expect(transactionUpdateSchema.safeParse({ amount: 50 }).success).toBe(true);
    expect(transactionUpdateSchema.safeParse({ amount: 50.5 }).success).toBe(false);
  });
});

describe("transactionQuerySchema", () => {
  it("coerces limit and requires from/to together", () => {
    const result = transactionQuerySchema.safeParse({ limit: "50" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(50);

    expect(transactionQuerySchema.safeParse({ from: "2026-01-01T00:00:00Z" }).success).toBe(false);
    expect(transactionQuerySchema.safeParse({ from: "2026-01-01T00:00:00Z", to: "2026-02-01T00:00:00Z" }).success).toBe(true);
  });

  it("rejects invalid types", () => {
    expect(transactionQuerySchema.safeParse({ type: "SAVINGS" }).success).toBe(false);
  });

  it("accepts and trims a search query", () => {
    const result = transactionQuerySchema.safeParse({ q: "  salary  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.q).toBe("salary");
    expect(transactionQuerySchema.safeParse({ q: "x".repeat(101) }).success).toBe(false);
  });
});

describe("bulkDeleteSchema", () => {
  it("accepts a list of ids", () => {
    const result = bulkDeleteSchema.safeParse({ ids: ["a", "b", "c"] });
    expect(result.success).toBe(true);
  });

  it("rejects empty lists and oversized batches", () => {
    expect(bulkDeleteSchema.safeParse({ ids: [] }).success).toBe(false);
    expect(bulkDeleteSchema.safeParse({ ids: Array.from({ length: 501 }, (_, i) => String(i)) }).success).toBe(false);
  });
});

describe("exportQuerySchema", () => {
  it("requires from/to together and accepts valid pairs", () => {
    expect(exportQuerySchema.safeParse({}).success).toBe(true);
    expect(exportQuerySchema.safeParse({ from: "2026-08-01T00:00:00Z" }).success).toBe(false);
    expect(exportQuerySchema.safeParse({ from: "2026-08-01T00:00:00Z", to: "2026-09-01T00:00:00Z" }).success).toBe(true);
  });
});

describe("accountDeleteSchema", () => {
  it("requires a password", () => {
    expect(accountDeleteSchema.safeParse({ password: "secret" }).success).toBe(true);
    expect(accountDeleteSchema.safeParse({ password: "" }).success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts matching new passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old-pass",
      newPassword: "new-password-1",
      confirmPassword: "new-password-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords and short new passwords", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "old-pass",
        newPassword: "new-password-1",
        confirmPassword: "different",
      }).success,
    ).toBe(false);

    expect(
      changePasswordSchema.safeParse({
        currentPassword: "old-pass",
        newPassword: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);
  });
});