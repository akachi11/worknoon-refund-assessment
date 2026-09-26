import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { customerRoutes } from "./routes/customerRoutes.js";
import { refundRoutes } from "./routes/refundRoutes.js";
import { adminRoutes } from "./routes/adminRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp({ prisma, refundService, logger }) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.get("/health", (req, res) => res.json({ status: "ok" }));

  app.use("/api", customerRoutes({ prisma }));
  app.use("/api", refundRoutes({ refundService }));
  app.use("/api", adminRoutes({ prisma }));

  app.use(errorHandler);

  return app;
}
