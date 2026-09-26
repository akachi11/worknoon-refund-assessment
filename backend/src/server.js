import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import pino from "pino";
import { createApp } from "./app.js";
import { createRefundService } from "./services/refundService.js";
import { loadPolicy } from "./config/policy.js";
import { resolveProviders } from "./config/providers.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const prisma = new PrismaClient();
const policy = loadPolicy();
const { primary, secondary } = resolveProviders();

const refundService = createRefundService({
  prisma,
  policy,
  primaryProvider: primary,
  secondaryProvider: secondary,
  fallbackEnabled: process.env.AI_FALLBACK_ENABLED === "true",
  timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 8000,
});

const app = createApp({ prisma, refundService, logger });
const port = Number(process.env.PORT) || 4000;

const server = app.listen(port, () => {
  logger.info(`Refund backend listening on port ${port}`);
});

async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down...`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
