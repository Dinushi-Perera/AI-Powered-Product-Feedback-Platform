import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  createFeedback,
  deleteFeedback,
  getAllFeedback,
  getFeedbackById,
  getFeedbackSummary,
  retriggerFeedbackAnalysis,
  updateFeedbackStatus
} from "../controllers/feedback.controller";
import { requireAdminAuth } from "../middleware/auth";
import { handleValidation } from "../middleware/validate";

export const feedbackRouter = Router();

feedbackRouter.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 120 }),
    body("description")
      .trim()
      .isLength({ min: 20 })
      .withMessage("Description must be at least 20 characters"),
    body("category").isIn(["Bug", "Feature Request", "Improvement", "Other"]),
    body("submitterName").optional().trim().isLength({ max: 120 }),
    body("submitterEmail").optional().isEmail().withMessage("Invalid email")
  ],
  handleValidation,
  createFeedback
);

feedbackRouter.get(
  "/",
  requireAdminAuth,
  [
    query("category").optional().isIn(["Bug", "Feature Request", "Improvement", "Other"]),
    query("status").optional().isIn(["New", "In Review", "Resolved"]),
    query("search").optional().isString().isLength({ min: 1, max: 120 }),
    query("sortBy").optional().isIn(["date", "priority", "sentiment"]),
    query("sortOrder").optional().isIn(["asc", "desc"]),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 })
  ],
  handleValidation,
  getAllFeedback
);

feedbackRouter.get("/summary", requireAdminAuth, getFeedbackSummary);

feedbackRouter.get(
  "/:id",
  requireAdminAuth,
  [param("id").isMongoId().withMessage("Invalid feedback id")],
  handleValidation,
  getFeedbackById
);

feedbackRouter.patch(
  "/:id",
  requireAdminAuth,
  [
    param("id").isMongoId().withMessage("Invalid feedback id"),
    body("status").isIn(["New", "In Review", "Resolved"]).withMessage("Invalid status")
  ],
  handleValidation,
  updateFeedbackStatus
);

feedbackRouter.post(
  "/:id/reanalyze",
  requireAdminAuth,
  [param("id").isMongoId().withMessage("Invalid feedback id")],
  handleValidation,
  retriggerFeedbackAnalysis
);

feedbackRouter.delete(
  "/:id",
  requireAdminAuth,
  [param("id").isMongoId().withMessage("Invalid feedback id")],
  handleValidation,
  deleteFeedback
);
