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

    let items = data.universities;

    if (q) {
      items = items.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.aliases.some((a) => a.toLowerCase().includes(q)) ||
          (u.country && u.country.toLowerCase().includes(q))
      );
    }

    if (country) {
      items = items.filter((u) => u.country && u.country.toLowerCase() === country);
    }

    if (level) {
      items = items.filter((u) =>
        (u.programTypes ?? []).some((pt) => pt.toLowerCase().includes(level))
      );
    }

    return NextResponse.json({
      universities: items,
      total: items.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch universities", detail: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}
