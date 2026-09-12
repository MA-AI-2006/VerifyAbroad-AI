import { NextRequest, NextResponse } from "next/server";
import { tavilySearch, verifyClaimWithTavily } from "@/server/services/tavily";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required." }, { status: 400 });
  }

  const depth = (req.nextUrl.searchParams.get("depth") as "basic" | "advanced") || "basic";
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "5", 10);

  try {
    const result = await tavilySearch(query, {
      search_depth: depth,
      max_results: limit,
      include_answer: true,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Tavily search failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.claim) {
      const result = await verifyClaimWithTavily(body.claim, {
        university: body.university,
        agent: body.agent,
        country: body.country,
      });
      return NextResponse.json(result);
    }

    if (!body.query) {
      return NextResponse.json({ error: "Missing 'query' or 'claim' in request body." }, { status: 400 });
    }

    const result = await tavilySearch(body.query, {
      search_depth: body.search_depth,
      include_domains: body.include_domains,
      exclude_domains: body.exclude_domains,
      max_results: body.max_results,
      include_answer: body.include_answer,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Tavily search failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
