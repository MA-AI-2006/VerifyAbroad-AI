"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, RefreshCw, Search, Sparkles } from "lucide-react";

import { cn } from "@/utils/ui";

export interface DirectoryItem {
  id: string;
  title: string;
  subtitle: string;
  country: string | null;
  levels: string[];
  tags: string[];
  status: "verified" | "needs_verification" | "not_found";
  statusLabel: string;
  meta: { label: string; value: string }[];
  links: { label: string; url: string }[];
  note?: string | null;
  community?: { rating: number | null; report_count: number | null; complaints: string[]; label: string | null };
}

export type DirectoryCategory = "university" | "scholarship" | "consultant";

const statusStyles: Record<DirectoryItem["status"], string> = {
  verified: "border-brand-200 bg-brand-50 text-brand-800",
  needs_verification: "border-coral-200 bg-coral-50 text-coral-700",
  not_found: "border-lilac-200 bg-lilac-100 text-lilac-800",
};

const TONES = ["grad-mint", "grad-lilac", "grad-sage", "grad-coral", "grad-panel"];

function getCountryAliases(country?: string | null): string {
  if (!country) return "";
  const c = country.toLowerCase();
  if (c.includes("united kingdom") || c.includes("uk") || c.includes("england") || c.includes("britain")) {
    return "uk england britain british london scotland wales west yorkshire";
  }
  if (c.includes("united states") || c.includes("usa") || c.includes("us") || c.includes("america")) {
    return "usa us america american united states";
  }
  if (c.includes("australia")) {
    return "australia australian oz melbourne sydney brisbane perth";
  }
  if (c.includes("canada")) {
    return "canada canadian toronto ontario vancouver";
  }
  if (c.includes("germany")) {
    return "germany german deutschland munich berlin";
  }
  if (c.includes("pakistan")) {
    return "pakistan pakistani lahore islamabad karachi peshawar rawalpindi";
  }
  return "";
}

