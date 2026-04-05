import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { FeedbackCategory, FeedbackSentiment } from "../models/Feedback";

interface GeminiAnalysisResult {
  category: FeedbackCategory;
  sentiment: FeedbackSentiment;
  priority_score: number;
  summary: string;
  tags: string[];
}

interface WeeklySummaryResult {
  topThemes: string[];
  summary: string;
}

const promptTemplate = `Analyse this product feedback. Return ONLY valid JSON with these fields: category, sentiment, priority_score (1-10), summary, tags.\n\nAllowed category values: Bug, Feature Request, Improvement, Other.\nAllowed sentiment values: Positive, Neutral, Negative.\n`;

const weeklyPromptTemplate = `You are analyzing product feedback from the last 7 days.
Return ONLY valid JSON with fields: topThemes, summary.
- topThemes: array of exactly up to 3 concise theme strings.
- summary: one short paragraph referencing the top themes.
`;

const getModel = () => {
  if (!env.geminiApiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const genAI = new GoogleGenerativeAI(env.geminiApiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
};

const normalizeJsonText = (raw: string): string =>
  raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");

export const analyzeFeedbackWithGemini = async (
  title: string,
  description: string
): Promise<GeminiAnalysisResult> => {
  const model = getModel();

  const content = `${promptTemplate}\nTitle: ${title}\nDescription: ${description}`;
  const response = await model.generateContent(content);
  const raw = response.response.text().trim();

  // Gemini can wrap JSON in code fences; normalize before parsing.
  const normalized = normalizeJsonText(raw);
  const parsed = JSON.parse(normalized) as GeminiAnalysisResult;

  if (!parsed.category || !parsed.sentiment || !parsed.summary || !Array.isArray(parsed.tags)) {
    throw new Error("Gemini returned incomplete analysis");
  }

  const clampedPriority = Math.max(1, Math.min(10, Number(parsed.priority_score) || 1));

  return {
    category: parsed.category,
    sentiment: parsed.sentiment,
    priority_score: clampedPriority,
    summary: String(parsed.summary),
    tags: parsed.tags.map((tag) => String(tag)).slice(0, 10)
  };
};

export const generateWeeklySummaryWithGemini = async (
  feedbackItems: Array<{ title: string; description: string; ai_tags?: string[]; ai_summary?: string }>
): Promise<WeeklySummaryResult> => {
  if (feedbackItems.length === 0) {
    return {
      topThemes: [],
      summary: "Not enough feedback in the last 7 days to generate themes."
    };
  }

  const model = getModel();
  const condensed = feedbackItems.slice(0, 200).map((item, index) => ({
    id: index + 1,
    title: item.title,
    description: item.description,
    tags: item.ai_tags || [],
    summary: item.ai_summary || ""
  }));

  const content = `${weeklyPromptTemplate}\nFeedbackItems: ${JSON.stringify(condensed)}`;
  const response = await model.generateContent(content);
  const raw = response.response.text().trim();
  const parsed = JSON.parse(normalizeJsonText(raw)) as WeeklySummaryResult;

  if (!Array.isArray(parsed.topThemes) || typeof parsed.summary !== "string") {
    throw new Error("Gemini returned incomplete weekly summary");
  }

  return {
    topThemes: parsed.topThemes.map((theme) => String(theme)).slice(0, 3),
    summary: parsed.summary.trim()
  };
};
