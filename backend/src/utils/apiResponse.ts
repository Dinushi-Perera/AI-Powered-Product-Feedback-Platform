import { Response } from "express";

export const sendSuccess = (
  res: Response,
  statusCode: number,
  data: unknown,
  message = "Success"
): Response => {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
    message
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  error: string,
  message = "Request failed"
): Response => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error,
    message
  });
};
