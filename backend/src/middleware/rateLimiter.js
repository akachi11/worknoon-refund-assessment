import rateLimit from "express-rate-limit";

export const refundRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: "Too many refund requests from this address. Please try again later." },
  },
});