export function DirectoryExplorer({
  items: initialItems,
  category = "university",
  searchPlaceholder,
  emptyMessage,
}: {
  items: DirectoryItem[];
  category?: DirectoryCategory;
  searchPlaceholder: string;
  emptyMessage: string;
}) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);

  const [aiItems, setAiItems] = useState<DirectoryItem[]>([]);
  const [isSearchingAi, setIsSearchingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastSearchedAiQuery, setLastSearchedAiQuery] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const allItems = useMemo(() => {
    // Put AI-grounded items first, avoiding duplicates with initial items
    const existingTitles = new Set(initialItems.map((item) => item.title.toLowerCase().trim()));
    const uniqueAi = aiItems.filter((item) => !existingTitles.has(item.title.toLowerCase().trim()));
    return [...uniqueAi, ...initialItems];
  }, [aiItems, initialItems]);

  const countries = useMemo(
    () => Array.from(new Set(allItems.map((item) => item.country).filter((value): value is string => Boolean(value)))).sort(),
    [allItems],
  );
  const levels = useMemo(
    () => Array.from(new Set(allItems.flatMap((item) => item.levels))).filter(Boolean),
    [allItems],
  );
  const tags = useMemo(
    () => Array.from(new Set(allItems.flatMap((item) => item.tags))).filter(Boolean).slice(0, 10),
    [allItems],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      if (q) {
        const countryAliases = getCountryAliases(item.country);
        const haystack = [
          item.title,
          item.subtitle,
          item.country ?? "",
          countryAliases,
          item.tags.join(" "),
          item.levels.join(" "),
          item.note ?? "",
          item.meta.map((meta) => `${meta.label} ${meta.value}`).join(" "),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      if (country && item.country !== country) return false;
      if (level && !item.levels.includes(level)) return false;
      if (tag && !item.tags.includes(tag)) return false;
      return true;
    });
  }, [allItems, query, country, level, tag]);

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all",
      active
        ? "border-brand-300 bg-white text-ink-900 shadow-[0_10px_22px_-18px_rgba(34,48,74,0.6)]"
        : "border-white bg-white/70 text-ink-600 hover:bg-white",
    );

  const handleAiLookup = useCallback(
    async (searchTarget?: string) => {
      const target = (searchTarget ?? query).trim();
      if (!target) return;

      setIsSearchingAi(true);
      setAiError(null);
      setLastSearchedAiQuery(target);

      try {
        const res = await fetch("/api/search/ai-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, query: target }),
        });

        if (!res.ok) {
          throw new Error(`AI search service returned status ${res.status}`);
        }

        const data = await res.json();
        const item: DirectoryItem = data.item ?? data;
        if (item && item.title) {
          setAiItems((prev) => {
            const filteredPrev = prev.filter(
              (p) => p.title.toLowerCase().trim() !== item.title.toLowerCase().trim(),
            );
            return [item, ...filteredPrev];
          });
        }
      } catch (err) {
        console.error("AI lookup error:", err);
        setAiError(
          err instanceof Error ? err.message : "Unable to complete AI search. Please try again.",
        );
      } finally {
        setIsSearchingAi(false);
      }
    },
    [category, query],
  );

  // Automatically search with AI if user enters an institution/scholarship/agency not yet present in presets
  useEffect(() => {
    const trimmed = query.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (trimmed.length >= 3 && filtered.length === 0 && !isSearchingAi) {
      if (lastSearchedAiQuery?.toLowerCase() !== trimmed.toLowerCase()) {
        debounceRef.current = setTimeout(() => {
          handleAiLookup(trimmed);
        }, 500);
      }
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, filtered.length, isSearchingAi, lastSearchedAiQuery, handleAiLookup]);

  return (
    <div>
      <div className="rounded-[28px] border border-white bg-white/75 p-4 shadow-[0_24px_50px_-44px_rgba(34,48,74,0.8)] sm:p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) {
              handleAiLookup(query);
            }
          }}
          className="relative block"
        >
          <label className="relative block">
            <span className="sr-only">{searchPlaceholder}</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-2xl border border-white bg-white/90 py-3 pl-11 pr-28 text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </label>

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {query.trim() ? (
              <button
                type="submit"
                disabled={isSearchingAi}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-powder-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all"
                title={`Search with AI Agent`}
              >
                {isSearchingAi ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5 text-amber-200" />
                )}
                <span>Search</span>
              </button>
            ) : null}
          </div>
        </form>

        {aiError ? (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-coral-200 bg-coral-50 px-4 py-2.5 text-xs font-semibold text-coral-800">
            <span>{aiError}</span>
            <button
              type="button"
              onClick={() => handleAiLookup(lastSearchedAiQuery ?? query)}
              className="inline-flex items-center gap-1 font-bold text-coral-900 underline hover:opacity-80"
            >
              <RefreshCw className="size-3" /> Retry
            </button>
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {countries.length > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Country</span>
              <button type="button" onClick={() => setCountry(null)} className={chip(!country)}>
                All
              </button>
              {countries.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCountry(country === value ? null : value)}
                  className={chip(country === value)}
                >
                  {value}
                </button>
              ))}
            </div>
          ) : null}

          {levels.length > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Level</span>
              <button type="button" onClick={() => setLevel(null)} className={chip(!level)}>
                All
              </button>
              {levels.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLevel(level === value ? null : value)}
                  className={chip(level === value)}
                >
                  {value}
                </button>
              ))}
            </div>
          ) : null}

          {tags.length > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">More</span>
              <button type="button" onClick={() => setTag(null)} className={chip(!tag)}>
                All
              </button>
              {tags.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTag(tag === value ? null : value)}
                  className={chip(tag === value)}
                >
                  {value}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 && !isSearchingAi ? (
        <div className="mt-6 rounded-[28px] border border-white bg-white/75 p-8 text-center shadow-[0_24px_50px_-44px_rgba(34,48,74,0.8)]">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-ink-500">
            <Search className="size-6" />
          </div>
          <h3 className="mt-3 text-base font-black text-ink-900">
            {query.trim() ? `No records found matching "${query.trim()}"` : emptyMessage}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-500">
            {query.trim()
              ? "Please check the spelling or enter the full name to search official institutional records."
              : emptyMessage}
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {isSearchingAi ? (
            <li className="card-lift rise overflow-hidden rounded-[30px] border border-brand-300 bg-white/95 shadow-[0_24px_50px_-44px_rgba(34,48,74,0.8)] ring-2 ring-brand-500/20">
              <div className="bg-gradient-to-r from-brand-100/90 to-powder-100/90 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin text-brand-600 shrink-0" />
                      <h3 className="text-base font-black leading-snug tracking-tight text-ink-900">
                        {lastSearchedAiQuery ?? query}
                      </h3>
                    </div>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                      <Sparkles className="size-2.5 text-brand-600" />
                      Real-time AI Verification
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full border border-brand-300 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                    Retrieving...
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-ink-600">
                  Verifying official website, direct application portal, and accreditation...
                </p>
              </div>

              <div className="space-y-3 px-5 py-4">
                <div className="h-3.5 w-4/5 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-3/5 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                <div className="flex gap-2 pt-2">
                  <div className="h-7 w-28 animate-pulse rounded-xl bg-brand-200/70" />
                  <div className="h-7 w-28 animate-pulse rounded-xl bg-slate-200" />
                </div>
              </div>
            </li>
          ) : null}

          {filtered.map((item, index) => {
            const isAiGrounded = item.id.startsWith("ai-");
            return (
              <li
                key={item.id}
                className={cn(
                  "card-lift rise overflow-hidden rounded-[30px] border bg-white/85 shadow-[0_24px_50px_-44px_rgba(34,48,74,0.8)]",
                  isAiGrounded ? "border-brand-300 ring-2 ring-brand-500/20" : "border-white",
                )}
                style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
              >
                <div className={cn("px-5 py-4", TONES[index % TONES.length])}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black leading-snug tracking-tight text-ink-900">
                        {item.title}
                      </h3>
                      {isAiGrounded ? (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                          <Sparkles className="size-2.5 text-brand-600" />
                          Real-World AI Grounded
                        </span>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                        statusStyles[item.status],
                      )}
                    >
                      {item.statusLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-ink-600">{item.subtitle}</p>
                </div>

                <div className="px-5 py-4">
                  <dl className="space-y-2">
                    {item.meta.map((meta) => (
                      <div key={meta.label} className="flex items-baseline justify-between gap-3">
                        <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
                          {meta.label}
                        </dt>
                        <dd className="max-w-[62%] text-right text-xs font-semibold text-ink-800">
                          {meta.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {item.community ? (
                    <div className="mt-3 rounded-2xl border border-dashed border-ink-200 bg-white/70 px-3 py-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">
                        Community signals
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-ink-800">
                        ⭐ {item.community.rating !== null ? item.community.rating.toFixed(1) : "—"}/5 ·{" "}
                        {item.community.report_count ?? 0} reports
                      </p>
                      {item.community.complaints.length > 0 ? (
                        <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                          {item.community.complaints.join(" · ")}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[10px] leading-relaxed text-ink-400">
                        Supporting signals only — may contain unverified claims.
                        {item.community.label ? ` (${item.community.label})` : ""}
                      </p>
                    </div>
                  ) : null}

                  {item.note ? (
                    <p className="mt-3 text-[11px] leading-relaxed text-ink-500">{item.note}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/investigate?q=${encodeURIComponent(item.title)}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-powder-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_10px_20px_-10px_rgba(70,99,214,0.8)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Sparkles className="size-3 text-amber-200" aria-hidden="true" />
                      Investigate with AI
                    </Link>

                    {item.links.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white bg-white px-3 py-1.5 text-[11px] font-bold text-ink-800 transition-colors hover:border-brand-200 hover:bg-brand-50"
                      >
                        {link.label}
                        <ExternalLink className="size-3" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs leading-relaxed text-ink-500">
        <p>
          Verified with real-world institutional directories, official university portals, and government accreditation bodies.
        </p>
        {aiItems.length > 0 ? (
          <button
            type="button"
            onClick={() => setAiItems([])}
            className="shrink-0 text-[11px] font-bold text-brand-600 hover:underline"
          >
            Clear AI results ({aiItems.length})
          </button>
        ) : null}
      </div>
    </div>
  );
}

