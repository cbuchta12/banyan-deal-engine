"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { LocalDeal } from "@/types/deal";

const $ = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n: number) => (n * 100).toFixed(2) + "%";
const x = (n: number) => n.toFixed(2) + "x";

function metricRows(d: LocalDeal): Array<{ label: string; raw: number; fmt: string }> {
  const r = d.result as any;
  if (d.mode === "brrrr") {
    return [
      { label: "Cash-on-Cash",       raw: r.cocReturn,       fmt: pct(r.cocReturn) },
      { label: "Monthly Cash Flow",  raw: r.cashflowMonthly, fmt: $(r.cashflowMonthly) },
      { label: "DSCR",               raw: r.dscr,            fmt: r.dscr.toFixed(2) },
      { label: "Cap Rate",           raw: r.capRate,         fmt: pct(r.capRate) },
      { label: "ARV Ratio",          raw: r.arvRatio,        fmt: pct(r.arvRatio) },
      { label: "NOI (Annual)",       raw: r.noiAnnual,       fmt: $(r.noiAnnual) },
      { label: "Cash Back at Refi",  raw: r.cashBackAtRefi,  fmt: $(r.cashBackAtRefi) },
      { label: "Equity Left",        raw: r.equityLeftInDeal,fmt: $(r.equityLeftInDeal) },
      { label: "Equity Created",     raw: r.equityCreated,   fmt: $(r.equityCreated) },
      { label: "GRM",                raw: r.grm,             fmt: r.grm.toFixed(1) },
    ];
  }
  return [
    { label: "Going-In Cap Rate",  raw: r.goingInCapRate,    fmt: pct(r.goingInCapRate) },
    { label: "Monthly Cash Flow",  raw: r.cashflowMonthly,   fmt: $(r.cashflowMonthly) },
    { label: "DSCR",               raw: r.dscr,              fmt: r.dscr.toFixed(2) },
    { label: "NOI (Annual)",       raw: r.noiAnnual,         fmt: $(r.noiAnnual) },
    { label: "Cash-on-Cash",       raw: r.cocReturn,         fmt: pct(r.cocReturn) },
    { label: "Price / SF",         raw: r.pricePerSf,        fmt: "$" + r.pricePerSf.toFixed(0) },
    { label: "Equity",             raw: r.equity,            fmt: $(r.equity) },
    { label: "Exit Value",         raw: r.exitValue,         fmt: $(r.exitValue) },
    { label: "Appreciation",       raw: r.appreciation,      fmt: $(r.appreciation) },
    { label: "Lease Strength",     raw: r.leaseStrength,     fmt: r.leaseStrength + "/9" },
  ];
}

function getMetricLabels(a: LocalDeal, b: LocalDeal): string[] {
  const setA = new Set(metricRows(a).map(m => m.label));
  const setB = new Set(metricRows(b).map(m => m.label));
  const union = [...new Set([...setA, ...setB])];
  return union;
}

function getMetric(d: LocalDeal, label: string): { raw: number; fmt: string } | null {
  return metricRows(d).find(m => m.label === label) ?? null;
}

