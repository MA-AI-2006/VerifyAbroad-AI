import { NextRequest, NextResponse } from "next/server";
import { checkOpenSanctions } from "@/server/services/opensanctions";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") ?? req.nextUrl.searchParams.get("name");
  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' or 'name' is required." }, { status: 400 });
  }

  const schema = req.nextUrl.searchParams.get("schema") as
    | "Person"
    | "Company"
    | "Organization"
    | undefined;

  try {
    const result = await checkOpenSanctions(query, { schema });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Sanctions check failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body.query ?? body.name;
    if (!query) {
      return NextResponse.json({ error: "Missing 'query' or 'name' in request body." }, { status: 400 });
    }

    const result = await checkOpenSanctions(query, {
      schema: body.schema,
      country: body.country,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Sanctions check failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
