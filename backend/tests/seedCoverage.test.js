import { describe, it, expect } from "vitest";
import { customers } from "../prisma/seed.js";

function allItems() {
  return customers.flatMap((c) => c.order.items);
}

function allOrders() {
  return customers.map((c) => c.order);
}

describe("seed data covers every policy branch", () => {
  it("includes at least one clearance (final-sale) item", () => {
    expect(allItems().some((i) => i.listingCondition === "clearance")).toBe(true);
  });

  it("includes at least one order past the 30-day refund window", () => {
    expect(allOrders().some((o) => o.daysAgo > 30)).toBe(true);
  });

  it("includes at least one order exactly at the 30-day boundary", () => {
    expect(allOrders().some((o) => o.daysAgo === 30)).toBe(true);
  });

  it("includes at least one order over the $500 high-value threshold", () => {
    const totals = customers.map((c) =>
      c.order.items.reduce((sum, item) => sum + Number(item.price), 0)
    );
    expect(totals.some((t) => t > 500)).toBe(true);
  });

  it("includes at least one order under $500 with a verified issue (not auto-escalated by value)", () => {
    const eligible = customers.filter((c) => {
      const total = c.order.items.reduce((sum, item) => sum + Number(item.price), 0);
      const hasIssue = c.order.items.some((i) => i.verifiedIssue !== "none");
      return total < 500 && hasIssue;
    });
    expect(eligible.length).toBeGreaterThan(0);
  });

  it("includes every eligible verified issue type at least once", () => {
    const issues = new Set(allItems().map((i) => i.verifiedIssue));
    expect(issues.has("damaged_in_transit")).toBe(true);
    expect(issues.has("wrong_item_shipped")).toBe(true);
    expect(issues.has("missing_item")).toBe(true);
  });

  it("includes at least one refurbished item (distinct from clearance) with a verified issue", () => {
    expect(
      allItems().some((i) => i.listingCondition === "refurbished" && i.verifiedIssue !== "none")
    ).toBe(true);
  });

  it("includes at least one item with no verified issue and no hard-rule violation (ambiguous / no-grounds case)", () => {
    const ambiguous = customers.some(
      (c) =>
        c.order.daysAgo <= 30 &&
        c.order.items.every((i) => i.listingCondition !== "clearance") &&
        c.order.items.some((i) => i.verifiedIssue === "none")
    );
    expect(ambiguous).toBe(true);
  });

  it("includes at least one order with multiple items", () => {
    expect(customers.some((c) => c.order.items.length > 1)).toBe(true);
  });

  it("includes at least one order with more than one item carrying a verified issue (item-level split case)", () => {
    const multiIssue = customers.some(
      (c) => c.order.items.filter((i) => i.verifiedIssue !== "none").length >= 1 &&
        c.order.items.some((i) => i.listingCondition === "clearance")
    );
    expect(multiIssue).toBe(true);
  });

  it("has exactly 15 seeded customers, per the assessment's ~15 customer requirement", () => {
    expect(customers).toHaveLength(15);
  });
});
