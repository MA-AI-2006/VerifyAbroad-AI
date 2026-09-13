"use client";

import { useMemo, useState } from "react";
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

  const filtered = allItems.filter((item) => {
    const haystack = [
      item.title,
      item.subtitle,
      item.tags.join(" "),
      item.meta.map((meta) => meta.value).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    if (query.trim() && !haystack.includes(query.trim().toLowerCase())) return false;
    if (country && item.country !== country) return false;
    if (level && !item.levels.includes(level)) return false;
    if (tag && !item.tags.includes(tag)) return false;
    return true;
  });

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all",
      active
        ? "border-brand-300 bg-white text-ink-900 shadow-[0_10px_22px_-18px_rgba(34,48,74,0.6)]"
        : "border-white bg-white/70 text-ink-600 hover:bg-white",
    );

  const handleAiLookup = async (searchTarget?: string) => {
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
        throw new Error(`AI lookup returned status ${res.status}`);
      }

      const data: DirectoryItem = await res.json();
      if (data && data.title) {
        setAiItems((prev) => {
          const filteredPrev = prev.filter(
            (p) => p.title.toLowerCase().trim() !== data.title.toLowerCase().trim(),
          );
          return [data, ...filteredPrev];
        });
      }
    } catch (err) {
      console.error("AI lookup error:", err);
      setAiError(
        err instanceof Error ? err.message : "Unable to complete AI search. Please check your internet connection.",
      );
    } finally {
      setIsSearchingAi(false);
    }
  };

  const categoryLabel =
    category === "scholarship"
      ? "scholarship"
      : category === "consultant"
        ? "consultant"
        : "university";

  return (
    <div>
      <div className="rounded-[28px] border border-white bg-white/75 p-4 shadow-[0_24px_50px_-44px_rgba(34,48,74,0.8)] sm:p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim() && filtered.length === 0) {
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
                type="button"
                onClick={() => handleAiLookup(query)}
                disabled={isSearchingAi}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-powder-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all"
                title={`Ask AI to find real-world details for "${query}"`}
              >
                {isSearchingAi ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5 text-amber-200" />
                )}
                <span className="hidden sm:inline">Ask AI</span>
              </button>
            ) : null}
          </div>
        </form>

        {/* AI Searching status or notification bar */}
        {isSearchingAi ? (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50/70 px-4 py-2.5 text-xs font-semibold text-brand-800 animate-pulse">
            <Loader2 className="size-4 animate-spin text-brand-600 shrink-0" />
            <span>
              Searching real-world education records, government registries, and official portals for &ldquo;{lastSearchedAiQuery}&rdquo;...
            </span>
          </div>
        ) : null}

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

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-[28px] border border-dashed border-brand-200 bg-white/80 p-8 text-center shadow-[0_24px_50px_-44px_rgba(34,48,74,0.8)]">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <Sparkles className="size-6" />
          </div>
          <h3 className="mt-3 text-base font-black text-ink-900">
            {query.trim()
              ? `"${query.trim()}" is not in the offline preset catalog`
              : emptyMessage}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-ink-600">
            {query.trim()
              ? `Our AI agent can search live global education databases, official portals, and accredited institutional registries to find authentic details and official links for "${query.trim()}".`
              : emptyMessage}
          </p>

          {query.trim() ? (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => handleAiLookup(query)}
                disabled={isSearchingAi}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-powder-600 px-6 py-3 text-xs font-bold text-white shadow-[0_12px_24px_-10px_rgba(70,99,214,0.8)] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
              >
                {isSearchingAi ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Searching real-world records...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 text-amber-200" />
                    Find &ldquo;{query.trim()}&rdquo; with AI Agent
                  </>
                )}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
          Offline presets are verified against curated sources. External entities are retrieved using live search grounding and accredited institutional registries.
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

