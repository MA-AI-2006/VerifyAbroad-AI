import { NextResponse } from "next/server";
import { loadVerificationData } from "@/server/repositories/verification";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const data = await loadVerificationData();
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();
    const city = (url.searchParams.get("city") ?? "").toLowerCase().trim();
    const status = (url.searchParams.get("status") ?? "").toLowerCase().trim();

    let items = data.agents.map((agent) => {
      const community = data.community.find((c) => c.agentName.toLowerCase() === agent.agentName.toLowerCase());
      return {
        ...agent,
        community_rating: community?.rating ?? null,
        community_reports: community?.reportCount ?? 0,
        common_complaints: community?.commonComplaints ?? [],
      };
    });

    if (q) {
      items = items.filter(
        (a) =>
          a.agentName.toLowerCase().includes(q) ||
          (a.companyName && a.companyName.toLowerCase().includes(q)) ||
          a.aliases.some((al) => al.toLowerCase().includes(q)) ||
          (a.city && a.city.toLowerCase().includes(q))
      );
    }

    if (city) {
      items = items.filter((a) => a.city && a.city.toLowerCase().includes(city));
    }

    if (status) {
      items = items.filter((a) => a.status.toLowerCase() === status);
    }

    return NextResponse.json({
      agents: items,
      total: items.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch agents", detail: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}
