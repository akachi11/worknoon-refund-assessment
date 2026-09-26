import { ClassificationSchema } from "./schema.js";

const FAIL_SAFE_RESULT = {
  decision: "ESCALATED",
  confidence: 0,
  reasoning: "AI classification unavailable — routed to human review.",
  claimConsistentWithRecords: null,
  flaggedConcerns: ["ai_unavailable"],
};

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function attempt(provider, context, timeoutMs) {
  const raw = await withTimeout(provider.classify(context), timeoutMs);
  return ClassificationSchema.parse(raw);
}

export async function classifyWithFailover(
  context,
  { primary, secondary, timeoutMs = 8000, fallbackEnabled = false }
) {
  const attempts = [];

  try {
    const result = await attempt(primary, context, timeoutMs);
    return { ...result, providerUsed: primary.name, fallbackUsed: false, attempts };
  } catch (err) {
    attempts.push({ provider: primary.name, error: err.message });

    if (!fallbackEnabled) {
      return {
        ...FAIL_SAFE_RESULT,
        providerUsed: null,
        fallbackUsed: false,
        fallbackSkipped: true,
        attempts,
      };
    }

    try {
      const result = await attempt(secondary, context, timeoutMs);
      return { ...result, providerUsed: secondary.name, fallbackUsed: true, attempts };
    } catch (err2) {
      attempts.push({ provider: secondary.name, error: err2.message });
      return {
        ...FAIL_SAFE_RESULT,
        providerUsed: null,
        fallbackUsed: true,
        bothFailed: true,
        attempts,
      };
    }
  }
}
