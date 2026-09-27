import { describe, it, expect } from "vitest";
import { reconcileDecision } from "../src/services/reconciliation.js";

const policy = { highValueThreshold: 500, aiConfidenceThreshold: 0.6 };

const eligiblePolicyResult = {
  hardDecision: null,
  hardDecisionReason: null,
  requiresHumanReview: false,
  requiresHumanReviewReasons: [],
  eligibleForApproval: true,
  eligibleForApprovalReason: "damaged_in_transit",
};

const confidentApprovedAi = {
  decision: "APPROVED",
  confidence: 0.95,
  reasoning: "Everything checks out, so I've approved this refund.",
  claimConsistentWithRecords: true,
  flaggedConcerns: [],
};

describe("reconcileDecision", () => {
  it("lets a hard policy deny win, even with a null aiResult (AI was never called)", () => {
    const result = reconcileDecision({
      policyResult: {
        hardDecision: "DENIED",
        hardDecisionReason: "final_sale_exclusion",
        requiresHumanReview: false,
        requiresHumanReviewReasons: [],
        eligibleForApproval: false,
        eligibleForApprovalReason: null,
      },
      aiResult: null,
      policy,
    });
    expect(result.finalDecision).toBe("DENIED");
    expect(result.overrideReason).toBe("hard_policy_deny");
  });

  it("forces escalation when requiresHumanReview is true, even if AI recommends approval", () => {
    const result = reconcileDecision({
      policyResult: {
        ...eligiblePolicyResult,
        requiresHumanReview: true,
        requiresHumanReviewReasons: ["high_value_review"],
      },
      aiResult: confidentApprovedAi,
      policy,
    });
    expect(result.finalDecision).toBe("ESCALATED");
    expect(result.overrideReason).toBe("requires_human_review");
  });

  it("forces escalation when the AI flags the claim as inconsistent with records, even if AI recommends approval", () => {
    const result = reconcileDecision({
      policyResult: eligiblePolicyResult,
      aiResult: { ...confidentApprovedAi, claimConsistentWithRecords: false },
      policy,
    });
    expect(result.finalDecision).toBe("ESCALATED");
    expect(result.overrideReason).toBe("claim_inconsistent");
  });

  it("forces escalation when AI confidence is below the configured threshold", () => {
    const result = reconcileDecision({
      policyResult: eligiblePolicyResult,
      aiResult: { ...confidentApprovedAi, confidence: 0.4 },
      policy,
    });
    expect(result.finalDecision).toBe("ESCALATED");
    expect(result.overrideReason).toBe("low_confidence");
  });

  it("forces escalation when AI approves but the item has no verified issue on file (core safeguard)", () => {
    const result = reconcileDecision({
      policyResult: { ...eligiblePolicyResult, eligibleForApproval: false, eligibleForApprovalReason: null },
      aiResult: confidentApprovedAi,
      policy,
    });
    expect(result.finalDecision).toBe("ESCALATED");
    expect(result.overrideReason).toBe("not_eligible_for_approval");
  });

  it("passes through the AI's own decision when nothing overrides it", () => {
    const result = reconcileDecision({
      policyResult: eligiblePolicyResult,
      aiResult: confidentApprovedAi,
      policy,
    });
    expect(result.finalDecision).toBe("APPROVED");
    expect(result.overrideApplied).toBe(false);
    expect(result.overrideReason).toBeNull();
    expect(result.reasoning).toBe(confidentApprovedAi.reasoning);
  });

  it("does not apply extra scrutiny to an AI DENIED decision, even when the item is eligible (asymmetric safeguard)", () => {
    const result = reconcileDecision({
      policyResult: eligiblePolicyResult,
      aiResult: { ...confidentApprovedAi, decision: "DENIED" },
      policy,
    });
    expect(result.finalDecision).toBe("DENIED");
    expect(result.overrideApplied).toBe(false);
  });

  it("does not leak the internal fail-safe reasoning text to the customer when the AI is unavailable", () => {
    const failSafeAi = {
      decision: "ESCALATED",
      confidence: 0,
      reasoning: "AI classification unavailable — routed to human review.",
      claimConsistentWithRecords: null,
      flaggedConcerns: ["ai_unavailable"],
    };
    const result = reconcileDecision({
      policyResult: {
        ...eligiblePolicyResult,
        requiresHumanReview: true,
        requiresHumanReviewReasons: ["high_value_review"],
      },
      aiResult: failSafeAi,
      policy,
    });
    expect(result.reasoning).not.toContain("AI classification unavailable");
  });
});
