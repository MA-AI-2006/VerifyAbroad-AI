import { NextResponse } from "next/server";

import { loadInvestigationPayload } from "@/server/engine/run";

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
