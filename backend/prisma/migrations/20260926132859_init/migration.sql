-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('delivered', 'in_transit', 'returned');

-- CreateEnum
CREATE TYPE "ListingCondition" AS ENUM ('new', 'open_box', 'refurbished', 'clearance');

-- CreateEnum
CREATE TYPE "VerifiedIssue" AS ENUM ('none', 'damaged_in_transit', 'wrong_item_shipped', 'missing_item');

-- CreateEnum
CREATE TYPE "FinalDecision" AS ENUM ('APPROVED', 'DENIED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "AuditActor" AS ENUM ('policy_engine', 'ai_openai', 'ai_gemini', 'system');

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "listingCondition" "ListingCondition" NOT NULL DEFAULT 'new',
    "verifiedIssue" "VerifiedIssue" NOT NULL DEFAULT 'none',

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_requests" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "policyOutput" JSONB NOT NULL,
    "aiOutput" JSONB,
    "finalDecision" "FinalDecision" NOT NULL,
    "reasoning" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "refundRequestId" TEXT NOT NULL,
    "actor" "AuditActor" NOT NULL,
    "action" TEXT NOT NULL,
    "detail" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE INDEX "orders_customerId_idx" ON "orders"("customerId");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "refund_requests_customerId_idx" ON "refund_requests"("customerId");

-- CreateIndex
CREATE INDEX "refund_requests_orderId_idx" ON "refund_requests"("orderId");

-- CreateIndex
CREATE INDEX "refund_requests_orderItemId_idx" ON "refund_requests"("orderItemId");

-- CreateIndex
CREATE INDEX "audit_logs_refundRequestId_idx" ON "audit_logs"("refundRequestId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_refundRequestId_fkey" FOREIGN KEY ("refundRequestId") REFERENCES "refund_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
