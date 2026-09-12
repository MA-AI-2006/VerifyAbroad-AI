import { NextResponse } from "next/server";

import { loadInvestigationPayload } from "@/server/engine/run";
import { db } from "@/db";
import { investigations, investigationMessages, evidenceItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "Invalid investigation id" }, { status: 400 });
  }
  const investigation = await loadInvestigationPayload(numericId);
  if (!investigation) {
    return NextResponse.json({ error: "Investigation not found" }, { status: 404 });
  }
  return NextResponse.json({ investigation, mode: "internal_engine" });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "Invalid investigation id" }, { status: 400 });
  }
  try {
    await db.delete(investigationMessages).where(eq(investigationMessages.investigationId, numericId));
    await db.delete(evidenceItems).where(eq(evidenceItems.investigationId, numericId));
    await db.delete(investigations).where(eq(investigations.id, numericId));
    return NextResponse.json({ success: true, id: numericId });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete investigation", detail: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}
