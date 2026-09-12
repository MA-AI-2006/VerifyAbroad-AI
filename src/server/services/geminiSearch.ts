import { GoogleGenAI } from "@google/genai";

/**
 * Gemini Search Grounding Service.
 *
 * Implements real-time Google Search Grounding via @google/genai (`googleSearch: {}`).
 * Grounding connects Gemini directly to live Google Search index to verify:
 * - Current official university admission guidelines and fee structures
 * - Latest embassy visa processing rules and financial requirements
 * - Real-time fraud and scam reports on study abroad consultancies
 */

export interface GroundedSource {
  title: string;
  url: string;
}

export interface GroundedSearchResult {
  text: string;
  sources: GroundedSource[];
  webSearchQueries: string[];
  grounded: boolean;
  model: string;
}

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

/**
 * Queries Gemini with live Google Search Grounding enabled.
 */
export async function geminiSearchGrounding(
  prompt: string,
  options?: {
    systemInstruction?: string;
    model?: string;
    temperature?: number;
  },
): Promise<GroundedSearchResult> {
  const ai = getGenAi();
  const modelName = options?.model || "gemini-2.5-flash";

  if (!ai) {
    return {
      text: "Gemini API key not configured. Grounding unavailable.",
      sources: [],
      webSearchQueries: [],
      grounded: false,
      model: modelName,
    };
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction:
        options?.systemInstruction ||
        "You are an expert investigative analyst for international student visa safety. Always verify facts using official government immigration and university registrar sources.",
      temperature: options?.temperature ?? 0.2,
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text?.trim() ?? "";

  // Extract grounding metadata from Google Search grounding chunk response
  const candidate = response.candidates?.[0];
  const metadata = candidate?.groundingMetadata;

  const sources: GroundedSource[] = [];
  const seenUrls = new Set<string>();

  if (metadata?.groundingChunks) {
    for (const chunk of metadata.groundingChunks) {
      const web = (chunk as { web?: { uri?: string; title?: string } }).web;
      if (web?.uri && !seenUrls.has(web.uri)) {
        seenUrls.add(web.uri);
        sources.push({
          title: web.title || new URL(web.uri).hostname,
          url: web.uri,
        });
      }
    }
  }

  const webSearchQueries = metadata?.webSearchQueries || [];

  return {
    text,
    sources,
    webSearchQueries,
    grounded: sources.length > 0 || webSearchQueries.length > 0,
    model: modelName,
  };
}

/**
 * Live investigative check on a student offer, university, or consultant using Google Search Grounding.
 */
export async function verifyWithGoogleSearch(context: {
  university?: string;
  consultant?: string;
  country?: string;
  offerDetails?: string;
}): Promise<{
  analysis: string;
  officialLinks: GroundedSource[];
  riskIndicators: string[];
  grounded: boolean;
}> {
  const prompt = `Conduct an exhaustive live fact-check on this study abroad scenario:
- Target Destination / Country: ${context.country || "Not specified"}
- University / College: ${context.university || "Not specified"}
- Educational Consultant / Agency: ${context.consultant || "Not specified"}
- Offer / Claim Details: ${context.offerDetails || "Not specified"}

Please perform live Google Searches to answer:
1. Is the university officially accredited and recognized by the national ministry of education / immigration authority?
2. Does the institution require tuition to be paid directly to university bank accounts, or through third-party agents?
3. Are there active warnings, scam reports, or licensing suspensions regarding the consultant or university?
4. What is the official direct admissions website URL?`;

  const result = await geminiSearchGrounding(prompt, {
    systemInstruction:
      "You are VerifyAbroad Safety Analyst. Provide crisp, high-precision findings backed strictly by live Google Search grounding. Cite official domains (.gov, .edu, .ac.uk, DAAD, HEC).",
  });

  const riskIndicators: string[] = [];
  const textLower = result.text.toLowerCase();
  if (textLower.includes("warning") || textLower.includes("fraud") || textLower.includes("scam") || textLower.includes("unaccredited")) {
    riskIndicators.push("Potential regulatory warnings or accreditation discrepancies identified online.");
  }
  if (textLower.includes("not recognized") || textLower.includes("degree mill") || textLower.includes("blacklisted")) {
    riskIndicators.push("Institution or agency flagged as unrecognized or problematic.");
  }

  return {
    analysis: result.text,
    officialLinks: result.sources,
    riskIndicators,
    grounded: result.grounded,
  };
}
