import { NextRequest, NextResponse } from "next/server";
import {
  generateTextWithFallback,
  getAiStatusCode,
  isAiOverloaded,
} from "@/lib/gemini";

function createFallbackSummary(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  const sentences = normalized
    .split(/(?<=[.!?。！？])\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");

  return sentences || normalized.slice(0, 700);
}

export async function POST(request: NextRequest) {
  let content = "";

  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing in .env" },
        { status: 500 },
      );
    }

    const body = await request.json();
    content = body.content;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "No message" }, { status: 400 });
    }

    const { text, model } = await generateTextWithFallback(`
Та нийтлэлийг товч бөгөөд ойлгомжтой хураангуйл.

Дүрэм:
- Нийтлэл ямар хэл дээр байгааг дагаж хариул.
- Хэрэв оролт Монгол хэл дээр бол хариултыг зөв бичгийн болон утга зүйн алдаагүй кирилл Монгол хэлээр өг.
- Хураангуй нь эх агуулгатайгаа уялдсан, үйл явдлын дараалал болон гол санааг гажуудуулахгүй байх.
- Зөвхөн хураангуй текст буцаа. Markdown, тайлбар, нэмэлт гарчиг бүү оруул.

Нийтлэл:
${content}
`);

    return NextResponse.json({ result: text, model });
  } catch (err: unknown) {
    const error =
      err instanceof Error
        ? err
        : new Error(typeof err === "string" ? err : JSON.stringify(err));
    const maybeStatus = getAiStatusCode(err);
    const isHighDemandError = isAiOverloaded(err);

    console.warn("Generate summary failed:", {
      status: maybeStatus,
      message: error.message,
    });

    if (isHighDemandError && content) {
      return NextResponse.json({
        result: createFallbackSummary(content),
        model: "local-fallback",
        warning: "Gemini quota exceeded; used local fallback summary.",
      });
    }

    return NextResponse.json(
      {
        error: isHighDemandError
          ? "AI service tur achaalaltai baina. Dahiad neg oroldooroi."
          : error.message || "Failed to generate summary",
        status: maybeStatus,
      },
      { status: maybeStatus },
    );
  }
}
