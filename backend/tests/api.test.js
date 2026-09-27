import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app.js";
import { createRefundService } from "../src/services/refundService.js";

const policy = {
  version: "1.0.0",
  refundWindowDays: 30,
  highValueThreshold: 500,
  aiConfidenceThreshold: 0.6,
  rateLimiting: { maxRequestsPerCustomerPerWindow: 3, windowHours: 24 },
  nonRefundableListingConditions: ["clearance"],
  eligibleVerifiedIssues: ["damaged_in_transit", "wrong_item_shipped", "missing_item"],
  rules: [{ id: "test_rule", hardRule: false, summary: "Test rule." }],
};

const fakeApprovingProvider = {
  name: "gemini",
  classify: async () => ({
    decision: "APPROVED",
    confidence: 0.9,
    reasoning: "This looks like a legitimate issue, so I've approved it.",
    claimConsistentWithRecords: true,
    flaggedConcerns: [],
  }),
};

describe.skipIf(!process.env.DATABASE_URL)("API integration", () => {
  let prisma;
  let app;
  let customerId;
  let orderId;
  let clearanceItemId;
  let eligibleItemId;

  beforeAll(async () => {
    prisma = new PrismaClient();

    const customer = await prisma.customer.create({
      data: { name: "Test Customer", email: `test-${Date.now()}@example.com` },
    });
    customerId = customer.id;

    const order = await prisma.order.create({
      data: {
        customerId,
        orderDate: new Date(),
        total: 80,
        status: "delivered",
        items: {
          create: [
            {
              sku: "TEST-CLEARANCE",
              name: "Test Clearance Item",
              price: 30,
              listingCondition: "clearance",
              verifiedIssue: "none",
            },
            {
              sku: "TEST-DAMAGED",
              name: "Test Damaged Item",
              price: 50,
              listingCondition: "new",
              verifiedIssue: "damaged_in_transit",
            },
          ],
        },
      },
      include: { items: true },
    });
    orderId = order.id;
    clearanceItemId = order.items.find((i) => i.sku === "TEST-CLEARANCE").id;
    eligibleItemId = order.items.find((i) => i.sku === "TEST-DAMAGED").id;

    const refundService = createRefundService({
      prisma,
      policy,
      primaryProvider: fakeApprovingProvider,
      secondaryProvider: fakeApprovingProvider,
      fallbackEnabled: false,
      timeoutMs: 5000,
    });

    app = createApp({ prisma, refundService });
  });

  afterAll(async () => {
    const requests = await prisma.refundRequest.findMany({ where: { customerId } });
    const requestIds = requests.map((r) => r.id);
    await prisma.auditLog.deleteMany({ where: { refundRequestId: { in: requestIds } } });
    await prisma.refundRequest.deleteMany({ where: { customerId } });
    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.deleteMany({ where: { customerId } });
    await prisma.customer.deleteMany({ where: { id: customerId } });
    await prisma.$disconnect();
  });

  it("GET /api/customers includes the fixture customer", async () => {
    const res = await request(app).get("/api/customers");
    expect(res.status).toBe(200);
    expect(res.body.some((c) => c.id === customerId)).toBe(true);
  });

  it("GET /api/customers/:id/orders returns the order without verifiedIssue", async () => {
    const res = await request(app).get(`/api/customers/${customerId}/orders`);
    expect(res.status).toBe(200);
    const item = res.body[0].items[0];
    expect(item.verifiedIssue).toBeUndefined();
  });

  it("POST /api/refund-requests returns 400 for a missing field", async () => {
    const res = await request(app)
      .post("/api/refund-requests")
      .send({ customerId, orderId });
    expect(res.status).toBe(400);
  });

  it("POST /api/refund-requests returns 404 for a nonexistent order", async () => {
    const res = await request(app).post("/api/refund-requests").send({
      customerId,
      orderId: "00000000-0000-0000-0000-000000000000",
      orderItemId: eligibleItemId,
      message: "test",
    });
    expect(res.status).toBe(404);
  });

  it("POST /api/refund-requests denies a clearance item without calling the AI", async () => {
    const res = await request(app).post("/api/refund-requests").send({
      customerId,
      orderId,
      orderItemId: clearanceItemId,
      message: "I want a refund on this.",
    });
    expect(res.status).toBe(201);
    expect(res.body.finalDecision).toBe("DENIED");
  });

  it("POST /api/refund-requests approves an eligible item via the (fake) AI", async () => {
    const res = await request(app).post("/api/refund-requests").send({
      customerId,
      orderId,
      orderItemId: eligibleItemId,
      message: "This arrived damaged.",
    });
    expect(res.status).toBe(201);
    expect(res.body.finalDecision).toBe("APPROVED");
  });

  it("GET /api/admin/refund-requests lists the requests just created", async () => {
    const res = await request(app).get(`/api/admin/refund-requests?customerId=${customerId}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });

  it("GET /api/admin/refund-requests/:id returns full detail with audit trail and verifiedIssue", async () => {
    const list = await request(app).get(`/api/admin/refund-requests?customerId=${customerId}`);
    const id = list.body.items[0].id;

    const res = await request(app).get(`/api/admin/refund-requests/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.auditLogs.length).toBeGreaterThan(0);
    expect(res.body.orderItem.verifiedIssue).toBeDefined();
  });
});
