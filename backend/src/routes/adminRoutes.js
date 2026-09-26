import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { NotFoundError } from "../errors.js";

const listQuerySchema = z.object({
  finalDecision: z.enum(["APPROVED", "DENIED", "ESCALATED"]).optional(),
  customerId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export function adminRoutes({ prisma }) {
  const router = Router();

  router.get(
    "/admin/refund-requests",
    validate(listQuerySchema, "query"),
    async (req, res, next) => {
      try {
        const { finalDecision, customerId, from, to, page, pageSize } = req.query;

        const where = {
          ...(finalDecision ? { finalDecision } : {}),
          ...(customerId ? { customerId } : {}),
          ...(from || to
            ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
            : {}),
        };

        const [items, total] = await Promise.all([
          prisma.refundRequest.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
              customer: { select: { name: true, email: true } },
              orderItem: { select: { name: true } },
            },
          }),
          prisma.refundRequest.count({ where }),
        ]);

        res.json({
          items: items.map((r) => ({
            id: r.id,
            customerName: r.customer.name,
            customerEmail: r.customer.email,
            orderId: r.orderId,
            itemName: r.orderItem.name,
            finalDecision: r.finalDecision,
            reasoning: r.reasoning,
            createdAt: r.createdAt,
          })),
          total,
          page,
          pageSize,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get("/admin/refund-requests/:id", async (req, res, next) => {
    try {
      const request = await prisma.refundRequest.findUnique({
        where: { id: req.params.id },
        include: {
          customer: true,
          order: true,
          orderItem: true,
          auditLogs: { orderBy: { createdAt: "asc" } },
        },
      });

      if (!request) throw new NotFoundError("Refund request not found.");

      res.json(request);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
