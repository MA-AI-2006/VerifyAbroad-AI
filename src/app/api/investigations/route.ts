import { NextResponse } from "next/server";

import type { ChatAttachment, DegreeLevel, FundingType, Language } from "@/types";
import { startNewInvestigation } from "@/server/engine/run";
import { listInvestigations, getInvestigation } from "@/server/repositories/investigations";
import { getStudentKey } from "@/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const studentKey = await getStudentKey();
  const items = await listInvestigations(studentKey);
  return NextResponse.json({ investigations: items });
}

interface StartBody {
  message?: string;
  language?: Language;
  degree_level?: DegreeLevel;
  funding_type?: FundingType;
  attachments?: ChatAttachment[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as StartBody;
    const studentKey = await getStudentKey();
    const language: Language = body.language ?? "roman_urdu";

    const started = await startNewInvestigation({
      studentKey,
      language,
      firstMessage: body.message ?? "",
      attachments: body.attachments ?? [],
    });

    const investigation = await getInvestigation(started.investigationId);

    return NextResponse.json({
      investigation_id: String(started.investigationId),
      investigation,
      first_turn: started.turn,
      mode: "internal_engine",
    });
  } catch (error) {
    console.error("create investigation failed", error);
    return NextResponse.json(
      {
        error: "Failed to create investigation",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
