import { NextResponse } from "next/server";
import { lookupEntityWithAi, type DirectoryCategory } from "@/server/services/aiLookup";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const category = (body.category as DirectoryCategory) ?? "university";
    const query = (body.query as string) ?? "";

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const result = await lookupEntityWithAi({
      category,
      query: query.trim(),
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error in AI lookup route:", err);
    return NextResponse.json(
      {
        error: "Failed to perform AI lookup",
        detail: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = (url.searchParams.get("category") as DirectoryCategory) ?? "university";
    const query = url.searchParams.get("q") ?? "";

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: "Search query 'q' parameter is required" },
        { status: 400 }
      );
    }

    const result = await lookupEntityWithAi({
      category,
      query: query.trim(),
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to perform AI lookup",
        detail: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
