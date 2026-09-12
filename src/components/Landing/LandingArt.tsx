"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Check, Compass, ShieldCheck, Sparkles } from "lucide-react";

import { cn } from "@/utils/ui";

/* ------------------------------------------------------------------ hero art */

const FLOATING_CARDS = [
  {
    icon: "🎓",
    title: "University",
    value: "Technical University of Munich",
    state: "Verified",
    tone: "brand",
    position: "left-0 top-0",
    delay: "delay-1",
  },
  {
    icon: "🎁",
    title: "Scholarship",
    value: "DAAD — funding claim",
    state: "Needs verification",
    tone: "amber",
    position: "right-0 top-[27%]",
    delay: "delay-2",
  },
  {
    icon: "👤",
    title: "Consultant",
    value: "Affiliation unconfirmed",
    state: "Unverified",
    tone: "amber",
    position: "left-0 bottom-[27%]",
    delay: "delay-3",
  },
  {
    icon: "💳",
    title: "Payment",
    value: "PKR 500,000 requested",
    state: "High risk",
    tone: "coral",
    position: "right-0 bottom-0",
    delay: "delay-4",
  },
] as const;

const toneClass: Record<string, string> = {
  brand: "text-brand-700 bg-brand-50 border-brand-200",
  amber: "text-risk-amber bg-coral-50 border-coral-200",
  coral: "text-risk-red bg-coral-50 border-coral-200",
};

