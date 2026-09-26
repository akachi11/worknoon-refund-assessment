import { evaluatePolicy } from "./policyEngine.js";
import { classifyWithFailover } from "./ai/classifier.js";
import { reconcileDecision } from "./reconciliation.js";
import { NotFoundError, ValidationError } from "../errors.js";

export function createRefundService({
  prisma,
  policy,
  primaryProvider,
  secondaryProvider,
  fallbackEnabled,
  timeoutMs,
}) {
  return { submitRefundRequest };

  async function submitRefundRequest({ customerId, orderId, orderItemId, message }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundError("Order not found.");
    if (order.customerId !== customerId) {
      throw new ValidationError("This order does not belong to the given customer.");
    }

    const item = order.items.find((i) => i.id === orderItemId);
    if (!item) throw new NotFoundError("Item not found on this order.");

    const windowStart = new Date(Date.now() - policy.rateLimiting.windowHours * 60 * 60 * 1000);
    const recentRequestCount = await prisma.refundRequest.count({
      where: { customerId, createdAt: { gte: windowStart } },
    });

    const policyResult = evaluatePolicy({ order, item, recentRequestCount, policy });

    const auditEvents = [
      { actor: "policy_engine", action: "policy_evaluated", detail: policyResult },
    ];

    let aiResult = null;

    if (policyResult.hardDecision !== "DENIED") {
      const context = {
        order,
        item,
        policyContext: policyResult,
        policyRules: policy.rules,
        customerMessage: message,
      };

      aiResult = await classifyWithFailover(context, {
        primary: primaryProvider,
        secondary: secondaryProvider,
        timeoutMs,
        fallbackEnabled,
      });

      for (const failedAttempt of aiResult.attempts) {
        auditEvents.push({
          actor: `ai_${failedAttempt.provider}`,
          action: "ai_call_failed",
          detail: { error: failedAttempt.error },
        });
      }

      if (aiResult.providerUsed) {
        auditEvents.push({
          actor: `ai_${aiResult.providerUsed}`,
          action: "ai_call_succeeded",
          detail: {
            decision: aiResult.decision,
            confidence: aiResult.confidence,
            claimConsistentWithRecords: aiResult.claimConsistentWithRecords,
            flaggedConcerns: aiResult.flaggedConcerns,
          },
        });
      } else {
        auditEvents.push({
          actor: "system",
          action: "ai_unavailable",
          detail: {
            fallbackSkipped: aiResult.fallbackSkipped ?? false,
            bothFailed: aiResult.bothFailed ?? false,
          },
        });
      }
    }

    const reconciliationResult = reconcileDecision({ policyResult, aiResult, policy });

    auditEvents.push({
      actor: "system",
      action: "decision_reconciled",
      detail: reconciliationResult,
    });

    return prisma.refundRequest.create({
      data: {
        customerId,
        orderId,
        orderItemId,
        message,
        policyOutput: policyResult,
        aiOutput: aiResult ?? undefined,
        finalDecision: reconciliationResult.finalDecision,
        reasoning: reconciliationResult.reasoning,
        auditLogs: { create: auditEvents },
      },
      include: { auditLogs: true },
    });
  }
}
