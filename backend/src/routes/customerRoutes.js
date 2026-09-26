import { Router } from "express";

export function customerRoutes({ prisma }) {
  const router = Router();

  router.get("/customers", async (req, res, next) => {
    try {
      const customers = await prisma.customer.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      });
      res.json(customers);
    } catch (err) {
      next(err);
    }
  });

  // Customer-facing: no verifiedIssue here. That field is our internal ground
  // truth, and showing it before the customer describes the issue themselves
  // would make the claim-vs-record consistency check meaningless.
  router.get("/customers/:customerId/orders", async (req, res, next) => {
    try {
      const orders = await prisma.order.findMany({
        where: { customerId: req.params.customerId },
        orderBy: { orderDate: "desc" },
        select: {
          id: true,
          orderDate: true,
          total: true,
          status: true,
          items: {
            select: { id: true, sku: true, name: true, price: true, listingCondition: true },
          },
        },
      });
      res.json(orders);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
