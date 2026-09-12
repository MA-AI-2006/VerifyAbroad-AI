import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GUIDES = [
  {
    id: "university",
    icon: "🎓",
    title: "University Verification",
    tone: "grad-mint",
    summary: "Confirm the institution is real, accredited and taking direct applications.",
    levels: ["BS", "MS", "PhD"],
    countries: ["Germany", "United Kingdom", "United States", "Canada", "Australia", "Türkiye", "Singapore", "Saudi Arabia"],
    verify: [
      "Find the university website yourself instead of using a link someone sent you.",
      "Confirm the exact programme name on the official course page.",
      "Check the official application portal and the current intake dates.",
      "Email the admissions office and keep the written reply.",
    ],
    signs: [
      "The website domain is slightly different from the official one.",
      "The 'university' only appears in paid ads, not in official education listings.",
      "Admission is offered without transcripts, tests or an application.",
      "You are told not to contact the university directly.",
    ],
    questions: [
      "What is your official application portal and deadline for this intake?",
      "Is this exact programme name offered this year?",
      "Do you work with this consultant, and are they authorised?",
    ],
    avoid: [
      "Do not pay a 'seat booking' fee before an official offer exists.",
      "Do not rely only on the agent's screenshots of the website.",
    ],
    officialSource: "The university's own website and admissions office",
  },
  {
    id: "scholarship",
    icon: "🎁",
    title: "Scholarship Verification",
    tone: "grad-lilac",
    summary: "Compare the funding claim with the provider's official information.",
    levels: ["BS", "MS", "PhD"],
    countries: ["Germany", "United Kingdom", "United States", "Canada", "Australia", "Türkiye", "Pakistan"],
    verify: [
      "Get the scholarship's exact name and the provider's official website.",
      "Confirm the funding type: fully funded, partial, university-funded or external.",
      "Check the eligible degree levels and whether Pakistan is eligible.",
      "Apply through the provider's official route — most are free to apply for.",
    ],
    signs: [
      "'100% guaranteed scholarship' — no provider can guarantee an outcome.",
      "A fee is charged to apply for a scholarship that is free to apply for.",
      "The scholarship name does not exist on the provider's website.",
      "No reference number or award letter can be produced.",
    ],
    questions: [
      "What is the official name of this scholarship?",
      "Can you send the award letter with a reference number?",
      "Which organisation funds it, and can I apply directly?",
    ],
    avoid: [
      "Do not pay a 'scholarship processing' fee before confirming the scheme exists.",
      "Do not treat an agent's promise as the provider's decision.",
    ],
    officialSource: "The scholarship provider's official website (e.g. DAAD, Chevening, Fulbright/USEFP, Australia Awards, HEC)",
  },
  {
    id: "consultant",
    icon: "👤",
    title: "Consultant / Agent Verification",
    tone: "grad-sage",
    summary: "Check whether the agent is actually authorised by the university.",
    levels: ["BS", "MS", "PhD"],
    countries: ["Pakistan"],
    verify: [
      "Ask the university's admissions office in writing whether this person is authorised.",
      "Many universities publish their official recruitment partners on their website.",
      "Check whether the company is registered and has a physical office you can visit.",
      "Ask for an itemised service agreement before paying anything.",
    ],
    signs: [
      "Claims of official representation that cannot be confirmed anywhere.",
      "Pressure to avoid the university, embassy or official channels.",
      "No written invoice, or an invoice that only shows a lump sum.",
      "Community reports of payments to personal accounts.",
    ],
    questions: [
      "Which universities are you officially authorised to represent?",
      "Can you send that authorisation in writing?",
      "What exactly is included in your fee?",
    ],
    avoid: [
      "Do not hand over your passport or original documents as 'security'.",
      "Do not rely on community complaints alone as proof of anything.",
    ],
    officialSource: "The university's admissions office and its published partner list",
  },
  {
    id: "payment",
    icon: "💳",
    title: "Payment Safety & Fraud Shield",
    tone: "grad-mint",
    summary: "Make the payment request safer before any money leaves your account.",
    levels: ["BS", "MS", "PhD"],
    countries: ["Pakistan"],
    verify: [
      "Ask for a written, itemised invoice on company or university letterhead.",
      "Check whether the account belongs to an organisation, not an individual.",
      "Confirm the payment route with the university or provider directly.",
      "Compare the amount with the university's published fee schedule.",
    ],
    signs: [
      "Payment requested to a personal bank, JazzCash or EasyPaisa account.",
      "'Pay today or lose your seat' — artificial urgency.",
      "A large upfront amount before any documentation is provided.",
      "No fee breakdown, or a breakdown that keeps changing.",
    ],
    questions: [
      "What exactly is this payment for, line by line?",
      "Whose account is this, and what is the account title?",
      "What happens if I pay after the deadline you mentioned?",
    ],
    avoid: [
      "Do not send money to a personal account for university fees.",
      "Do not rush because of a same-day deadline.",
    ],
    officialSource: "The university's official fee payment page and your bank's fraud department",
  },
  {
    id: "whatsapp",
    icon: "📱",
    title: "WhatsApp & Social Media Claims",
    tone: "grad-lilac",
    summary: "Treat forwarded messages and voice notes as claims to be checked, not facts.",
    levels: ["BS", "MS", "PhD"],
    countries: ["Pakistan"],
    verify: [
      "Copy the exact text into the investigation so each claim can be checked.",
      "Ask for the original letter or email rather than a screenshot.",
      "Confirm names, numbers and deadlines on the official website.",
      "Save the message — it may be needed as evidence later.",
    ],
    signs: [
      "Voice notes promising guaranteed outcomes.",
      "Blurred or cropped screenshots showing only part of a letter.",
      "Claims of secret backchannels with embassy or university staff.",
    ],
    questions: [
      "Can you email this to me officially from your company email?",
      "Can you provide the official reference number for this claim?",
    ],
    avoid: [
      "Do not make life-altering decisions based on unverified chat screenshots.",
    ],
    officialSource: "Official university communications and verified embassy channels",
  },
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();
  const category = (url.searchParams.get("category") ?? "").toLowerCase().trim();

  let guides = GUIDES;
  if (category) {
    guides = guides.filter((g) => g.id.toLowerCase() === category);
  }
  if (q) {
    guides = guides.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.summary.toLowerCase().includes(q) ||
        g.signs.some((s) => s.toLowerCase().includes(q))
    );
  }

  return NextResponse.json({ guides, total: guides.length });
}
