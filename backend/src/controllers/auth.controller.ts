import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { sendError, sendSuccess } from "../utils/apiResponse";

const ensureAdminBootstrapUser = async (): Promise<void> => {
  if (!env.adminEmail || !env.adminPassword) {
    return;
  }

  const existing = await User.findOne({ email: env.adminEmail.toLowerCase(), role: "admin" });
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(env.adminPassword, 10);
  await User.create({
    email: env.adminEmail.toLowerCase(),
    passwordHash,
    role: "admin"
  });
};

export const adminLogin = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body as { email: string; password: string };

  await ensureAdminBootstrapUser();

  const user = await User.findOne({ email: email.toLowerCase(), role: "admin" });
  if (!user) {
    return sendError(res, 401, "Invalid credentials", "Login failed");
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return sendError(res, 401, "Invalid credentials", "Login failed");
  }

  const token = jwt.sign({ email: user.email, userId: String(user._id), role: user.role }, env.jwtSecret, {
    expiresIn: "12h"
  });

  return sendSuccess(res, 200, { token }, "Login successful");
};
