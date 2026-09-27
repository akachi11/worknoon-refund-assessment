import { describe, it, expect, vi } from "vitest";
import { classifyWithFailover } from "../src/services/ai/classifier.js";

const validClassification = {
  decision: "APPROVED",
  confidence: 0.9,
  reasoning: "Looks good, approved.",
  claimConsistentWithRecords: true,
  flaggedConcerns: [],
};

function provider(name, impl) {
  return { name, classify: vi.fn(impl) };
}

describe("classifyWithFailover", () => {
  it("returns the primary's result when it succeeds", async () => {
    const primary = provider("gemini", async () => validClassification);
    const secondary = provider("openai", async () => validClassification);

    const result = await classifyWithFailover(
      {},
      { primary, secondary, timeoutMs: 1000, fallbackEnabled: true }
    );

    expect(result.decision).toBe("APPROVED");
    expect(result.providerUsed).toBe("gemini");
    expect(result.fallbackUsed).toBe(false);
    expect(secondary.classify).not.toHaveBeenCalled();
  });

  it("never calls the secondary provider when fallback is disabled, even if the primary fails", async () => {
    const primary = provider("gemini", async () => {
      throw new Error("boom");
    });
    const secondary = provider("openai", async () => validClassification);

    const result = await classifyWithFailover(
      {},
      { primary, secondary, timeoutMs: 1000, fallbackEnabled: false }
    );

    expect(secondary.classify).not.toHaveBeenCalled();
    expect(result.decision).toBe("ESCALATED");
    expect(result.fallbackSkipped).toBe(true);
    expect(result.providerUsed).toBeNull();
  });

  it("falls back to the secondary provider when the primary fails and fallback is enabled", async () => {
    const primary = provider("gemini", async () => {
      throw new Error("boom");
    });
    const secondary = provider("openai", async () => validClassification);

    const result = await classifyWithFailover(
      {},
      { primary, secondary, timeoutMs: 1000, fallbackEnabled: true }
    );

    expect(secondary.classify).toHaveBeenCalledOnce();
    expect(result.providerUsed).toBe("openai");
    expect(result.fallbackUsed).toBe(true);
  });

  it("returns the fail-safe ESCALATED default, never an approval, when both providers fail", async () => {
    const primary = provider("gemini", async () => {
      throw new Error("boom");
    });
    const secondary = provider("openai", async () => {
      throw new Error("also boom");
    });

    const result = await classifyWithFailover(
      {},
      { primary, secondary, timeoutMs: 1000, fallbackEnabled: true }
    );

    expect(result.decision).toBe("ESCALATED");
    expect(result.confidence).toBe(0);
    expect(result.bothFailed).toBe(true);
    expect(result.attempts).toHaveLength(2);
  });

  it("treats a malformed response as a failure, same as a network error", async () => {
    const primary = provider("gemini", async () => ({ decision: "MAYBE_APPROVED", confidence: "high" }));
    const secondary = provider("openai", async () => validClassification);

    const result = await classifyWithFailover(
      {},
      { primary, secondary, timeoutMs: 1000, fallbackEnabled: true }
    );

    expect(result.providerUsed).toBe("openai");
    expect(result.attempts[0].provider).toBe("gemini");
  });

  it("treats a provider that never resolves as a timeout failure", async () => {
    const primary = provider("gemini", () => new Promise(() => {}));
    const secondary = provider("openai", async () => validClassification);

    const result = await classifyWithFailover(
      {},
      { primary, secondary, timeoutMs: 50, fallbackEnabled: true }
    );

    expect(result.providerUsed).toBe("openai");
    expect(result.attempts[0].error).toMatch(/timed out/);
  });
});
