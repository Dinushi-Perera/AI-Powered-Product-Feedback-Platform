import rateLimit from "express-rate-limit";

export const publicFeedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: "Too many requests",
    message: "Too many submissions from this IP, please try again in an hour"
  }
});
