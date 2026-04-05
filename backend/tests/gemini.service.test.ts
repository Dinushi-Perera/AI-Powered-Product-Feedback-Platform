const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({ generateContent: mockGenerateContent }));
const mockGoogleGenerativeAI = jest.fn(() => ({ getGenerativeModel: mockGetGenerativeModel }));

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: mockGoogleGenerativeAI
}));

import { analyzeFeedbackWithGemini } from "../src/services/gemini.service";

describe("Gemini service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("mocks API call and parses normalized JSON response", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          "```json\n{\"category\":\"Bug\",\"sentiment\":\"Negative\",\"priority_score\":99,\"summary\":\"Users hit a login crash.\",\"tags\":[\"login\",\"crash\",\"mobile\",\"p1\",\"urgent\",\"auth\",\"stability\",\"ios\",\"android\",\"regression\",\"extra\"]}\n```"
      }
    });

    const result = await analyzeFeedbackWithGemini("Login crash", "Users report crash after entering credentials.");

    expect(mockGoogleGenerativeAI).toHaveBeenCalledTimes(1);
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: "gemini-2.5-flash" });
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);

    expect(result.category).toBe("Bug");
    expect(result.sentiment).toBe("Negative");
    expect(result.priority_score).toBe(10);
    expect(result.summary).toBe("Users hit a login crash.");
    expect(result.tags).toHaveLength(10);
  });
});
