"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2, ShieldCheck, UserPlus } from "lucide-react";

import { api } from "@/services/api";
import { cn } from "@/utils/ui";
import type { DegreeLevel, Language } from "@/types";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [degreeLevel, setDegreeLevel] = useState<DegreeLevel | "">("");
  const [preferredLanguage, setPreferredLanguage] = useState<Language>("roman_urdu");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const response = await api.signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        degree_level: degreeLevel ? degreeLevel : null,
        preferred_language: preferredLanguage,
      });
      setStatus("idle");
      setMessage(`Account created for ${response.account.name || response.account.email}! Redirecting...`);
      window.setTimeout(() => router.push("/investigate"), 700);
    } catch (cause) {
      setStatus("error");
      setMessage(cause instanceof Error ? cause.message : "Could not create account.");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-12 sm:px-6 lg:py-16">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-3.5 py-1.5 text-xs font-bold text-ink-700">
            <ShieldCheck className="size-4 text-brand-600" aria-hidden="true" />
            VerifyAbroad AI
          </span>
          <h1 className="mt-4 text-[clamp(1.8rem,4.2vw,2.6rem)] font-black leading-tight tracking-tight text-ink-900">
            Create your student account.
          </h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-ink-600">
            Save your study-abroad investigations, track consultant signals, and protect your family
            before you pay or sign.
          </p>
          <div className="mt-6 space-y-2 text-xs font-semibold text-ink-600">
            <p className="flex items-center gap-2">
              <span className="text-brand-600">✓</span> Free access for Pakistani students
            </p>
            <p className="flex items-center gap-2">
              <span className="text-brand-600">✓</span> Keep a history of all verified claims & offers
            </p>
            <p className="flex items-center gap-2">
              <span className="text-brand-600">✓</span> Multi-language support: English, Roman Urdu & اردو
            </p>
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
            Verify Before You Trust, Pay, or Proceed.
          </p>
        </div>

        <div className="card-lift rounded-[32px] border border-white bg-white/85 p-6 shadow-[0_30px_60px_-50px_rgba(34,48,74,0.8)] sm:p-8">
          <h2 className="text-lg font-black tracking-tight text-ink-900">Sign up</h2>
          <p className="mt-1 text-sm text-ink-600">Enter your basic details to get started.</p>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-bold text-ink-800">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-900 focus:border-brand-500 focus:outline-none"
                placeholder="Muhammad Ali"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-bold text-ink-800">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-900 focus:border-brand-500 focus:outline-none"
                placeholder="ali@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-bold text-ink-800">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-900 focus:border-brand-500 focus:outline-none"
                placeholder="At least 6 characters"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="degreeLevel" className="text-xs font-bold text-ink-800">
                  Target Level
                </label>
                <select
                  id="degreeLevel"
                  value={degreeLevel}
                  onChange={(event) => setDegreeLevel(event.target.value as DegreeLevel | "")}
                  className="mt-1.5 w-full rounded-2xl border border-ink-200 bg-white px-3.5 py-3 text-xs font-semibold text-ink-900 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">Not decided yet</option>
                  <option value="BS">Bachelor&apos;s (BS)</option>
                  <option value="MS">Master&apos;s (MS)</option>
                  <option value="PhD">Doctorate (PhD)</option>
                </select>
              </div>

              <div>
                <label htmlFor="preferredLanguage" className="text-xs font-bold text-ink-800">
                  Preferred Language
                </label>
                <select
                  id="preferredLanguage"
                  value={preferredLanguage}
                  onChange={(event) => setPreferredLanguage(event.target.value as Language)}
                  className="mt-1.5 w-full rounded-2xl border border-ink-200 bg-white px-3.5 py-3 text-xs font-semibold text-ink-900 focus:border-brand-500 focus:outline-none"
                >
                  <option value="roman_urdu">Roman Urdu</option>
                  <option value="english">English</option>
                  <option value="urdu">اردو</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-powder-600 px-5 py-3.5 text-sm font-bold text-white",
                "shadow-[0_18px_34px_-18px_rgba(70,99,214,0.95)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              {status === "loading" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <UserPlus className="size-4" aria-hidden="true" />
              )}
              Create Account
            </button>

            <div className="flex items-center justify-center pt-1 text-xs font-bold text-ink-600">
              Already have an account?&nbsp;
              <Link href="/login" className="text-brand-700 hover:text-brand-800">
                Sign in
              </Link>
            </div>
          </form>

          {message ? (
            <p
              role="status"
              className={cn(
                "mt-4 flex items-start gap-2 rounded-2xl border px-3.5 py-3 text-sm font-semibold",
                status === "error"
                  ? "border-coral-200 bg-coral-50 text-coral-700"
                  : "border-brand-200 bg-brand-50 text-brand-800",
              )}
            >
              {status === "error" ? (
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              ) : (
                <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              )}
              {message}
            </p>
          ) : null}

          <p className="mt-5 border-t border-[color:var(--color-hairline)] pt-4 text-[11px] leading-relaxed text-ink-500">
            We never ask for passwords to your email, bank or university accounts. Do not share
            banking credentials with anyone — including us.
          </p>
        </div>
      </div>
    </div>
  );
}
