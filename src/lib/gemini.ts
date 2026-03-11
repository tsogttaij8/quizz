import { GoogleGenAI } from "@google/genai";

export function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
}

export function createGeminiClient() {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      "Missing Gemini API key. Set GEMINI_API_KEY or GOOGLE_API_KEY in .env",
    );
  }

  return new GoogleGenAI({ apiKey });
}

export function formatGeminiError(err: unknown) {
  const error = err as {
    message?: string;
    status?: number;
    error?: { message?: string; details?: unknown };
  };

  if (error?.status === 403) {
    return {
      status: 403,
      error:
        "Gemini API key was rejected (403). Check that the key is valid, Gemini API access is enabled for its project, and any API restrictions allow server-side requests.",
      details: error?.message || error?.error?.message || null,
    };
  }

  return {
    status: error?.status || 500,
    error:
      error?.error?.message ||
      error?.message ||
      "Failed to generate content with Gemini",
    details: error?.error?.details || null,
  };
}