export function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      {/* colour blobs */}
      <span aria-hidden="true" className="blob absolute -left-6 top-8 size-40 bg-brand-300" />
      <span aria-hidden="true" className="blob absolute -right-4 top-0 size-44 bg-powder-300" />
      <span aria-hidden="true" className="blob absolute bottom-4 left-1/3 size-40 bg-lilac-300" />
      <span aria-hidden="true" className="blob absolute -bottom-2 right-6 size-36 bg-coral-200" />

      {/* central illustration: passport, route, shield, cap */}
      <div className="glass pop-in absolute inset-[12%] grid place-items-center rounded-[42px] shadow-[0_40px_80px_-50px_rgba(34,48,74,0.6)]">
        <svg viewBox="0 0 320 320" className="h-full w-full p-4" role="img" aria-label="Illustration of a student's study-abroad journey: a passport, a graduation cap, a verification shield and a travel route">
          <defs>
            <linearGradient id="route" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#12b388" />
              <stop offset="60%" stopColor="#5f83ef" />
              <stop offset="100%" stopColor="#8b6ef2" />
            </linearGradient>
            <linearGradient id="cap" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5f83ef" />
              <stop offset="100%" stopColor="#8b6ef2" />
            </linearGradient>
          </defs>

          <circle cx="160" cy="160" r="118" fill="none" stroke="#ded4ff" strokeWidth="2" strokeDasharray="4 8" />
          <circle cx="160" cy="160" r="92" fill="none" stroke="#a7f3d4" strokeWidth="2" strokeDasharray="3 10" />

          <path
            d="M46 232 C 96 150, 150 210, 208 120 S 258 92, 274 78"
            fill="none"
            stroke="url(#route)"
            strokeWidth="5"
            strokeLinecap="round"
            className="draw-line"
          />
          <circle cx="46" cy="232" r="10" fill="#0a9670" />
          <circle cx="46" cy="232" r="10" fill="#0a9670" className="ping-soft" />
          <circle cx="274" cy="78" r="9" fill="#8b6ef2" />
          <path d="M262 84 l24 10 -24 10 5 -10 z" fill="#ff8a68" />

          {/* passport */}
          <g transform="translate(72 178) rotate(-8)">
            <rect width="86" height="60" rx="10" fill="#ffffff" stroke="#cfd7e8" strokeWidth="2" />
            <rect width="86" height="16" rx="8" fill="#5f83ef" />
            <circle cx="26" cy="40" r="10" fill="#e5efff" stroke="#a9caff" strokeWidth="2" />
            <rect x="44" y="32" width="30" height="5" rx="2.5" fill="#cfd7e8" />
            <rect x="44" y="42" width="22" height="5" rx="2.5" fill="#e8ecf5" />
          </g>

          {/* graduation cap */}
          <g transform="translate(176 58)">
            <path d="M0 18 L40 0 L80 18 L40 36 Z" fill="url(#cap)" />
            <path d="M16 26 v16 c0 8 48 8 48 0 V26" fill="#7151d8" opacity="0.85" />
            <circle cx="78" cy="20" r="5" fill="#f76b45" />
            <path d="M78 20 v22" stroke="#f76b45" strokeWidth="2" />
          </g>

          {/* shield with check */}
          <g transform="translate(196 176)">
            <path
              d="M34 4 L62 15 v22 c0 20 -14 30 -28 36 C20 67 6 57 6 37 V15 Z"
              fill="#ffffff"
              stroke="#33cfa0"
              strokeWidth="4"
            />
            <path d="M22 36 l9 9 l17 -19" fill="none" stroke="#0a9670" strokeWidth="5" strokeLinecap="round" />
          </g>

          {/* magnifier over document */}
          <g transform="translate(120 108)">
            <rect width="58" height="40" rx="6" fill="#ffffff" stroke="#cfd7e8" strokeWidth="2" />
            <rect x="10" y="10" width="38" height="4" rx="2" fill="#a9caff" />
            <rect x="10" y="19" width="28" height="4" rx="2" fill="#e8ecf5" />
            <rect x="10" y="28" width="32" height="4" rx="2" fill="#e8ecf5" />
            <circle cx="50" cy="36" r="12" fill="#d2fbe9" stroke="#0a9670" strokeWidth="3" />
            <path d="M59 45 l10 10" stroke="#0a9670" strokeWidth="4" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {/* floating evidence cards */}
      {FLOATING_CARDS.map((card, index) => (
        <article
          key={card.title}
          className={cn(
            "glass absolute w-[54%] rounded-2xl px-3 py-2.5 shadow-[0_20px_40px_-26px_rgba(34,48,74,0.6)] sm:w-[48%] sm:px-3.5",
            card.position,
            index % 2 === 0 ? "floaty" : "floaty-alt",
          )}
        >
          <div className="flex items-start gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/90 text-base" aria-hidden="true">
              {card.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">{card.title}</p>
              <p className="truncate text-xs font-semibold text-ink-800">{card.value}</p>
              <span
                className={cn(
                  "mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                  toneClass[card.tone],
                )}
              >
                {card.state}
              </span>
            </div>
          </div>
        </article>
      ))}

      {/* connector lines */}
      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <path d="M14 14 C 34 26, 34 38, 42 46" fill="none" stroke="#a9caff" strokeWidth="0.7" strokeDasharray="2 2" />
        <path d="M86 34 C 70 42, 66 46, 58 50" fill="none" stroke="#a7f3d4" strokeWidth="0.7" strokeDasharray="2 2" />
        <path d="M16 78 C 34 72, 38 66, 44 60" fill="none" stroke="#c6b5ff" strokeWidth="0.7" strokeDasharray="2 2" />
        <path d="M84 84 C 68 78, 64 72, 58 64" fill="none" stroke="#ffac8c" strokeWidth="0.7" strokeDasharray="2 2" />
      </svg>
    </div>
  );
}

/* --------------------------------------------------------- world map section */

interface Destination {
  code: string;
  flag: string;
  name: string;
  levels: string;
  funding: string;
  keyVerification: string;
  popularExamples: string;
  x: number;
  y: number;
  tone: string;
  route: string;
}

