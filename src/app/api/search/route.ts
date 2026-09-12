import { NextResponse } from "next/server";
import { investigateEntityWithTavily, searchTavily } from "@/server/services/tavily";
import { searchWithGeminiGrounding } from "@/server/services/geminiSearch";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      query?: string;
      category?: "agent" | "university" | "scholarship" | "general";
      provider?: "tavily" | "gemini" | "auto";
      country?: string;
    };

    const query = body.query?.trim();
    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required for web search" },
        { status: 400 },
      );
    }

    const provider = body.provider ?? "auto";

    // Auto strategy: If Tavily key available and category is agent, use Tavily.
    // If Gemini key available, try Gemini Grounding or fallback to Tavily.
    if (provider === "gemini") {
      const geminiResult = await searchWithGeminiGrounding(query, `Category: ${body.category ?? "general"}`);
      return NextResponse.json(geminiResult);
    }

    if (provider === "tavily" || process.env.TAVILY_API_KEY) {
      const tavilyResult = await investigateEntityWithTavily(
        query,
        body.category ?? "general",
        body.country,
      );
      if (tavilyResult.results.length > 0 || !process.env.GEMINI_API_KEY) {
        return NextResponse.json(tavilyResult);
      }
    }

    // Fallback or auto with Gemini
    const geminiResult = await searchWithGeminiGrounding(query, `Category: ${body.category ?? "general"}`);
    return NextResponse.json(geminiResult);
  } catch (error) {
    console.error("Search route error:", error);
    return NextResponse.json(
      { error: "Internal server error during search" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const category = (url.searchParams.get("category") as any) ?? "general";
  const country = url.searchParams.get("country") ?? undefined;

  if (!q) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  if (process.env.TAVILY_API_KEY) {
    const res = await investigateEntityWithTavily(q, category, country);
    return NextResponse.json(res);
  }

  const geminiRes = await searchWithGeminiGrounding(q);
  return NextResponse.json(geminiRes);
}
