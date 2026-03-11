import { NextRequest, NextResponse } from "next/server";
import { createGeminiClient, formatGeminiError, getGeminiApiKey } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    if (!getGeminiApiKey()) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY or GOOGLE_API_KEY is missing in .env" },
        { status: 500 },
      );
    }

    const ai = createGeminiClient();

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "No message" }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Please provide a concise summary of the following article: ${content}`,
    });

    return NextResponse.json({ result: response.text });
  } catch (err: unknown) {
    const formattedError = formatGeminiError(err);

    console.error("GENERATE ERROR FULL:", err);
    console.error("GENERATE ERROR FORMATTED:", formattedError);

    return NextResponse.json(
      formattedError,
      { status: formattedError.status },
    );
  }
}
