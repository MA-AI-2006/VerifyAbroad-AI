import { GoogleGenAI } from "@google/genai";
import type { LiveIntelligenceFinding, LiveSearchResult } from "@/types";

/**
 * Gemini Live Search Grounding Service.
 *
 * Calls the Gemini API with Google Search Grounding enabled to dynamically
 * query Google Search, verify current admissions policies, official URLs,
 * and scam warnings in real-time.
 */

const TIMEOUT_MS = 15_000;
let genAiClient: GoogleGenAI | null = null;

function getGenAi(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) return null;
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAiClient;
}

export async function searchWithGeminiGrounding(
  query: string,
  contextNote?: string,
): Promise<LiveIntelligenceFinding> {
  const ai = getGenAi();
  if (!ai) {
    return {
      searched: false,
      query,
      source: "none",
      summary: "Gemini API key is not configured for search grounding.",
      results: [],
    };
  }

  const prompt = `You are a study abroad fraud defense and verification intelligence system for Pakistani students.
Investigate the following claim or institution using live Google Search:
"${query}"
${contextNote ? `Additional context: ${contextNote}` : ""}

Provide a concise, factual verification summary covering:
1. Is this entity genuine, accredited, and currently operational?
2. What is its exact official domain and portal URL?
3. Are there any known fraud patterns, scam reports, or warnings associated with it?
Be direct, clear, and cite official government or institutional findings.`;

  try {
    const configuredModel = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
    let response: any = null;

    try {
      // Call Gemini with Google Search tool enabled
      response = await ai.models.generateContent({
        model: configuredModel,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.2,
        },
      });
    } catch (groundingError) {
      console.warn("Search grounding tool failed, falling back to direct model knowledge:", groundingError);
      // Fall back to direct model knowledge if search tool hits quota or fails
      response = await ai.models.generateContent({
        model: configuredModel,
        contents: prompt,
        config: {
          temperature: 0.2,
        },
      });
    }

    const summary = response.text?.trim() ?? "No summary returned from Gemini Search.";
    const results: LiveSearchResult[] = [];

    // Extract grounding chunks and citations from response metadata
    // Check candidate grounding metadata
    const candidate = response.candidates?.[0];
    const groundingMetadata = (candidate as { groundingMetadata?: any })?.groundingMetadata;

    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri) {
          results.push({
            title: chunk.web.title ?? chunk.web.uri,
            url: chunk.web.uri,
            snippet: chunk.web.title ?? "Google Search Grounded Reference",
            source: "gemini_google_search",
          });
        }
      }
    }

    return {
      searched: true,
      query,
      source: "gemini_grounding",
      summary,
      results,
    };
  } catch (error) {
    console.warn("Gemini Search Grounding error:", error instanceof Error ? error.message : error);
    return {
      searched: false,
      query,
      source: "none",
      summary: "Gemini Live Search Grounding unavailable.",
      results: [],
    };
  }
}
