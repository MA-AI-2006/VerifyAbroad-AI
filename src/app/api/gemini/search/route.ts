import { NextRequest, NextResponse } from "next/server";
import { geminiSearchGrounding, verifyWithGoogleSearch } from "@/server/services/geminiSearch";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.context) {
      const result = await verifyWithGoogleSearch(body.context);
      return NextResponse.json(result);
    }

    if (!body.prompt) {
      return NextResponse.json({ error: "Missing 'prompt' or 'context' in request body." }, { status: 400 });
    }

    const result = await geminiSearchGrounding(body.prompt, {
      systemInstruction: body.systemInstruction,
      model: body.model,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Gemini Search Grounding failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
