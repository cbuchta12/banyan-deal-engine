"use client";

import { useState } from "react";
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

const MODE_FILTER = ["all", "brrrr", "nnn"] as const;

function verdictOf(d: LocalDeal) { return (d.result as any)?.verdict ?? "—"; }

function keyMetric(d: LocalDeal): string {
  if (d.mode === "brrrr") {
    const cf = (d.result as any)?.cashflowMonthly ?? 0;
    const coc = (d.result as any)?.cocReturn ?? 0;
    return `${$(cf)}/mo · ${(coc * 100).toFixed(1)}% CoC`;
  }
  const cap = (d.result as any)?.goingInCapRate ?? 0;
  const cf = (d.result as any)?.cashflowMonthly ?? 0;
  return `${(cap * 100).toFixed(2)}% cap · ${$(cf)}/mo`;
}

function exportDeals(deals: LocalDeal[]) {
  const blob = new Blob([JSON.stringify(deals, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `banyan-deals-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DealsPage() {
  const { deals, loaded, updateStatus, deleteDeal } = useDeals();
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | "brrrr" | "nnn">("all");
  const [statusFilter, setStatusFilter] = useState<DealStatus | "all">("all");

  if (!loaded) return null;

  const filtered = deals.filter(d => {
    if (modeFilter !== "all" && d.mode !== modeFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.name.toLowerCase().includes(q) || d.address.toLowerCase().includes(q);
    }
    return true;
  });

  // Stats
  const active = deals.filter(d => !["pass", "dead", "closed"].includes(d.status));
  const closed = deals.filter(d => d.status === "closed");
  const brrrrCount = deals.filter(d => d.mode === "brrrr").length;
  const nnnCount = deals.filter(d => d.mode === "nnn").length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-[var(--ink)]">Pipeline</h1>
          <p className="text-xs text-[var(--ink-faint)] font-mono mt-0.5">{deals.length} total</p>
        </div>
        <div className="flex gap-2">
          {deals.length >= 2 && (
            <Link href="/deals/compare"
              className="px-3 py-2 text-xs font-mono font-bold border border-[var(--line)] text-[var(--ink-faint)] rounded hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
              Compare
            </Link>
          )}
          {deals.length > 0 && (
            <button onClick={() => exportDeals(deals)}
              className="px-3 py-2 text-xs font-mono font-bold border border-[var(--line)] text-[var(--ink-faint)] rounded hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
              Export JSON
            </button>
          )}
          <Link href="/"
            className="px-4 py-2 text-xs font-mono font-bold bg-[var(--accent)] text-[var(--bg)] rounded hover:opacity-90 transition-opacity">
            + New Analysis
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      {deals.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: "Active", value: active.length, color: "text-[var(--accent)]" },
            { label: "Closed", value: closed.length, color: "text-[var(--good)]" },
            { label: "BRRRR", value: brrrrCount, color: "text-[var(--info)]" },
            { label: "NNN", value: nnnCount, color: "text-[var(--warn)]" },
          ].map(s => (
            <div key={s.label} className="bg-[var(--panel)] border border-[var(--line)] rounded p-3 text-center">
              <p className={`text-xl font-mono font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {deals.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search deals…"
            className="bg-[var(--panel)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-[var(--ink)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--ink-faint)] w-48 transition-colors"
          />
          <div className="flex gap-1">
            {MODE_FILTER.map(m => (
              <button key={m} onClick={() => setModeFilter(m)}
                className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
                  modeFilter === m ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--line)] text-[var(--ink-faint)] hover:text-[var(--ink-dim)]"
                }`}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as DealStatus | "all")}
            className="bg-[var(--panel)] border border-[var(--line)] text-[var(--ink-dim)] text-xs font-mono rounded px-2 py-1.5 outline-none">
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          {(search || modeFilter !== "all" || statusFilter !== "all") && (
            <button onClick={() => { setSearch(""); setModeFilter("all"); setStatusFilter("all"); }}
              className="text-[10px] font-mono text-[var(--ink-faint)] hover:text-[var(--bad)] transition-colors">
              Clear filters
            </button>
          )}
        </div>
      )}

      {deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <p className="text-[var(--ink-dim)] font-mono text-sm">No deals saved yet.</p>
          <p className="text-[var(--ink-faint)] font-mono text-xs">Run an analysis and click Save.</p>
          <Link href="/" className="text-[var(--accent)] font-mono text-xs hover:underline mt-2">Start analyzing →</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xs font-mono text-[var(--ink-faint)]">No deals match your filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(deal => (
            <div key={deal.id}
              className="bg-[var(--panel)] border border-[var(--line)] rounded-lg p-3 flex items-center gap-3 hover:border-[var(--line-2)] transition-colors">
              <span className="text-[9px] font-mono font-bold text-[var(--accent)] bg-[var(--bg)] border border-[var(--accent-dim)] rounded px-2 py-1 flex-shrink-0">
                {deal.mode.toUpperCase()}
              </span>

              <div className="flex-1 min-w-0">
                <Link href={`/?deal=${deal.id}`}
                  className="text-sm font-mono font-bold text-[var(--ink)] hover:text-[var(--accent)] transition-colors truncate block">
                  {deal.name || "Untitled Deal"}
                </Link>
                {deal.address && (
                  <p className="text-[10px] font-mono text-[var(--ink-faint)] truncate">{deal.address}</p>
                )}
              </div>

              <span className="text-[10px] font-mono text-[var(--ink-dim)] hidden sm:block flex-shrink-0">{verdictOf(deal)}</span>
              <span className="text-xs font-mono text-[var(--ink)] flex-shrink-0 hidden md:block">{keyMetric(deal)}</span>

              <select
                value={deal.status}
                onChange={e => updateStatus(deal.id, e.target.value as DealStatus)}
                className={`bg-transparent border rounded px-2 py-1 text-[10px] font-mono font-bold outline-none flex-shrink-0 ${STATUS_STYLE[deal.status]}`}>
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s} className="bg-[var(--panel)] text-[var(--ink)]">{STATUS_LABEL[s]}</option>
                ))}
              </select>

              <span className="text-[10px] font-mono text-[var(--ink-faint)] flex-shrink-0 hidden lg:block">
                {new Date(deal.createdAt).toLocaleDateString()}
              </span>

              <button onClick={() => deleteDeal(deal.id)}
                className="text-[var(--ink-faint)] hover:text-[var(--bad)] transition-colors text-xs flex-shrink-0">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
