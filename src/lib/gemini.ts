import { GoogleGenAI } from "@google/genai";
import type { GenerateContentParameters } from "@google/genai";

type GeminiGenerateOptions = Omit<
  GenerateContentParameters,
  "model" | "contents"
>;

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
].filter((model): model is string => Boolean(model));

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

export function getAiStatusCode(err: unknown) {
  const error = err as {
    status?: number;
    code?: number;
    error?: { code?: number; status?: string };
  };

  const status = error?.status || error?.code || error?.error?.code;

  if (typeof status === "number" && status >= 400 && status <= 599) {
    return status;
  }

  return isAiOverloaded(err) ? 503 : 500;
}

export function isAiOverloaded(err: unknown) {
  const error = err as {
    message?: string;
    status?: number;
    code?: number;
    error?: { message?: string; status?: string };
  };
  const status = error?.status || error?.code;
  const message = [
    error?.message,
    error?.error?.message,
    error?.error?.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    status === 429 ||
    status === 503 ||
    message.includes("overload") ||
    message.includes("resource_exhausted") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("rate limit")
  );
}

export async function generateTextWithFallback(
  prompt: string,
  options: GeminiGenerateOptions = {},
) {
  const ai = createGeminiClient();
  let lastError: unknown;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        ...options,
      });

      const text = response.text?.trim();

      if (!text) {
        throw new Error(`Gemini returned an empty response from ${model}`);
      }

      return { text, model };
    } catch (err) {
      lastError = err;

      if (!isAiOverloaded(err)) {
        throw err;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini is unavailable");
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
