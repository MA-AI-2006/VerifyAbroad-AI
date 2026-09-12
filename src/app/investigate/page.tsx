import type { Metadata } from "next";

import { ChatView } from "@/components/Chat/ChatView";
import { getInvestigation } from "@/server/repositories/investigations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Investigation — Study Abroad Safety Assistant",
  description:
    "Describe the university, program, scholarship, consultant or payment request you have been offered and find out what needs to be verified.",
};

export default async function InvestigatePage({
  searchParams,
}: {
  searchParams: Promise<{
    id?: string;
    q?: string;
    country?: string;
    university?: string;
    scholarship?: string;
    consultant?: string;
  }>;
}) {
  const params = await searchParams;
  const investigation = params.id ? await getInvestigation(Number(params.id)).catch(() => null) : null;
  const initialPrompt =
    params.q ||
    (params.university ? `I want to verify an admission offer from ${params.university}` : "") ||
    (params.scholarship ? `I want to verify the ${params.scholarship} scholarship claim` : "") ||
    (params.consultant ? `I want to check consultant ${params.consultant}` : "") ||
    (params.country ? `I am looking into study abroad options and offers in ${params.country}. What should I verify?` : "");

  return <ChatView initialInvestigation={investigation} initialPrompt={initialPrompt} />;
}
