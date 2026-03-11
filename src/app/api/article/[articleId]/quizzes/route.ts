import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../../../lib/prisma";
import { createGeminiClient, formatGeminiError, getGeminiApiKey } from "@/lib/gemini";

type GeneratedQuiz = {
  question: string;
  options: string[];
  answer: string;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ articleId: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 },
      );
    }

    if (!getGeminiApiKey()) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY or GOOGLE_API_KEY is missing in .env" },
        { status: 500 },
      );
    }

    const ai = createGeminiClient();

    const { articleId } = await context.params;
    console.log("articleId:", articleId);

    const article = await prisma.article.findFirst({
      where: {
        id: articleId,
        user: {
          clerkId: userId,
        },
      },
    });

    console.log("article found:", article);

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (!article.content || !article.content.trim()) {
      return NextResponse.json(
        { error: "Article content is empty" },
        { status: 400 },
      );
    }

    console.log("article content length:", article.content.length);

    const prompt = `
Generate 5 multiple-choice quiz questions from the article below.

Return ONLY valid JSON.
Do not add explanation.
Do not add markdown.
Do not wrap the response in triple backticks.

Return exactly this format:
[
  {
    "question": "Question here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A"
  }
]

Article:
${article.content}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    console.log("AI response received");

    const rawText = response.text || "";
    console.log("rawText:", rawText);

    const cleanedText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    console.log("cleanedText:", cleanedText);

    let parsed: unknown;

    try {
      parsed = JSON.parse(cleanedText);
      console.log("parsed:", parsed);
    } catch (parseError: unknown) {
      console.error("Quiz JSON parse error:", parseError);
      console.error("Raw AI response:", rawText);

      return NextResponse.json(
        {
          error: "AI did not return valid JSON",
          raw: rawText,
        },
        { status: 500 },
      );
    }

    if (
      !Array.isArray(parsed) ||
      parsed.length === 0 ||
      !parsed.every(
        (quiz): quiz is GeneratedQuiz =>
          typeof quiz === "object" &&
          quiz !== null &&
          typeof quiz.question === "string" &&
          Array.isArray(quiz.options) &&
          quiz.options.every((option: unknown) => typeof option === "string") &&
          typeof quiz.answer === "string",
      )
    ) {
      return NextResponse.json(
        { error: "AI returned empty or invalid quiz array" },
        { status: 500 },
      );
    }

    await prisma.quiz.createMany({
      data: parsed.map((q) => ({
        articleId,
        question: q.question,
        options: q.options,
        answer: q.answer,
      })),
    });

    const quizzes = await prisma.quiz.findMany({
      where: { articleId },
    });

    console.log("saved quizzes:", quizzes);

    return NextResponse.json(
      {
        success: true,
        quizzes,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const formattedError = formatGeminiError(err);

    console.error("Generate quizzes error FULL:", err);
    console.error("Generate quizzes error FORMATTED:", formattedError);

    return NextResponse.json(
      formattedError,
      { status: formattedError.status },
    );
  }
}
