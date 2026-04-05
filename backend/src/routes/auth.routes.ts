import { Router } from "express";
import { body } from "express-validator";
import { adminLogin } from "../controllers/auth.controller";
import { handleValidation } from "../middleware/validate";

export const authRouter = Router();

authRouter.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").isLength({ min: 1 }).withMessage("Password is required")
  ],
  handleValidation,
  adminLogin
);
