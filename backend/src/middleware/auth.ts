import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { sendError } from "../utils/apiResponse";

export const requireAdminAuth = (req: Request, res: Response, next: NextFunction): Response | void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return sendError(res, 401, "Unauthorized", "Missing token");
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as { email: string; userId?: string; role?: string };
    req.admin = { email: payload.email, userId: payload.userId || "", role: payload.role || "admin" };
    next();
  } catch {
    return sendError(res, 401, "Unauthorized", "Invalid or expired token");
  }
};
