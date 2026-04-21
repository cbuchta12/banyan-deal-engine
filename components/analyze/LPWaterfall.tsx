"use client";

import { useState, useMemo } from "react";
import { calcWaterfall } from "@/lib/calculations/waterfall";
import type { DCFResult } from "@/lib/calculations/dcf";

const $ = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n: number) => (n * 100).toFixed(1) + "%";
const x = (n: number) => n.toFixed(2) + "x";

function Num({ label, value, onChange, suffix, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; suffix?: string; step?: number;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-widest">{label}</label>
      <div className="flex items-center bg-[var(--bg)] border border-[var(--line)] rounded focus-within:border-[var(--accent)] transition-colors">
        <input type="number" value={value} step={step} min={0}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="flex-1 bg-transparent px-2 py-1.5 text-sm font-mono text-[var(--ink)] outline-none min-w-0" />
        {suffix && <span className="pr-2 text-xs font-mono text-[var(--ink-faint)]">{suffix}</span>}
      </div>
    </div>
  );
}

export function LPWaterfall({ equity, dcf }: { equity: number; dcf: DCFResult }) {
  const [lpPct, setLpPct] = useState(80);
  const [prefReturn, setPrefReturn] = useState(8);
  const [promote, setPromote] = useState(20);

  const result = useMemo(() =>
    calcWaterfall({ lpPct, prefReturn, promote, totalEquity: equity, rows: dcf.rows, exitEquity: dcf.exitEquity }),
    [lpPct, prefReturn, promote, equity, dcf]
  );

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <p className="text-xs font-mono font-bold text-[var(--ink)] mb-0.5">LP Waterfall</p>
        <p className="text-[10px] font-mono text-[var(--ink-faint)]">Preferred return + GP promote structure</p>
      </div>

      {/* Structure inputs */}
      <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
        <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">Structure</p>
        <div className="grid grid-cols-3 gap-2">
          <Num label="LP Equity %" value={lpPct} onChange={setLpPct} suffix="%" />
          <Num label="Pref Return" value={prefReturn} onChange={setPrefReturn} suffix="%" step={0.5} />
          <Num label="GP Promote" value={promote} onChange={setPromote} suffix="%" />
        </div>
        <div className="mt-2 text-[10px] font-mono text-[var(--ink-faint)]">
          LP: {$(result.lpEquity)} · GP: {$(result.gpEquity)} · Total: {$(equity)}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
          <p className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-widest mb-1">LP Returns</p>
          <p className="text-lg font-mono font-bold text-[var(--accent)]">{pct(result.lpIRR)}</p>
          <p className="text-[10px] font-mono text-[var(--ink-dim)]">IRR</p>
          <div className="mt-2 flex justify-between text-[10px] font-mono">
            <span className="text-[var(--ink-faint)]">Equity Multiple</span>
            <span className="text-[var(--ink)]">{x(result.lpEquityMultiple)}</span>
          </div>
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-[var(--ink-faint)]">Total Return</span>
            <span className="text-[var(--ink)]">{$(result.totalLPReturn)}</span>
          </div>
        </div>
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
          <p className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-widest mb-1">GP Returns</p>
          <p className="text-lg font-mono font-bold text-[var(--warn)]">{pct(result.gpIRR)}</p>
          <p className="text-[10px] font-mono text-[var(--ink-dim)]">IRR</p>
          <div className="mt-2 flex justify-between text-[10px] font-mono">
            <span className="text-[var(--ink-faint)]">Equity Multiple</span>
            <span className="text-[var(--ink)]">{x(result.gpEquityMultiple)}</span>
          </div>
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-[var(--ink-faint)]">Total Return (Promote)</span>
            <span className="text-[var(--ink)]">{$(result.totalGPReturn)}</span>
          </div>
        </div>
      </div>

      {/* Waterfall table */}
      <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
        <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">Year-by-Year Distributions</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="text-[var(--ink-faint)] border-b border-[var(--line)]">
                <th className="text-left py-1 pr-2">Yr</th>
                <th className="text-right py-1 pr-2">Cash Flow</th>
                <th className="text-right py-1 pr-2">LP Pref</th>
                <th className="text-right py-1 pr-2">LP Above</th>
                <th className="text-right py-1 pr-2">GP Promote</th>
                <th className="text-right py-1 pr-2 text-[var(--accent)]">LP Total</th>
                <th className="text-right py-1 text-[var(--warn)]">GP Total</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map(r => (
                <tr key={r.year} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--panel-2)]">
                  <td className="py-1 pr-2 text-[var(--ink-faint)]">{r.year}</td>
                  <td className="py-1 pr-2 text-right text-[var(--ink-dim)]">{$(r.cashFlow)}</td>
                  <td className="py-1 pr-2 text-right text-[var(--ink-dim)]">{$(r.lpPref)}</td>
                  <td className="py-1 pr-2 text-right text-[var(--ink-dim)]">{$(r.lpAbovePref)}</td>
                  <td className="py-1 pr-2 text-right text-[var(--warn)]">{$(r.gpPromote)}</td>
                  <td className="py-1 pr-2 text-right font-bold text-[var(--accent)]">{$(r.lpTotal)}</td>
                  <td className="py-1 text-right font-bold text-[var(--warn)]">{$(r.gpTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {result.rows.some(r => r.accrued > 0) && (
          <p className="text-[9px] font-mono text-[var(--warn)] mt-2">
            ⚠ Accrued unpaid preferred return in some periods — cash flow insufficient to cover full pref.
          </p>
        )}
      </div>
    </div>
  );
}
