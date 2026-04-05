import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { sendError } from "../utils/apiResponse";

export const handleValidation = (req: Request, res: Response, next: NextFunction): Response | void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return sendError(res, 400, first.msg, "Validation failed");
  }

  next();
};
