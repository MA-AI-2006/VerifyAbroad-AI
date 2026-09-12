import type { SanctionsFinding, SanctionsHit } from "@/types";

/**
 * OpenSanctions screening service for VerifyAbroad AI (RaastaAI).
 *
 * Screens individuals (consultants, recruiters), companies (education agencies,
 * consultancies), and institutions against global sanction lists, PEP (Politically
 * Exposed Persons), debarment lists (World Bank, OFAC, UK HMT, EU, UN, etc.),
 * and adverse regulatory enforcement.
 */

const OPENSANCTIONS_API_URL = "https://api.opensanctions.org/search/default";
const TIMEOUT_MS = 8000;

export async function screenAgainstSanctions(
  query: string,
  schemaType?: "Person" | "Company" | "Organization" | "LegalEntity",
): Promise<SanctionsFinding> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 3) {
    return {
      screened: false,
      query: null,
      match_count: 0,
      high_risk_matches: [],
      summary: "Query too short for reliable sanctions screening.",
    };
  }

  const apiKey = process.env.OPENSANCTIONS_API_KEY;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (apiKey) {
    headers.Authorization = `ApiKey ${apiKey}`;
  }

  try {
    const url = new URL(OPENSANCTIONS_API_URL);
    url.searchParams.set("q", trimmed);
    url.searchParams.set("limit", "5");
    if (schemaType) {
      url.searchParams.set("schema", schemaType);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      // If 401 or rate limited, return informative screening status
      return {
        screened: false,
        query: trimmed,
        match_count: 0,
        high_risk_matches: [],
        summary: `OpenSanctions API responded with HTTP ${response.status}. Screening could not complete.`,
      };
    }

    const data = (await response.json()) as {
      results?: Array<{
        id: string;
        caption?: string;
        schema?: string;
        datasets?: string[];
        properties?: Record<string, string[]>;
        score?: number;
      }>;
    };

    const results = data.results ?? [];
    const highRiskMatches: SanctionsHit[] = results
      .filter((item) => (item.score ?? 0) >= 0.65 || (item.datasets?.length ?? 0) > 0)
      .map((item) => ({
        id: item.id,
        caption: item.caption ?? item.id,
        schema: item.schema ?? "Entity",
        datasets: item.datasets ?? [],
        countries: item.properties?.country ?? item.properties?.jurisdiction ?? [],
        score: item.score ?? 0.7,
        properties: item.properties,
      }));

    if (highRiskMatches.length > 0) {
      const topDatasets = Array.from(
        new Set(highRiskMatches.flatMap((m) => m.datasets)),
      ).slice(0, 3);

      return {
        screened: true,
        query: trimmed,
        match_count: highRiskMatches.length,
        high_risk_matches: highRiskMatches,
        summary: `Found ${highRiskMatches.length} match(es) on regulatory or sanctions datasets (${topDatasets.join(", ")}). Independent identity confirmation required before any transaction.`,
      };
    }

    return {
      screened: true,
      query: trimmed,
      match_count: 0,
      high_risk_matches: [],
      summary: `No sanctions, PEP, or international enforcement records found matching "${trimmed}".`,
    };
  } catch (error) {
    console.warn("OpenSanctions screening error:", error instanceof Error ? error.message : error);
    return {
      screened: false,
      query: trimmed,
      match_count: 0,
      high_risk_matches: [],
      summary: "Sanctions screening service unavailable or timed out.",
    };
  }
}
