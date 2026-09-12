import { GoogleGenAI } from "@google/genai";

import type { InvestigationResult } from "@/types";

/**
 * Optional server-side LLM enrichment.
 *
 * API keys are read from the server environment only — they are never exposed
 * to the browser bundle. When no key is configured the assistant uses its
 * deterministic investigation engine output, which is fully explainable and
 * does not depend on external services.
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

export function llmConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? process.env.OPENAI_API_KEY);
}

interface EnrichInput {
  systemGoal: string;
  studentText: string;
  draft: string;
  structured: InvestigationResult;
}

/**
 * Rewrites the deterministic draft into a more natural reply when an LLM key is
 * available. Any failure returns the draft unchanged, so the product never
 * depends on the external call succeeding.
 */
export async function maybeEnrichReply(input: EnrichInput): Promise<string> {
  const ai = getGenAi();
  if (ai) {
    try {
      const prompt = `Student message: ${input.studentText}\n\nStructured investigation output (must not be contradicted):\n${JSON.stringify(
        input.structured,
      )}\n\nDeterministic draft reply (rewrite for clarity, empathetic advisor tone, keep all facts, warning signals, verdicts, risk level and next verification step):\n${input.draft}`;

      const generatePromise = ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: input.systemGoal,
          temperature: 0.3,
        },
      });

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini request timed out")), TIMEOUT_MS),
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      if (response && response.text) {
        const text = response.text.trim();
        if (text.length > 0) return text;
      }
    } catch (cause) {
      console.warn("Gemini enrichment fallback:", cause instanceof Error ? cause.message : cause);
      // Fall through to other providers or deterministic draft
    }
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.3,
          messages: [
            { role: "system", content: input.systemGoal },
            {
              role: "user",
              content: `Student message: ${input.studentText}\n\nStructured output (must not be contradicted): ${JSON.stringify(
                input.structured,
              )}\n\nRewrite this draft for clarity and tone without changing any fact, verdict, risk level or next step:\n${input.draft}`,
            },
          ],
        }),
      });
      clearTimeout(timer);
      if (response.ok) {
        const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
        const text = payload.choices?.[0]?.message?.content ?? "";
        if (text.trim().length > 0) return text.trim();
      }
    } catch {
      // fall through to the deterministic draft
    }
  }

  return input.draft;
}
