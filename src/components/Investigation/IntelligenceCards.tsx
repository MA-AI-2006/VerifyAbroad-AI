import { ShieldCheck, ShieldAlert, Globe, BookOpen, ExternalLink, Sparkles } from "lucide-react";
import type { SanctionsFinding, LiveIntelligenceFinding, KnowledgeCitation } from "@/types";
import { Card } from "@/components/ui/primitives";

export function SanctionsCard({ finding }: { finding: SanctionsFinding }) {
  const isFlagged = finding.match_count > 0;

  return (
    <Card
      id="sanctions-screening-card"
      className={`p-4 sm:p-5 transition-all ${
        isFlagged
          ? "border-red-300 bg-red-50/40 text-red-950"
          : "border-slate-200 bg-slate-50/40 text-slate-900"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          {isFlagged ? (
            <ShieldAlert className="size-[18px] text-red-600" aria-hidden="true" />
          ) : (
            <ShieldCheck className="size-[18px] text-emerald-600" aria-hidden="true" />
          )}
          OpenSanctions Regulatory Screening
        </h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
            isFlagged ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {isFlagged ? `${finding.match_count} Match Alert` : "Clear"}
        </span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-slate-700">{finding.summary}</p>

      {isFlagged && (
        <div className="mt-3 space-y-2">
          {finding.high_risk_matches.map((match) => (
            <div
              key={match.id}
              className="rounded-lg border border-red-200 bg-white p-3 text-xs shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-red-900">{match.caption}</span>
                <span className="text-[10px] text-slate-500">Schema: {match.schema}</span>
              </div>
              {match.datasets.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {match.datasets.map((ds) => (
                    <span
                      key={ds}
                      className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-800"
                    >
                      {ds}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function LiveIntelligenceCard({ finding }: { finding: LiveIntelligenceFinding }) {
  if (!finding.searched || (finding.results.length === 0 && !finding.summary)) {
    return null;
  }

  return (
    <Card id="live-intelligence-card" className="border-indigo-100 bg-indigo-50/30 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-indigo-950">
          <Globe className="size-[18px] text-indigo-600" aria-hidden="true" />
          Live Web Intelligence
          <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
            <Sparkles className="size-3" />
            {finding.source === "tavily" ? "Tavily Search" : "Gemini Grounding"}
          </span>
        </h3>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-slate-700">{finding.summary}</p>

      {finding.results.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
            Real-Time Citations
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {finding.results.slice(0, 4).map((item, idx) => (
              <a
                key={`${item.url}-${idx}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="group flex flex-col justify-between rounded-lg border border-indigo-200/80 bg-white p-2.5 text-xs transition-colors hover:border-indigo-400 hover:shadow-xs"
              >
                <div className="font-semibold text-slate-900 group-hover:text-indigo-700 line-clamp-1">
                  {item.title}
                </div>
                {item.snippet && (
                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{item.snippet}</p>
                )}
                <div className="mt-2 flex items-center gap-1 text-[10px] text-indigo-600">
                  <span>Visit source</span>
                  <ExternalLink className="size-3" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export function KnowledgeCitationsCard({ citations }: { citations: KnowledgeCitation[] }) {
  if (!citations || citations.length === 0) return null;

  return (
    <Card id="knowledge-citations-card" className="border-emerald-200/80 bg-emerald-50/30 p-4 sm:p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-emerald-950">
        <BookOpen className="size-[18px] text-emerald-700" aria-hidden="true" />
        Verified Policy Directives (RAG Knowledge Base)
      </h3>

      <div className="mt-3 space-y-2.5">
        {citations.map((cite, idx) => (
          <div
            key={`${cite.document_title}-${idx}`}
            className="rounded-lg border border-emerald-200/70 bg-white p-3 text-xs shadow-2xs"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-emerald-950">{cite.document_title}</span>
              {cite.relevance_score !== undefined && (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  {Math.round(cite.relevance_score * 100)}% match
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              Source: {cite.source} {cite.section ? `• ${cite.section}` : ""}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-700 border-l-2 border-emerald-400 pl-2 italic">
              &ldquo;{cite.snippet}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
