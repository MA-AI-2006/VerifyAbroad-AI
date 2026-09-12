import { NextResponse } from "next/server";
import { runInvestigationTurn } from "@/server/engine/run";
import { getInvestigation } from "@/server/repositories/investigations";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const investigationId = Number(id);
    if (!Number.isFinite(investigationId)) {
      return NextResponse.json({ error: "Invalid investigation id" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const message = body.message || "Please analyze all current evidence and provide a full risk assessment.";

    const turn = await runInvestigationTurn({
      investigationId,
      studentText: message,
      attachments: body.attachments ?? [],
    });

    const updated = await getInvestigation(investigationId);

    return NextResponse.json({
      success: true,
      investigation: updated,
      result: turn.result,
      message: turn.assistantMessage,
    });
  } catch (err) {
    console.error("Analysis failed:", err);
    return NextResponse.json(
      { error: "Analysis failed", detail: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
