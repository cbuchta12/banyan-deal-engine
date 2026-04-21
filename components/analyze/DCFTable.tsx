"use client";

import type { DCFRow } from "@/lib/calculations/dcf";

const $ = (n: number) => {
  const abs = Math.abs(n);
  const s = abs >= 1000000
    ? (abs / 1000000).toFixed(1) + "M"
    : abs >= 1000
    ? (abs / 1000).toFixed(0) + "k"
    : abs.toFixed(0);
  return (n < 0 ? "-$" : "$") + s;
};

export function DCFTable({ rows }: { rows: DCFRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px] font-mono">
        <thead>
          <tr className="text-[var(--ink-faint)] border-b border-[var(--line)]">
            <th className="text-left py-1 pr-2">Yr</th>
            <th className="text-right py-1 pr-2">Gross</th>
            <th className="text-right py-1 pr-2">NOI</th>
            <th className="text-right py-1 pr-2">Debt Svc</th>
            <th className="text-right py-1 pr-2">Cash Flow</th>
            <th className="text-right py-1">Cumulative</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.year} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--panel-2)]">
              <td className="py-1 pr-2 text-[var(--ink-faint)]">{r.year}</td>
              <td className="py-1 pr-2 text-right text-[var(--ink-dim)]">{$(r.grossIncome)}</td>
              <td className="py-1 pr-2 text-right text-[var(--ink)]">{$(r.noi)}</td>
              <td className="py-1 pr-2 text-right text-[var(--ink-faint)]">({$(r.debtService)})</td>
              <td className={`py-1 pr-2 text-right font-bold ${r.cashFlow >= 0 ? "text-[var(--accent)]" : "text-[var(--bad)]"}`}>
                {$(r.cashFlow)}
              </td>
              <td className={`py-1 text-right ${r.cumulative >= 0 ? "text-[var(--good)]" : "text-[var(--ink-dim)]"}`}>
                {$(r.cumulative)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
