import { NextResponse } from "next/server";
import { screenAgainstSanctions } from "@/server/services/opensanctions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      query?: string;
      schema?: "Person" | "Company" | "Organization" | "LegalEntity";
    };

    if (!body.query || body.query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query parameter is required for sanctions screening" },
        { status: 400 },
      );
    }

    const finding = await screenAgainstSanctions(body.query, body.schema);
    return NextResponse.json(finding);
  } catch (error) {
    console.error("Sanctions screening route error:", error);
    return NextResponse.json(
      { error: "Internal server error during sanctions screening" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const schema = url.searchParams.get("schema") as any;

  if (!q) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }

  const finding = await screenAgainstSanctions(q, schema);
  return NextResponse.json(finding);
}
