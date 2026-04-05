import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../src/app";
import { env } from "../src/config/env";
import { Feedback } from "../src/models/Feedback";
import { analyzeFeedbackWithGemini } from "../src/services/gemini.service";

jest.mock("../src/models/Feedback", () => ({
  Feedback: {
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn()
  }
}));

jest.mock("../src/services/gemini.service", () => ({
  analyzeFeedbackWithGemini: jest.fn()
}));

const mockedFeedback = Feedback as unknown as {
  create: jest.Mock;
  findByIdAndUpdate: jest.Mock;
};

const mockedAnalyzeFeedbackWithGemini = analyzeFeedbackWithGemini as jest.Mock;

describe("Feedback routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/feedback saves to DB and triggers AI analysis", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const createdFeedback = {
      _id: "507f1f77bcf86cd799439011",
      title: "App crashes on save",
      description: "The app crashes every time I click save on the profile screen.",
      category: "Bug",
      status: "New",
      ai_tags: [],
      ai_processed: false,
      save
    };

    mockedFeedback.create.mockResolvedValue(createdFeedback);
    mockedAnalyzeFeedbackWithGemini.mockResolvedValue({
      category: "Bug",
      sentiment: "Negative",
      priority_score: 9,
      summary: "Crash happens on save action.",
      tags: ["crash", "profile"]
    });

    const res = await request(app).post("/api/feedback").send({
      title: "App crashes on save",
      description: "The app crashes every time I click save on the profile screen.",
      category: "Bug",
      submitterEmail: "user@example.com"
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(mockedFeedback.create).toHaveBeenCalledTimes(1);
    expect(mockedAnalyzeFeedbackWithGemini).toHaveBeenCalledWith(
      "App crashes on save",
      "The app crashes every time I click save on the profile screen."
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(res.body.data.ai_processed).toBe(true);
    expect(res.body.data.ai_priority).toBe(9);
  });

  it("POST /api/feedback rejects empty title", async () => {
    const res = await request(app).post("/api/feedback").send({
      title: "   ",
      description: "This description is long enough to pass the minimum length.",
      category: "Bug"
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Title is required");
    expect(mockedFeedback.create).not.toHaveBeenCalled();
    expect(mockedAnalyzeFeedbackWithGemini).not.toHaveBeenCalled();
  });

  it("PATCH /api/feedback/:id updates status correctly", async () => {
    const token = jwt.sign({ email: "admin@example.com" }, env.jwtSecret);
    mockedFeedback.findByIdAndUpdate.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      status: "Resolved"
    });

    const res = await request(app)
      .patch("/api/feedback/507f1f77bcf86cd799439011")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "Resolved" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("Resolved");
    expect(mockedFeedback.findByIdAndUpdate).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      { status: "Resolved" },
      { new: true }
    );
  });

  it("Protected route rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/feedback");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Unauthorized");
    expect(res.body.message).toBe("Missing token");
  });
});
