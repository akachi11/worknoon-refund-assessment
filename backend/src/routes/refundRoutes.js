import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { refundRequestLimiter } from "../middleware/rateLimiter.js";

const submitRefundSchema = z.object({
  customerId: z.string().uuid(),
  orderId: z.string().uuid(),
  orderItemId: z.string().uuid(),
  message: z.string().min(1).max(1000),
});

export function refundRoutes({ refundService }) {
  const router = Router();

  router.post(
    "/refund-requests",
    refundRequestLimiter,
    validate(submitRefundSchema),
    async (req, res, next) => {
      try {
        const request = await refundService.submitRefundRequest(req.body);
        res.status(201).json({
          id: request.id,
          finalDecision: request.finalDecision,
          reasoning: request.reasoning,
          createdAt: request.createdAt,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
