import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { authRouter } from "./routes/auth.routes";
import { feedbackRouter } from "./routes/feedback.routes";
import { errorHandler } from "./middleware/errorHandler";
import { publicFeedbackLimiter } from "./middleware/rateLimiter";
import { sendError } from "./utils/apiResponse";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, data: { status: "ok" }, error: null, message: "Healthy" });
});

app.use("/api/auth", authRouter);
app.use("/api/feedback", (req, res, next) => {
  if (req.method === "POST") {
    return publicFeedbackLimiter(req, res, next);
  }
  return next();
});
app.use("/api/feedback", feedbackRouter);

app.use((_req, res) => sendError(res, 404, "Not found", "Route not found"));
app.use(errorHandler);

export { app };
