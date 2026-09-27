const HARD_DENY_REASONING = {
  final_sale_exclusion:
    "This item was part of a clearance sale, and clearance items are sold as final — so unfortunately it isn't eligible for a refund.",
  refund_window:
    "This one came in after our refund window for the order had already closed, so we're not able to process a refund for it.",
};

const REVIEW_REASON_PHRASES = {
  high_value_review: (policy) =>
    `it's over our $${Number(policy.highValueThreshold).toFixed(0)} threshold for automatic approval`,
  repeated_requests: () => "we've had a few refund requests come in from this account recently",
};

function describeReviewReasons(reasons, policy) {
  const phrases = reasons.map((r) => REVIEW_REASON_PHRASES[r]?.(policy) ?? r);
  if (phrases.length === 1) return phrases[0];
  return `${phrases.slice(0, -1).join(", ")} and ${phrases[phrases.length - 1]}`;
}

// The fail-safe result (both AI providers down, or fallback disabled) has no
// real assessment behind it — its `reasoning` is an internal "unavailable"
// note, not something to show a customer. Everywhere else, the AI's own
// reasoning is genuine and already written conversationally (see
// promptBuilder.js), so it's worth keeping rather than replacing with a
// canned line.
function hasRealAssessment(aiResult) {
  return Boolean(aiResult) && !aiResult.flaggedConcerns?.includes("ai_unavailable");
}

export function reconcileDecision({ policyResult, aiResult, policy }) {
  if (policyResult.hardDecision === "DENIED") {
    return {
      finalDecision: "DENIED",
      reasoning:
        HARD_DENY_REASONING[policyResult.hardDecisionReason] ??
        "This request doesn't meet our refund policy, so we're not able to approve it.",
      overrideApplied: true,
      overrideReason: "hard_policy_deny",
    };
  }

  if (policyResult.requiresHumanReview) {
    const why = describeReviewReasons(policyResult.requiresHumanReviewReasons, policy);
    const lead = hasRealAssessment(aiResult) ? `${aiResult.reasoning} ` : "Thanks for reaching out. ";
    return {
      finalDecision: "ESCALATED",
      reasoning: `${lead}Since ${why}, we'd like a member of our team to personally confirm everything before we finalize this — we'll follow up with you soon.`,
      overrideApplied: true,
      overrideReason: "requires_human_review",
    };
  }

  if (aiResult.claimConsistentWithRecords === false) {
    return {
      finalDecision: "ESCALATED",
      reasoning: `${aiResult.reasoning} We'll follow up with you shortly.`,
      overrideApplied: true,
      overrideReason: "claim_inconsistent",
    };
  }

  if (aiResult.confidence < policy.aiConfidenceThreshold) {
    const lead = hasRealAssessment(aiResult)
      ? aiResult.reasoning
      : "This one isn't entirely clear-cut from where we're sitting, so we'd like a team member to double-check it before finalizing anything.";
    return {
      finalDecision: "ESCALATED",
      reasoning: `${lead} We'll follow up with you soon.`,
      overrideApplied: true,
      overrideReason: "low_confidence",
    };
  }

  if (aiResult.decision === "APPROVED" && !policyResult.eligibleForApproval) {
    return {
      finalDecision: "ESCALATED",
      reasoning: `${aiResult.reasoning} We'll follow up with you soon.`,
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
