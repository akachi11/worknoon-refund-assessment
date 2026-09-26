const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function evaluatePolicy({ order, item, recentRequestCount, policy }) {
  const result = {
    policyVersion: policy.version,
    hardDecision: null,
    hardDecisionReason: null,
    requiresHumanReview: false,
    requiresHumanReviewReasons: [],
    eligibleForApproval: false,
    eligibleForApprovalReason: null,
  };

  if (policy.nonRefundableListingConditions.includes(item.listingCondition)) {
    result.hardDecision = "DENIED";
    result.hardDecisionReason = "final_sale_exclusion";
    return result;
  }

  // Strictly greater-than: an order exactly at the window boundary is still eligible.
  const orderAgeDays = (Date.now() - new Date(order.orderDate).getTime()) / MS_PER_DAY;
  if (orderAgeDays > policy.refundWindowDays) {
    result.hardDecision = "DENIED";
    result.hardDecisionReason = "refund_window";
    return result;
  }

  if (Number(order.total) > policy.highValueThreshold) {
    result.requiresHumanReviewReasons.push("high_value_review");
  }

  if (recentRequestCount >= policy.rateLimiting.maxRequestsPerCustomerPerWindow) {
    result.requiresHumanReviewReasons.push("repeated_requests");
  }

  result.requiresHumanReview = result.requiresHumanReviewReasons.length > 0;

  if (policy.eligibleVerifiedIssues.includes(item.verifiedIssue)) {
    result.eligibleForApproval = true;
    result.eligibleForApprovalReason = item.verifiedIssue;
  }

  return result;
}
