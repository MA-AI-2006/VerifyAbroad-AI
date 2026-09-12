import type { LiveIntelligenceFinding, LiveSearchResult } from "@/types";

/**
 * Tavily Web Search & Live Fraud Intelligence Service.
 *
 * Performs real-time web investigation across search indices to detect:
 * - Consultant scam reports, consumer court petitions, and student complaints.
 * - Scholarship validity, official provider domains, and fee-fraud warnings.
 * - University accreditation status, unaccredited diploma mills, and blacklists.
 */

const TAVILY_API_URL = "https://api.tavily.com/search";
const TIMEOUT_MS = 10_000;

export interface TavilySearchOptions {
  searchDepth?: "basic" | "advanced";
  maxResults?: number;
  includeAnswer?: boolean;
}

export async function searchTavily(
  query: string,
  options?: TavilySearchOptions,
): Promise<{ answer?: string; results: LiveSearchResult[] }> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return { results: [] };
  }

  const depth = options?.searchDepth ?? (process.env.TAVILY_SEARCH_DEPTH as "basic" | "advanced") ?? "basic";
  const maxResults = options?.maxResults ?? Number(process.env.TAVILY_MAX_RESULTS ?? 5);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: depth,
        max_results: maxResults,
        include_answer: options?.includeAnswer ?? true,
      }),
    });
    clearTimeout(timer);

    if (!response.ok) {
      console.warn(`Tavily API returned status ${response.status}`);
      return { results: [] };
    }

    const payload = (await response.json()) as {
      answer?: string;
      results?: Array<{
        title: string;
        url: string;
        content?: string;
        score?: number;
      }>;
    };

    const results: LiveSearchResult[] = (payload.results ?? []).map((item) => ({
      title: item.title ?? "Search Result",
      url: item.url ?? "",
      snippet: item.content ?? "",
      source: "tavily" as const,
    }));

    return {
      answer: payload.answer,
      results,
    };
  } catch (error) {
    console.warn("Tavily search error:", error instanceof Error ? error.message : error);
    return { results: [] };
  }
}

/**
 * Executes a targeted study-abroad fraud investigation query using Tavily.
 */
export async function investigateEntityWithTavily(
  entityName: string,
  category: "agent" | "university" | "scholarship" | "general",
  country?: string | null,
): Promise<LiveIntelligenceFinding> {
  const trimmed = entityName.trim();
  if (!trimmed) {
    return {
      searched: false,
      query: null,
      source: "none",
      summary: "No entity provided for live intelligence query.",
      results: [],
    };
  }

  let searchQuery = "";
  if (category === "agent") {
    searchQuery = `"${trimmed}" study abroad consultant Pakistan scam complaints reviews fraud`;
  } else if (category === "scholarship") {
    searchQuery = `"${trimmed}" official scholarship application portal requirements fake warning`;
  } else if (category === "university") {
    searchQuery = `"${trimmed}" ${country ?? ""} university accreditation recognized official website`;
  } else {
    searchQuery = `"${trimmed}" study abroad admission visa scam warnings`;
  }

  const { answer, results } = await searchTavily(searchQuery, {
    maxResults: 5,
    includeAnswer: true,
  });

  if (results.length === 0) {
    return {
      searched: true,
      query: searchQuery,
      source: "tavily",
      summary: `No live web alerts or high-confidence findings retrieved for "${trimmed}".`,
      results: [],
    };
  }

  const summary =
    answer && answer.trim().length > 0
      ? answer.trim()
      : `Retrieved ${results.length} live web sources regarding "${trimmed}".`;

  return {
    searched: true,
    query: searchQuery,
    source: "tavily",
    summary,
    results,
  };
}
