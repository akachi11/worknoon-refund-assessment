const HARD_DENY_REASONING = {
  final_sale_exclusion:
    "This item was sold under clearance terms and is not eligible for refund under our final sale policy.",
  refund_window:
    "This request was submitted after our refund window for this order has passed.",
};

export function reconcileDecision({ policyResult, aiResult, policy }) {
  if (policyResult.hardDecision === "DENIED") {
    return {
      finalDecision: "DENIED",
      reasoning:
        HARD_DENY_REASONING[policyResult.hardDecisionReason] ??
        "This request does not meet our refund policy.",
      overrideApplied: true,
      overrideReason: "hard_policy_deny",
    };
  }

  if (policyResult.requiresHumanReview) {
    const reasons = policyResult.requiresHumanReviewReasons.join(", ");
    return {
      finalDecision: "ESCALATED",
      reasoning: `This request requires human review (${reasons}). AI assessment: ${aiResult.reasoning}`,
      overrideApplied: true,
      overrideReason: "requires_human_review",
    };
  }

  if (aiResult.claimConsistentWithRecords === false) {
    return {
      finalDecision: "ESCALATED",
      reasoning: `The customer's account does not match our verified records, so this has been escalated for human review. AI assessment: ${aiResult.reasoning}`,
      overrideApplied: true,
      overrideReason: "claim_inconsistent",
    };
  }

  if (aiResult.confidence < policy.aiConfidenceThreshold) {
    return {
      finalDecision: "ESCALATED",
      reasoning: `Our system was not confident enough in an automated assessment of this request, so it has been escalated for human review. AI assessment: ${aiResult.reasoning}`,
      overrideApplied: true,
      overrideReason: "low_confidence",
    };
  }

  if (aiResult.decision === "APPROVED" && !policyResult.eligibleForApproval) {
    return {
      finalDecision: "ESCALATED",
      reasoning: `An automated assessment recommended approval, but no verified issue is on file for this item, so it has been escalated for human review rather than approved automatically. AI assessment: ${aiResult.reasoning}`,
      overrideApplied: true,
      overrideReason: "not_eligible_for_approval",
    };
  }

  return {
    finalDecision: aiResult.decision,
    reasoning: aiResult.reasoning,
    overrideApplied: false,
    overrideReason: null,
  };
}
