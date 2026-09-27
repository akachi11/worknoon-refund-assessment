import { describe, it, expect } from "vitest";
import { evaluatePolicy } from "../src/services/policyEngine.js";

const policy = {
  version: "1.0.0",
  refundWindowDays: 30,
  highValueThreshold: 500,
  rateLimiting: { maxRequestsPerCustomerPerWindow: 3, windowHours: 24 },
  nonRefundableListingConditions: ["clearance"],
  eligibleVerifiedIssues: ["damaged_in_transit", "wrong_item_shipped", "missing_item"],
};

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

const baseOrder = { orderDate: daysAgo(5), total: 100, status: "delivered" };
const baseItem = { listingCondition: "new", verifiedIssue: "none" };

describe("evaluatePolicy", () => {
  it("hard-denies a clearance item regardless of anything else", () => {
    const result = evaluatePolicy({
      order: { ...baseOrder, total: 50 },
      item: { ...baseItem, listingCondition: "clearance", verifiedIssue: "damaged_in_transit" },
      recentRequestCount: 0,
      policy,
    });
    expect(result.hardDecision).toBe("DENIED");
    expect(result.hardDecisionReason).toBe("final_sale_exclusion");
  });

  it("hard-denies an order past the refund window", () => {
    const result = evaluatePolicy({
      order: { ...baseOrder, orderDate: daysAgo(31) },
      item: baseItem,
      recentRequestCount: 0,
      policy,
    });
    expect(result.hardDecision).toBe("DENIED");
    expect(result.hardDecisionReason).toBe("refund_window");
  });

  it("treats the refund window boundary as inclusive (exactly 30 days is still eligible)", () => {
    const result = evaluatePolicy({
      order: { ...baseOrder, orderDate: daysAgo(30) },
      item: baseItem,
      recentRequestCount: 0,
      policy,
    });
    expect(result.hardDecision).toBeNull();
  });

  it("flags high-value orders for human review without denying them", () => {
    const result = evaluatePolicy({
      order: { ...baseOrder, total: 501 },
      item: baseItem,
      recentRequestCount: 0,
      policy,
    });
    expect(result.hardDecision).toBeNull();
    expect(result.requiresHumanReview).toBe(true);
    expect(result.requiresHumanReviewReasons).toContain("high_value_review");
  });

  it("does not flag an order exactly at the high-value threshold", () => {
    const result = evaluatePolicy({
      order: { ...baseOrder, total: 500 },
      item: baseItem,
      recentRequestCount: 0,
      policy,
    });
    expect(result.requiresHumanReviewReasons).not.toContain("high_value_review");
  });

  it("flags repeated requests for human review", () => {
    const result = evaluatePolicy({
      order: baseOrder,
      item: baseItem,
      recentRequestCount: 3,
      policy,
    });
    expect(result.requiresHumanReview).toBe(true);
    expect(result.requiresHumanReviewReasons).toContain("repeated_requests");
  });

  it("can flag both high-value and repeated-request reasons at once", () => {
    const result = evaluatePolicy({
      order: { ...baseOrder, total: 999 },
      item: baseItem,
      recentRequestCount: 5,
      policy,
    });
    expect(result.requiresHumanReviewReasons).toEqual(
      expect.arrayContaining(["high_value_review", "repeated_requests"])
    );
  });

  it("marks an item eligible for approval when it has a qualifying verified issue", () => {
    const result = evaluatePolicy({
      order: baseOrder,
      item: { ...baseItem, verifiedIssue: "wrong_item_shipped" },
      recentRequestCount: 0,
      policy,
    });
    expect(result.eligibleForApproval).toBe(true);
    expect(result.eligibleForApprovalReason).toBe("wrong_item_shipped");
  });

  it("does not mark an item eligible when there is no verified issue", () => {
    const result = evaluatePolicy({
      order: baseOrder,
      item: baseItem,
      recentRequestCount: 0,
      policy,
    });
    expect(result.eligibleForApproval).toBe(false);
    expect(result.eligibleForApprovalReason).toBeNull();
  });

  it("reads exclusion list from policy config, not a hardcoded value", () => {
    const customPolicy = { ...policy, nonRefundableListingConditions: ["open_box"] };
    const result = evaluatePolicy({
      order: baseOrder,
      item: { ...baseItem, listingCondition: "open_box" },
      recentRequestCount: 0,
      policy: customPolicy,
    });
    expect(result.hardDecision).toBe("DENIED");
    expect(result.hardDecisionReason).toBe("final_sale_exclusion");
  });

  it("stamps the policy version onto the result", () => {
    const result = evaluatePolicy({
      order: baseOrder,
      item: baseItem,
      recentRequestCount: 0,
      policy,
    });
    expect(result.policyVersion).toBe("1.0.0");
  });
});
