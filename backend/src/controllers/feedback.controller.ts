import { Request, Response } from "express";
import { PipelineStage } from "mongoose";
import { Feedback } from "../models/Feedback";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { analyzeFeedbackWithGemini, generateWeeklySummaryWithGemini } from "../services/gemini.service";

export const createFeedback = async (req: Request, res: Response): Promise<Response> => {
  const { title, description, category, submitterName, submitterEmail } = req.body;

  const feedback = await Feedback.create({
    title,
    description,
    category,
    submitterName,
    submitterEmail
  });

  try {
    const analysis = await analyzeFeedbackWithGemini(title, description);
    feedback.ai_category = analysis.category;
    feedback.ai_sentiment = analysis.sentiment;
    feedback.ai_priority = analysis.priority_score;
    feedback.ai_summary = analysis.summary;
    feedback.ai_tags = analysis.tags;
    feedback.ai_processed = true;
    await feedback.save();
  } catch (error) {
    // Keep submission successful even when AI fails.
    // eslint-disable-next-line no-console
    console.error("Gemini analysis failed:", error);
  }

  return sendSuccess(res, 201, feedback, "Feedback submitted successfully");
};

export const getAllFeedback = async (req: Request, res: Response): Promise<Response> => {
  const category = req.query.category as string | undefined;
  const status = req.query.status as string | undefined;
  const search = (req.query.search as string | undefined)?.trim();
  const sortBy = (req.query.sortBy as string | undefined) || "date";
  const sortOrder = (req.query.sortOrder as string | undefined) === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Math.min(100, Number(req.query.limit || 10)));

  const query: Record<string, unknown> = {};
  if (category) query.category = category;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { ai_summary: { $regex: search, $options: "i" } }
    ];
  }

  const direction = sortOrder === "asc" ? 1 : -1;

  const pipeline: PipelineStage[] = [{ $match: query }];

  if (sortBy === "sentiment") {
    pipeline.push({
      $addFields: {
        sentimentRank: {
          $switch: {
            branches: [
              { case: { $eq: ["$ai_sentiment", "Positive"] }, then: 1 },
              { case: { $eq: ["$ai_sentiment", "Neutral"] }, then: 2 },
              { case: { $eq: ["$ai_sentiment", "Negative"] }, then: 3 }
            ],
            default: 0
          }
        }
      }
    });
    pipeline.push({ $sort: { sentimentRank: direction, createdAt: -1 } });
  } else if (sortBy === "priority") {
    pipeline.push({ $sort: { ai_priority: direction, createdAt: -1 } });
  } else {
    pipeline.push({ $sort: { createdAt: direction } });
  }

  pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

  const statsPipeline: PipelineStage[] = [
    { $match: query },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalFeedback: { $sum: 1 },
              openItems: {
                $sum: {
                  $cond: [{ $ne: ["$status", "Resolved"] }, 1, 0]
                }
              },
              avgPriorityScore: { $avg: "$ai_priority" }
            }
          }
        ],
        commonTag: [
          { $unwind: { path: "$ai_tags", preserveNullAndEmptyArrays: false } },
          { $group: { _id: "$ai_tags", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 }
        ]
      }
    }
  ];

  const [items, total] = await Promise.all([
    Feedback.aggregate(pipeline),
    Feedback.countDocuments(query)
  ]);

  const [statsResult] = await Feedback.aggregate(statsPipeline);
  const totals = (statsResult?.totals?.[0] || {
    totalFeedback: 0,
    openItems: 0,
    avgPriorityScore: 0
  }) as {
    totalFeedback: number;
    openItems: number;
    avgPriorityScore: number;
  };
  const mostCommonTag = (statsResult?.commonTag?.[0]?._id as string | undefined) || "-";

  return sendSuccess(
    res,
    200,
    {
      items,
      stats: {
        totalFeedback: totals.totalFeedback,
        openItems: totals.openItems,
        avgPriorityScore: Number((totals.avgPriorityScore || 0).toFixed(2)),
        mostCommonTag
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    },
    "Feedback fetched successfully"
  );
};

export const getFeedbackById = async (req: Request, res: Response): Promise<Response> => {
  const item = await Feedback.findById(req.params.id);

  if (!item) {
    return sendError(res, 404, "Not found", "Feedback not found");
  }

  return sendSuccess(res, 200, item, "Feedback fetched successfully");
};

export const updateFeedbackStatus = async (req: Request, res: Response): Promise<Response> => {
  const { status } = req.body as { status: "New" | "In Review" | "Resolved" };

  const item = await Feedback.findByIdAndUpdate(req.params.id, { status }, { new: true });

  if (!item) {
    return sendError(res, 404, "Not found", "Feedback not found");
  }

  return sendSuccess(res, 200, item, "Feedback status updated");
};

export const deleteFeedback = async (req: Request, res: Response): Promise<Response> => {
  const item = await Feedback.findByIdAndDelete(req.params.id);

  if (!item) {
    return sendError(res, 404, "Not found", "Feedback not found");
  }

  return sendSuccess(res, 200, item, "Feedback deleted");
};

export const getFeedbackSummary = async (_req: Request, res: Response): Promise<Response> => {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const recent = await Feedback.find({ createdAt: { $gte: since } }).select(
    "title description ai_tags ai_summary"
  );

  try {
    const generated = await generateWeeklySummaryWithGemini(
      recent.map((item) => ({
        title: item.title,
        description: item.description,
        ai_tags: item.ai_tags,
        ai_summary: item.ai_summary
      }))
    );

    return sendSuccess(
      res,
      200,
      {
        periodDays: 7,
        topThemes: generated.topThemes,
        summary: generated.summary
      },
      "Summary generated"
    );
  } catch {
    const tagCounts = new Map<string, number>();

    for (const item of recent) {
      for (const tag of item.ai_tags || []) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    const topThemes = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);

    return sendSuccess(
      res,
      200,
      {
        periodDays: 7,
        topThemes,
        summary:
          topThemes.length > 0
            ? `Top themes in the last 7 days: ${topThemes.join(", ")}.`
            : "Not enough AI-tagged feedback in the last 7 days to generate themes."
      },
      "Summary generated"
    );
  }
};

export const retriggerFeedbackAnalysis = async (req: Request, res: Response): Promise<Response> => {
  const item = await Feedback.findById(req.params.id);

  if (!item) {
    return sendError(res, 404, "Not found", "Feedback not found");
  }

  try {
    const analysis = await analyzeFeedbackWithGemini(item.title, item.description);
    item.ai_category = analysis.category;
    item.ai_sentiment = analysis.sentiment;
    item.ai_priority = analysis.priority_score;
    item.ai_summary = analysis.summary;
    item.ai_tags = analysis.tags;
    item.ai_processed = true;
    await item.save();

    return sendSuccess(res, 200, item, "AI analysis refreshed");
  } catch {
    return sendError(res, 502, "AI analysis failed", "Failed to refresh AI analysis");
  }
};

