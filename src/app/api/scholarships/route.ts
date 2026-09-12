import { NextResponse } from "next/server";
import { loadVerificationData } from "@/server/repositories/verification";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const data = await loadVerificationData();
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();
    const country = (url.searchParams.get("country") ?? "").toLowerCase().trim();
    const level = (url.searchParams.get("level") ?? "").toLowerCase().trim();

    let items = data.scholarships;

    if (q) {
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.aliases.some((a) => a.toLowerCase().includes(q)) ||
          (s.fundedBy && s.fundedBy.toLowerCase().includes(q)) ||
          (s.country && s.country.toLowerCase().includes(q))
      );
    }

    if (country) {
      items = items.filter((s) => s.country && s.country.toLowerCase().includes(country));
    }

    if (level) {
      items = items.filter((s) =>
        (s.eligibleLevels ?? []).some((el) => el.toLowerCase() === level)
      );
    }

    return NextResponse.json({
      scholarships: items,
      total: items.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch scholarships", detail: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}
