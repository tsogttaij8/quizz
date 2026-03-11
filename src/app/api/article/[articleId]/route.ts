import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../../lib/prisma";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to get article";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ articleId: string }> },
) {
  try {
    void request;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please sign in" },
        { status: 401 },
      );
    }

    const { articleId } = await context.params;

    const article = await prisma.article.findFirst({
      where: {
        id: articleId,
        user: {
          clerkId: userId,
        },
      },
      include: { quizzes: true },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ article }, { status: 200 });
  } catch (err: unknown) {
    console.error("Article get error:", err);
    return NextResponse.json(
      { success: false, error: getErrorMessage(err) },
      { status: 500 },
    );
  }
}
