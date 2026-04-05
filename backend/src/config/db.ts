import mongoose from "mongoose";
import { env } from "./env";

export const connectDB = async (): Promise<void> => {
  await mongoose.connect(env.mongodbUri);
  // Keep logs minimal and actionable for local dev.
  // eslint-disable-next-line no-console
  console.log("MongoDB connected");
};
