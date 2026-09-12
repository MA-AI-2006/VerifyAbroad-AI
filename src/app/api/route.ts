import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    name: "VerifyAbroad AI (RaastaAI) API",
    status: "online",
    version: "1.0.0",
    engine: "hybrid_safety_engine",
    endpoints: {
      investigate: "/api/investigate",
      investigations: "/api/investigations",
      evidence: "/api/evidence",
      universities: "/api/universities",
      scholarships: "/api/scholarships",
      agents: "/api/agents",
      consultants: "/api/consultants",
      safety_guides: "/api/safety-guides",
      emergency: "/api/emergency",
      reports: "/api/reports",
      profile: "/api/profile",
      auth: {
        me: "/api/auth/me",
        login: "/api/auth/login",
        signup: "/api/auth/signup",
        logout: "/api/auth/logout",
      },
      health: "/api/health",
    },
  });
}