const DESTINATIONS: Destination[] = [
  {
    code: "DE",
    flag: "🇩🇪",
    name: "Germany",
    levels: "BS • MS • PhD",
    funding: "Scholarships • University Funding • Self Funded",
    popularExamples: "DAAD Scholarships, Deutschlandstipendium, Tuition-free public university degrees",
    keyVerification: "Direct uni-assist admissions, APS certificate validation, Sperrkonto (Blocked account) deposit safeguards",
    x: 580,
    y: 200,
    tone: "#f59e0b",
    route: "M 230 310 C 310 220, 460 175, 580 200",
  },
  {
    code: "UK",
    flag: "🇬🇧",
    name: "UK",
    levels: "BS • MS • PhD",
    funding: "Scholarships • University Funding • Self Funded",
    popularExamples: "Chevening, Commonwealth, GREAT Scholarships, University merit discount waivers",
    keyVerification: "CAS letter authenticity, UKVI Tier-4 licensed sponsor checks, verifying Pakistani consultants on university agent lists",
    x: 480,
    y: 135,
    tone: "#3b82f6",
    route: "M 230 310 C 270 175, 380 115, 480 135",
  },
  {
    code: "CA",
    flag: "🇨🇦",
    name: "Canada",
    levels: "BS • MS • PhD",
    funding: "Scholarships • University Funding • Self Funded",
    popularExamples: "Vanier Canada Graduate, Institutional Entrance Awards, Research Assistantships (RA/TA)",
    keyVerification: "DLI (Designated Learning Institution) registration, Provincial Attestation Letter (PAL) quota verification, fee escrow safety",
    x: 380,
    y: 105,
    tone: "#ef4444",
    route: "M 230 310 C 240 150, 300 95, 380 105",
  },
  {
    code: "AU",
    flag: "🇦🇺",
    name: "Australia",
    levels: "BS • MS • PhD",
    funding: "Scholarships • University Funding • Self Funded",
    popularExamples: "Australia Awards, Destination Australia, Research Training Program (RTP)",
    keyVerification: "CRICOS course registry verification, Genuine Student (GS) compliance, official university direct wire payment channels",
    x: 670,
    y: 345,
    tone: "#10b981",
    route: "M 230 310 C 350 335, 520 375, 670 345",
  },
  {
    code: "TR",
    flag: "🇹🇷",
    name: "Türkiye",
    levels: "BS • MS • PhD",
    funding: "Scholarships • University Funding • Self Funded",
    popularExamples: "Türkiye Bursları (Full government scholarship + stipend), YTB support, University tuition waivers",
    keyVerification: "Official Türkiye Bursları portal verification, YÖK accreditation check, avoiding middlemen who charge for free scholarship forms",
    x: 450,
    y: 245,
    tone: "#8b5cf6",
    route: "M 230 310 C 280 265, 365 240, 450 245",
  },
];