function CompareContent() {
  const params = useSearchParams();
  const [deals, setDeals] = useState<LocalDeal[]>([]);
  const [dealA, setDealA] = useState<LocalDeal | null>(null);
  const [dealB, setDealB] = useState<LocalDeal | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("banyan_deals");
    if (!raw) return;
    try {
      const parsed: LocalDeal[] = JSON.parse(raw);
      setDeals(parsed);
      const idA = params.get("a");
      const idB = params.get("b");
      if (idA) setDealA(parsed.find(d => d.id === idA) ?? null);
      if (idB) setDealB(parsed.find(d => d.id === idB) ?? null);
    } catch {}
  }, [params]);

  const labels = dealA && dealB ? getMetricLabels(dealA, dealB) : [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold font-mono text-[var(--ink)]">Compare Deals</h1>
          <p className="text-xs font-mono text-[var(--ink-faint)] mt-0.5">Side-by-side metric comparison</p>
        </div>
        <Link href="/deals" className="text-xs font-mono text-[var(--ink-faint)] hover:text-[var(--accent)] transition-colors">
          ← Pipeline
        </Link>
      </div>

      {/* Deal selectors */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {(["a", "b"] as const).map((slot, i) => {
          const current = slot === "a" ? dealA : dealB;
          return (
            <div key={slot} className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
              <p className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-widest mb-2">
                Deal {slot.toUpperCase()}
              </p>
              <select
                value={current?.id ?? ""}
                onChange={e => {
                  const found = deals.find(d => d.id === e.target.value) ?? null;
                  if (slot === "a") setDealA(found);
                  else setDealB(found);
                }}
                className="w-full bg-[var(--bg)] border border-[var(--line)] rounded px-2 py-1.5 text-xs font-mono text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              >
                <option value="">— Select deal —</option>
                {deals.map(d => (
                  <option key={d.id} value={d.id}>{d.name || "Untitled"} ({d.mode.toUpperCase()})</option>
                ))}
              </select>
              {current && (
                <div className="mt-2 flex gap-2 items-center">
                  <span className="text-[9px] font-mono text-[var(--accent)] border border-[var(--accent-dim)] rounded px-1.5 py-0.5">
                    {current.mode.toUpperCase()}
                  </span>
                  <span className="text-[9px] font-mono text-[var(--ink-faint)] truncate">{current.address}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      {dealA && dealB ? (
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded overflow-hidden">
          <div className="grid grid-cols-3 border-b border-[var(--line)] bg-[var(--bg)]">
            <div className="p-3 text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-widest">Metric</div>
            <div className="p-3 text-[9px] font-mono text-[var(--accent)] uppercase tracking-widest border-l border-[var(--line)] truncate">
              {dealA.name || "Deal A"}
            </div>
            <div className="p-3 text-[9px] font-mono text-[var(--warn)] uppercase tracking-widest border-l border-[var(--line)] truncate">
              {dealB.name || "Deal B"}
            </div>
          </div>

          {/* Verdict row */}
          <div className="grid grid-cols-3 border-b border-[var(--line)] hover:bg-[var(--panel-2)]">
            <div className="p-3 text-xs font-mono text-[var(--ink-dim)]">Verdict</div>
            <div className="p-3 text-xs font-mono font-bold text-[var(--accent)] border-l border-[var(--line)]">
              {(dealA.result as any)?.verdict ?? "—"}
            </div>
            <div className="p-3 text-xs font-mono font-bold text-[var(--warn)] border-l border-[var(--line)]">
              {(dealB.result as any)?.verdict ?? "—"}
            </div>
          </div>

          {labels.map(label => {
            const mA = getMetric(dealA, label);
            const mB = getMetric(dealB, label);
            const aWins = mA && mB && mA.raw > mB.raw;
            const bWins = mA && mB && mB.raw > mA.raw;
            return (
              <div key={label} className="grid grid-cols-3 border-b border-[var(--line)] last:border-0 hover:bg-[var(--panel-2)]">
                <div className="p-3 text-xs font-mono text-[var(--ink-dim)]">{label}</div>
                <div className={`p-3 text-xs font-mono border-l border-[var(--line)] ${aWins ? "font-bold text-[var(--accent)]" : "text-[var(--ink)]"}`}>
                  {mA?.fmt ?? "—"}
                  {aWins && <span className="ml-1 text-[9px] text-[var(--accent)]">▲</span>}
                </div>
                <div className={`p-3 text-xs font-mono border-l border-[var(--line)] ${bWins ? "font-bold text-[var(--warn)]" : "text-[var(--ink)]"}`}>
                  {mB?.fmt ?? "—"}
                  {bWins && <span className="ml-1 text-[9px] text-[var(--warn)]">▲</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-[var(--line)] rounded p-12 text-center">
          <p className="text-xs font-mono text-[var(--ink-faint)]">Select two deals above to compare.</p>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense>
      <CompareContent />
    </Suspense>
  );
}
