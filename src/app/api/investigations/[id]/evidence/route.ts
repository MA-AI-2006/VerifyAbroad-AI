import { NextResponse } from "next/server";
import { db } from "@/db";
import { evidenceItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { addEvidence } from "@/server/repositories/investigations";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return NextResponse.json({ error: "Invalid investigation id" }, { status: 400 });
    }
    const items = await db.select().from(evidenceItems).where(eq(evidenceItems.investigationId, numericId));
    return NextResponse.json({ evidence: items });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load evidence" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return NextResponse.json({ error: "Invalid investigation id" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const item = await addEvidence({
      investigationId: numericId,
      kind: body.kind ?? "document",
      label: body.label ?? "Uploaded Evidence",
      mime: body.mime ?? null,
      sizeBytes: body.size_bytes ?? null,
      url: body.url ?? null,
      analysisStatus: body.analysis_status ?? "analyzed",
      note: body.note ?? null,
    });

    return NextResponse.json({ success: true, evidence: item });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to record evidence", detail: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}
