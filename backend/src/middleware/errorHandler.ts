import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/apiResponse";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  // eslint-disable-next-line no-console
  console.error(err);
  return sendError(res, 500, err.message || "Internal server error", "Server error");
};
