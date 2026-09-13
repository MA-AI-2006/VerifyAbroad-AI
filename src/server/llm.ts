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
  return Boolean(
    process.env.GEMINI_API_KEY ??
      process.env.GOOGLE_API_KEY ??
      process.env.GROQ_API_KEY ??
      process.env.OPENAI_API_KEY,
  );
}

interface EnrichInput {
  systemGoal: string;
  studentText: string;
  draft: string;
  structured: InvestigationResult;
}

const ENRICH_RULES = `
Rules for rewriting:
1. Tone: Calm, respectful, objective, empathetic. NEVER argue, scold, provoke, or ragebait.
2. Direct Question Answering (CRITICAL): If the student asked ANY question, query, or expressed doubt (e.g. about visa guarantees, scholarship fees, application procedures, IELTS, bank statements, embassy appointments, or consultant trustworthiness), you MUST answer their question directly, thoroughly, and helpfully in the opening part of your reply using accurate real-world regulatory facts. Never ignore or evade the student's question!
3. Single-question rule: If clarification is needed, ask AT MOST ONE single question at the end. If the draft contains no question, do NOT introduce any question. Never list multiple questions.
4. Anti-repetition: NEVER re-ask for any information already present or marked unknown/negated in the structured output.
5. Keep all verification verdicts, risk signals, risk level, and next verification steps accurate to the structured data.
6. Match the student's language (English, Urdu, or Roman Urdu).
`;

/**
 * Rewrites the deterministic draft into a more natural reply when an LLM key is
 * available. Any failure returns the draft unchanged, so the product never
 * depends on the external call succeeding.
 */
export async function maybeEnrichReply(input: EnrichInput): Promise<string> {
  const ai = getGenAi();
  if (ai) {
    try {
      const prompt = `Student message: ${input.studentText}\n\n${ENRICH_RULES}\nStructured investigation output:\n${JSON.stringify(
        input.structured,
      )}\n\nDeterministic draft reply (rewrite naturally adhering strictly to the rules above):\n${input.draft}`;

      const configuredModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
      let response: any = null;
      try {
        const generatePromise = ai.models.generateContent({
          model: configuredModel,
          contents: prompt,
          config: {
            systemInstruction: input.systemGoal,
            temperature: 0.3,
          },
        });

        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini request timed out")), TIMEOUT_MS),
        );

        response = await Promise.race([generatePromise, timeoutPromise]);
      } catch (modelError) {
        if (configuredModel !== "gemini-2.5-flash") {
          try {
            response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                systemInstruction: input.systemGoal,
                temperature: 0.3,
              },
            });
          } catch {
            throw modelError;
          }
        } else {
          throw modelError;
        }
      }
      if (response && response.text) {
        const text = response.text.trim();
        if (text.length > 0) return text;
      }
    } catch (cause) {
      console.warn("Gemini enrichment fallback:", cause instanceof Error ? cause.message : cause);
      // Fall through to other providers or deterministic draft
    }
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const groqModel = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: groqModel,
          temperature: 0.3,
          messages: [
            { role: "system", content: `${input.systemGoal}\n${ENRICH_RULES}` },
            {
              role: "user",
              content: `Student message: ${input.studentText}\n\nStructured output: ${JSON.stringify(
                input.structured,
              )}\n\nDraft:\n${input.draft}`,
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
    } catch (cause) {
      console.warn("Groq enrichment fallback:", cause instanceof Error ? cause.message : cause);
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
            { role: "system", content: `${input.systemGoal}\n${ENRICH_RULES}` },
            {
              role: "user",
              content: `Student message: ${input.studentText}\n\nStructured output: ${JSON.stringify(
                input.structured,
              )}\n\nDraft:\n${input.draft}`,
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
