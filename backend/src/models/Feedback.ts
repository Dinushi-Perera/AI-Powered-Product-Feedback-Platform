import { Schema, model, Document } from "mongoose";

export type FeedbackCategory = "Bug" | "Feature Request" | "Improvement" | "Other";
export type FeedbackStatus = "New" | "In Review" | "Resolved";
export type FeedbackSentiment = "Positive" | "Neutral" | "Negative";

export interface IFeedback extends Document {
  title: string;
  description: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  submitterName?: string;
  submitterEmail?: string;
  ai_category?: string;
  ai_sentiment?: FeedbackSentiment;
  ai_priority?: number;
  ai_summary?: string;
  ai_tags: string[];
  ai_processed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    title: { type: String, required: true, maxlength: 120, trim: true },
    description: { type: String, required: true, minlength: 20, trim: true },
    category: {
      type: String,
      enum: ["Bug", "Feature Request", "Improvement", "Other"],
      required: true
    },
    status: {
      type: String,
      enum: ["New", "In Review", "Resolved"],
      default: "New"
    },
    submitterName: { type: String, trim: true },
    submitterEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: (email: string) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        message: "Invalid email format"
      }
    },
    ai_category: { type: String, trim: true },
    ai_sentiment: { type: String, enum: ["Positive", "Neutral", "Negative"] },
    ai_priority: { type: Number, min: 1, max: 10 },
    ai_summary: { type: String, trim: true },
    ai_tags: { type: [String], default: [] },
    ai_processed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

feedbackSchema.index({ status: 1 });
feedbackSchema.index({ category: 1 });
feedbackSchema.index({ ai_priority: -1 });
feedbackSchema.index({ createdAt: -1 });

export const Feedback = model<IFeedback>("Feedback", feedbackSchema);
