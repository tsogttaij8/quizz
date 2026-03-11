import { NextRequest } from "next/server";
import { createGeminiClient, formatGeminiError, getGeminiApiKey } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    if (!getGeminiApiKey()) {
      return Response.json(
        { error: "GEMINI_API_KEY or GOOGLE_API_KEY is missing in .env" },
        { status: 500 },
      );
    }

    const ai = createGeminiClient();
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return Response.json({ error: "No message" }, { status: 400 });
    }
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate 5 multiple choice questions based on this article: ${content}. Return the response in this exact JSON format:
      [
        {
          "question": "Question text here",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "answer": "0"
        }
      ]
      Make sure the response is valid JSON and the answer is the index (0-3) of the correct option.`,
    });
    const cleanedText = (response.text ?? "")
      .replace(/^\s*```json\s*/, "")
      .replace(/```\s*$/, "");
    console.log("Cleaned Text:", cleanedText);
    return Response.json({ result: cleanedText });
  } catch (err: unknown) {
    const formattedError = formatGeminiError(err);

    return Response.json(formattedError, {
      status: formattedError.status,
    });
  }
}
