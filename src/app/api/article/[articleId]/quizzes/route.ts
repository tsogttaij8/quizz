import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import prisma from "../../../../../../lib/prisma";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ articleId: string }> },
) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing in .env" },
        { status: 500 },
      );
    }

    const { articleId } = await context.params;
    console.log("articleId:", articleId);

    const article = await prisma.article.findUnique({
      where: { id: articleId },
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

    let parsed: any;

    try {
      parsed = JSON.parse(cleanedText);
      console.log("parsed:", parsed);
    } catch (parseError: any) {
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

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return NextResponse.json(
        { error: "AI returned empty or invalid quiz array" },
        { status: 500 },
      );
    }

    await prisma.quiz.createMany({
      data: parsed.map((q: any) => ({
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
  } catch (err: any) {
    console.error("Generate quizzes error FULL:", err);
    console.error("Generate quizzes error MESSAGE:", err?.message);
    console.error("Generate quizzes error STACK:", err?.stack);

    return NextResponse.json(
      {
        error: err?.message || "Failed to generate quizzes",
        stack: err?.stack || null,
      },
      { status: 500 },
    );
  }
}
