import { NextResponse } from "next/server";
import { db } from "@/db";
import { communityReports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureSeeded } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    const rows = await db.select().from(communityReports);
    return NextResponse.json({ reports: rows, total: rows.length });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch reports", detail: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const body = await request.json().catch(() => ({}));
    const agentName = (body.agent_name || body.agentName || "").trim();
    const companyName = (body.company_name || body.companyName || "").trim();
    const complaint = (body.complaint || body.message || "").trim();
    const rating = typeof body.rating === "number" ? body.rating : 1.0;

    if (!agentName && !companyName) {
      return NextResponse.json({ error: "Agent or company name is required" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(communityReports)
      .where(eq(communityReports.agentName, agentName))
      .limit(1);

    if (existing.length > 0) {
      const current = existing[0];
      const complaints = Array.isArray(current.commonComplaints) ? [...current.commonComplaints] : [];
      if (complaint && !complaints.includes(complaint)) {
        complaints.push(complaint);
      }
      const newCount = (current.reportCount ?? 0) + 1;
      const newRating = Math.max(1.0, Math.min(5.0, ((current.rating ?? 3.0) * (current.reportCount ?? 1) + rating) / (newCount + 1)));

      await db
        .update(communityReports)
        .set({
          reportCount: newCount,
          rating: Number(newRating.toFixed(1)),
          commonComplaints: complaints,
        })
        .where(eq(communityReports.id, current.id));

      return NextResponse.json({ success: true, message: "Report added to existing record" });
    }

    const inserted = await db
      .insert(communityReports)
      .values({
        agentName: agentName || "Unknown Consultant",
        companyName: companyName || null,
        rating,
        reportCount: 1,
        commonComplaints: complaint ? [complaint] : ["Unverified upfront payment request"],
        dataLabel: "Student community report",
      })
      .returning();

    return NextResponse.json({ success: true, report: inserted[0] });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to submit report", detail: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}
