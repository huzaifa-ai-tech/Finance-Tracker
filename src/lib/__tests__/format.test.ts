import { describe, expect, it } from "vitest";
import {
  currentMonthKey,
  formatCurrency,
  formatDate,
  monthKeyOf,
  monthLabel,
  monthRange,
} from "@/lib/format";

describe("formatCurrency", () => {
  it("formats cents as PKR", () => {
    expect(formatCurrency(0)).toBe("Rs 0.00");
    expect(formatCurrency(450000)).toBe("Rs 4,500.00");
    expect(formatCurrency(1234)).toBe("Rs 12.34");
    expect(formatCurrency(-500)).toBe("Rs -5.00");
  });
});

describe("formatDate", () => {
  it("formats ISO dates with UTC timezone", () => {
    expect(formatDate("2026-08-19T12:00:00.000Z")).toBe("Aug 19, 2026");
  });
});

describe("month helpers", () => {
  it("computes month ranges with UTC boundaries", () => {
    const { start, end } = monthRange("2026-08");
    expect(start.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });

  it("derives keys and labels", () => {
    expect(monthKeyOf(new Date(Date.UTC(2026, 7, 15)))).toBe("2026-08");
    expect(monthLabel("2026-08")).toBe("Aug");
  });

  it("matches currentMonthKey format", () => {
    expect(currentMonthKey()).toMatch(/^\d{4}-\d{2}$/);
  });
});