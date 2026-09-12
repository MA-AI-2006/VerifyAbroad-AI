import { NextResponse } from "next/server";
import { getAccountByKey } from "@/server/repositories/investigations";
import { getStudentKey } from "@/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const studentKey = await getStudentKey();
    if (!studentKey || studentKey === "guest_student") {
      return NextResponse.json({ account: null });
    }

    const account = await getAccountByKey(studentKey);
    if (!account) {
      return NextResponse.json({ account: null });
    }

    return NextResponse.json({
      account: {
        name: account.name,
        email: account.email,
        preferred_language: account.preferredLanguage,
        degree_level: account.degreeLevel,
        target_countries: account.targetCountries,
        funding_preference: account.fundingPreference,
      },
    });
  } catch (error) {
    console.error("Auth me check failed:", error);
    return NextResponse.json({ account: null });
  }
}