export function WorldJourney() {
  const [active, setActive] = useState<string>("DE");
  const activeDestination = DESTINATIONS.find((item) => item.code === active) ?? DESTINATIONS[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.28fr_1fr] lg:items-center">
      {/* Visual Storytelling Element: Artistic World Map */}
      <div className="relative overflow-hidden rounded-[36px] border border-white bg-white/75 p-3 sm:p-5 shadow-[0_30px_70px_-50px_rgba(34,48,74,0.45)] backdrop-blur-md">
        <div className="relative aspect-[16/10] w-full select-none">
          <svg
            viewBox="0 0 800 480"
            className="absolute inset-0 size-full"
            role="img"
            aria-label="Artistic visual world map showing study-abroad routes from Pakistan to UK, Germany, Canada, Australia and Türkiye"
          >
            <defs>
              <linearGradient id="artBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8faff" />
                <stop offset="50%" stopColor="#f0f5fc" />
                <stop offset="100%" stopColor="#eaf1fb" />
              </linearGradient>

              <radialGradient id="worldAura" cx="50%" cy="48%" r="60%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#f0f6ff" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#e2ecfb" stopOpacity="0.1" />
              </radialGradient>

              <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background canvas */}
            <rect width="800" height="480" rx="28" fill="url(#artBgGrad)" />
            <ellipse cx="430" cy="240" rx="360" ry="200" fill="url(#worldAura)" />

            {/* Artistic cartographic longitude and latitude grid lines */}
            <g stroke="#dce7f5" strokeWidth="1" strokeDasharray="4 6" fill="none" opacity="0.65">
              <path d="M 60 150 Q 400 115 740 150" />
              <path d="M 40 240 Q 400 215 760 240" />
              <path d="M 60 330 Q 400 310 740 330" />
              <path d="M 230 40 Q 205 240 230 440" />
              <path d="M 410 30 Q 410 240 410 450" />
              <path d="M 590 40 Q 615 240 590 440" />
            </g>

            {/* Stylized artistic continent silhouettes */}
            <g fill="#e3effc" stroke="#ccdef9" strokeWidth="1.2" opacity="0.85">
              {/* North America / Canada */}
              <path d="M 120 70 Q 210 50 280 65 Q 370 80 340 120 Q 280 155 240 150 Q 210 190 170 180 Q 140 140 120 70 Z" />
              {/* South America */}
              <path d="M 190 220 Q 235 230 245 280 Q 235 360 195 390 Q 170 340 165 270 Z" />
              {/* Europe */}
              <path d="M 420 85 Q 490 65 550 80 Q 570 125 530 160 Q 450 160 420 125 Z" />
              {/* Africa */}
              <path d="M 410 180 Q 495 185 510 240 Q 505 320 460 380 Q 415 340 395 260 Z" />
              {/* Asia & Eurasia */}
              <path d="M 510 75 Q 640 60 720 100 Q 750 180 680 245 Q 580 255 520 195 Z" />
              {/* Australia */}
              <path d="M 625 315 Q 700 300 730 330 Q 720 385 660 390 Q 620 370 625 315 Z" />
            </g>

            {/* Concentric journey distance rings from Pakistan */}
            <g stroke="#93c5fd" strokeWidth="0.9" strokeDasharray="3 6" fill="none">
              <circle cx="230" cy="310" r="110" opacity="0.4" />
              <circle cx="230" cy="310" r="230" opacity="0.28" />
              <circle cx="230" cy="310" r="360" opacity="0.18" />
            </g>

            {/* Animated curved routes from Pakistan */}
            {DESTINATIONS.map((dest) => {
              const isSelected = active === dest.code;
              return (
                <g key={`route-${dest.code}`}>
                  {/* Subtle background track */}
                  <path
                    d={dest.route}
                    fill="none"
                    stroke={isSelected ? dest.tone : "#a3b8d6"}
                    strokeWidth={isSelected ? "3" : "1.6"}
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                    className={cn(
                      "transition-all duration-300",
                      isSelected ? "dash-run opacity-100" : "opacity-40",
                    )}
                  />
                  {/* Glowing halo for active route */}
                  {isSelected && (
                    <path
                      d={dest.route}
                      fill="none"
                      stroke={dest.tone}
                      strokeWidth="7"
                      strokeLinecap="round"
                      opacity="0.22"
                      filter="url(#routeGlow)"
                    />
                  )}
                </g>
              );
            })}

            {/* Origin Hub: Pakistan */}
            <g transform="translate(230, 310)">
              {/* Pulsing beacon */}
              <circle r="22" fill="#10b981" opacity="0.15" className="ping-soft" />
              <circle r="12" fill="#10b981" opacity="0.3" />
              <circle r="7" fill="#047857" />
              <circle r="2.8" fill="#ffffff" />

              {/* Hub Label */}
              <g transform="translate(0, 24)">
                <rect
                  x="-42"
                  y="-12"
                  width="84"
                  height="22"
                  rx="11"
                  fill="#047857"
                  className="shadow-sm"
                />
                <text
                  textAnchor="middle"
                  y="3"
                  fontSize="11"
                  fontWeight="800"
                  fill="#ffffff"
                  className="select-none"
                >
                  🇵🇰 Pakistan
                </text>
              </g>
            </g>

            {/* Destination Nodes */}
            {DESTINATIONS.map((dest) => {
              const isSelected = active === dest.code;
              return (
                <g
                  key={dest.code}
                  transform={`translate(${dest.x}, ${dest.y})`}
                  className="cursor-pointer outline-none transition-transform duration-200 hover:scale-105"
                  tabIndex={0}
                  role="button"
                  aria-label={`Select ${dest.name}`}
                  onMouseEnter={() => setActive(dest.code)}
                  onFocus={() => setActive(dest.code)}
                  onClick={() => setActive(dest.code)}
                >
                  {/* Active highlight glow */}
                  {isSelected && (
                    <circle r="24" fill={dest.tone} opacity="0.25" className="ping-soft" />
                  )}

                  {/* Node outer badge */}
                  <circle
                    r={isSelected ? "15" : "12"}
                    fill="#ffffff"
                    stroke={dest.tone}
                    strokeWidth={isSelected ? "2.5" : "1.8"}
                    className="shadow-md transition-all"
                  />
                  {/* Node inner pill */}
                  <circle
                    r={isSelected ? "11" : "8.5"}
                    fill={dest.tone}
                    className="transition-all"
                  />
                  {/* Two-letter code */}
                  <text
                    textAnchor="middle"
                    dy="3.5"
                    fontSize={isSelected ? "10" : "8.5"}
                    fontWeight="800"
                    fill="#ffffff"
                    className="select-none pointer-events-none"
                  >
                    {dest.code}
                  </text>

                  {/* Floating Pill with Flag & Name */}
                  <g transform="translate(0, -22)">
                    <rect
                      x={-dest.name.length * 4.2 - 14}
                      y="-11"
                      width={dest.name.length * 8.4 + 28}
                      height="20"
                      rx="10"
                      fill={isSelected ? "#0f172a" : "rgba(255, 255, 255, 0.96)"}
                      stroke={isSelected ? "#0f172a" : "#dbeafe"}
                      strokeWidth="1"
                      className="shadow-xs transition-colors"
                    />
                    <text
                      textAnchor="middle"
                      y="3"
                      fontSize="10.5"
                      fontWeight={isSelected ? "700" : "600"}
                      fill={isSelected ? "#ffffff" : "#1e293b"}
                      className="select-none pointer-events-none"
                    >
                      {dest.flag} {dest.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-3 flex items-center justify-between px-2 text-[11px] text-ink-500">
          <span>Artistic storytelling map · Animated departure routes</span>
          <span className="hidden sm:inline">Hover or tap any destination</span>
        </div>
      </div>

      {/* Destination Controls & Storytelling Country Card */}
      <div className="space-y-4">
        {/* Quick-select pills */}
        <div className="flex flex-wrap items-center gap-2">
          {DESTINATIONS.map((dest) => {
            const isSelected = active === dest.code;
            return (
              <button
                key={dest.code}
                type="button"
                onMouseEnter={() => setActive(dest.code)}
                onClick={() => setActive(dest.code)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all",
                  isSelected
                    ? "border-brand-400 bg-white text-ink-900 shadow-md ring-2 ring-brand-100"
                    : "border-white/80 bg-white/70 text-ink-600 hover:bg-white hover:text-ink-900",
                )}
              >
                <span aria-hidden="true">{dest.flag}</span>
                <span>{dest.name}</span>
              </button>
            );
          })}
        </div>

        {/* Requested Country Card */}
        <div
          key={activeDestination.code}
          className="pop-in rounded-[30px] border border-white/90 bg-white/85 p-6 shadow-[0_24px_50px_-24px_rgba(34,48,74,0.2)] backdrop-blur-md sm:p-7"
        >
          {/* Country Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl sm:text-5xl" aria-hidden="true">
                {activeDestination.flag}
              </span>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-ink-900">
                  {activeDestination.name}
                </h3>
                <p className="text-xs font-semibold text-ink-500">
                  Study abroad destination
                </p>
              </div>
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-extrabold"
              style={{
                backgroundColor: `${activeDestination.tone}15`,
                color: activeDestination.tone,
              }}
            >
              {activeDestination.code}
            </span>
          </div>

          {/* Popular study levels */}
          <div className="mt-5 rounded-2xl border border-powder-100 bg-powder-50/60 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
              Popular study levels:
            </p>
            <p className="mt-1.5 text-base font-extrabold tracking-wide text-ink-900">
              {activeDestination.levels}
            </p>
          </div>

          {/* Funding */}
          <div className="mt-3.5 rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
              Funding:
            </p>
            <p className="mt-1.5 text-base font-extrabold text-brand-800">
              {activeDestination.funding}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-600">
              {activeDestination.popularExamples}
            </p>
          </div>

          {/* Key Verification Check for Pakistani Applicants */}
          <div className="mt-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
              Key things to verify:
            </p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-ink-700">
              {activeDestination.keyVerification}
            </p>
          </div>

          {/* Primary Action Button */}
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/guides"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-powder-600 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_32px_-16px_rgba(70,99,214,0.85)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <BookOpenCheck className="size-4" aria-hidden="true" />
              Explore Safety Guide
            </Link>
            <Link
              href={`/investigate?q=${encodeURIComponent(activeDestination.name)}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50"
            >
              Verify Offer
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
