import { NextResponse } from "next/server";

import type { ChatAttachment, DegreeLevel, FundingType, Language } from "@/types";
import { startNewInvestigation } from "@/server/engine/run";
import { getStudentKey } from "@/server/session";
import { getInvestigation } from "@/server/repositories/investigations";

export const dynamic = "force-dynamic";

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
    console.error("investigate failed", error);
    return NextResponse.json({ error: "Failed to start investigation" }, { status: 500 });
  }
}
