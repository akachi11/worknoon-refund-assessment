import { z } from "zod";

export const ClassificationSchema = z.object({
  decision: z.enum(["APPROVED", "DENIED", "ESCALATED"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1).max(2000),
  claimConsistentWithRecords: z.boolean(),
  flaggedConcerns: z.array(z.string()).default([]),
});
