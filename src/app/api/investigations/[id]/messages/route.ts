import { NextResponse } from "next/server";

import type { ChatAttachment, DegreeLevel, FundingType } from "@/types";
import { runInvestigationTurn } from "@/server/engine/run";
import { getInvestigation } from "@/server/repositories/investigations";

export const dynamic = "force-dynamic";

interface MessageBody {
  message?: string;
  attachments?: ChatAttachment[];
  degree_level?: DegreeLevel | null;
  funding_type?: FundingType | null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const investigationId = Number(id);
    if (!Number.isFinite(investigationId)) {
      return NextResponse.json({ error: "Invalid investigation id" }, { status: 400 });
    }
    const inv = await getInvestigation(investigationId);
    if (!inv) {
      return NextResponse.json({ error: "Investigation not found" }, { status: 404 });
    }
    return NextResponse.json({ messages: inv.messages });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const investigationId = Number(id);
    if (!Number.isFinite(investigationId)) {
      return NextResponse.json({ error: "Invalid investigation id" }, { status: 400 });
    }
    const body = (await request.json().catch(() => ({}))) as MessageBody;
    const text = (body.message ?? "").trim();
    const attachments = body.attachments ?? [];
    if (!text && attachments.length === 0) {
      return NextResponse.json({ error: "Message or evidence is required" }, { status: 400 });
    }

    const turn = await runInvestigationTurn({
      investigationId,
      studentText: text,
      attachments,
      explicitDegree: body.degree_level ?? null,
      explicitFunding: body.funding_type ?? null,
    });

    return NextResponse.json({ ...turn, mode: "internal_engine" });
  } catch (error) {
    console.error("messages turn failed", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Failed to process the message", detail }, { status: 500 });
  }
}
