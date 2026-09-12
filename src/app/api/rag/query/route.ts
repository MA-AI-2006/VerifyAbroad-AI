import { NextRequest, NextResponse } from "next/server";
import { answerWithRag, queryKnowledgeBase } from "@/server/services/rag/ragService";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required." }, { status: 400 });
  }

  const topK = parseInt(req.nextUrl.searchParams.get("top_k") || "4", 10);
  const synthesize = req.nextUrl.searchParams.get("synthesize") === "true";

  try {
    if (synthesize) {
      const result = await answerWithRag(query);
      return NextResponse.json(result);
    }

    const result = await queryKnowledgeBase(query, { topK });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "RAG query failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.query) {
      return NextResponse.json({ error: "Missing 'query' in request body." }, { status: 400 });
    }

    if (body.synthesize) {
      const result = await answerWithRag(body.query);
      return NextResponse.json(result);
    }

    const result = await queryKnowledgeBase(body.query, {
      topK: body.top_k ?? 4,
      minScore: body.min_score,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "RAG query failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
