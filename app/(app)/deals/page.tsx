"use client";

import { useDeals } from "@/lib/hooks/useDeals";
import Link from "next/link";
import type { DealStatus, LocalDeal } from "@/types/deal";

const $ = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const STATUS_OPTIONS: DealStatus[] = ["analyzing", "negotiate", "loi", "under_contract", "closed", "pass", "dead"];

const STATUS_STYLE: Record<DealStatus, string> = {
  analyzing:      "border-[var(--info)] text-[var(--info)]",
  negotiate:      "border-[var(--warn)] text-[var(--warn)]",
  loi:            "border-[var(--warn)] text-[var(--warn)]",
  under_contract: "border-[var(--accent)] text-[var(--accent)]",
  closed:         "bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]",
  pass:           "border-[var(--ink-faint)] text-[var(--ink-faint)]",
  dead:           "border-[var(--bad)] text-[var(--bad)]",
};

const STATUS_LABEL: Record<DealStatus, string> = {
  analyzing: "Analyzing", negotiate: "Negotiate", loi: "LOI",
  under_contract: "Under Contract", closed: "Closed", pass: "Pass", dead: "Dead",
};

function verdictOf(d: LocalDeal) {
  return (d.result as any)?.verdict ?? "—";
}

function keyMetric(d: LocalDeal): string {
  if (d.mode === "brrrr") {
    const cf = (d.result as any)?.cashflowMonthly ?? 0;
    return `${$(cf)}/mo`;
  }
  const cap = (d.result as any)?.goingInCapRate ?? 0;
  return `${(cap * 100).toFixed(2)}% cap`;
}

export default function DealsPage() {
  const { deals, loaded, updateStatus, deleteDeal } = useDeals();

  if (!loaded) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold font-mono text-[var(--ink)]">Pipeline</h1>
          <p className="text-xs text-[var(--ink-faint)] font-mono mt-0.5">{deals.length} deal{deals.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/"
          className="px-4 py-2 text-xs font-mono font-bold bg-[var(--accent)] text-[var(--bg)] rounded hover:opacity-90 transition-opacity">
          + New Analysis
        </Link>
      </div>

      {deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <p className="text-[var(--ink-dim)] font-mono text-sm">No deals saved yet.</p>
          <p className="text-[var(--ink-faint)] font-mono text-xs">Run an analysis and click Save Deal.</p>
          <Link href="/" className="text-[var(--accent)] font-mono text-xs hover:underline mt-2">Start analyzing →</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {deals.map(deal => (
            <div key={deal.id}
              className="bg-[var(--panel)] border border-[var(--line)] rounded-lg p-4 flex items-center gap-4 hover:border-[var(--line-2)] transition-colors">
              {/* Mode badge */}
              <span className="text-[9px] font-mono font-bold text-[var(--accent)] bg-[var(--bg)] border border-[var(--accent-dim)] rounded px-2 py-1 flex-shrink-0">
                {deal.mode.toUpperCase()}
              </span>

              {/* Name + address */}
              <div className="flex-1 min-w-0">
                <Link href={`/?deal=${deal.id}`}
                  className="text-sm font-mono font-bold text-[var(--ink)] hover:text-[var(--accent)] transition-colors truncate block">
                  {deal.name || "Untitled Deal"}
                </Link>
                {deal.address && (
                  <p className="text-xs font-mono text-[var(--ink-faint)] truncate">{deal.address}</p>
                )}
              </div>

              {/* Verdict */}
              <span className="text-[10px] font-mono text-[var(--ink-dim)] hidden sm:block flex-shrink-0">
                {verdictOf(deal)}
              </span>

              {/* Key metric */}
              <span className="text-sm font-mono font-bold text-[var(--ink)] flex-shrink-0 hidden md:block">
                {keyMetric(deal)}
              </span>

              {/* Status dropdown */}
              <select
                value={deal.status}
                onChange={e => updateStatus(deal.id, e.target.value as DealStatus)}
                className={`bg-transparent border rounded px-2 py-1 text-[10px] font-mono font-bold outline-none flex-shrink-0 ${STATUS_STYLE[deal.status]}`}>
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s} className="bg-[var(--panel)] text-[var(--ink)]">{STATUS_LABEL[s]}</option>
                ))}
              </select>

              {/* Date */}
              <span className="text-[10px] font-mono text-[var(--ink-faint)] flex-shrink-0 hidden lg:block">
                {new Date(deal.createdAt).toLocaleDateString()}
              </span>

              {/* Delete */}
              <button onClick={() => deleteDeal(deal.id)}
                className="text-[var(--ink-faint)] hover:text-[var(--bad)] transition-colors text-xs flex-shrink-0">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
