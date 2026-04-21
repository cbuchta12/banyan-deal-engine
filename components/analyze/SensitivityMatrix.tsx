"use client";

import { useMemo } from "react";
import { calcBRRRR } from "@/lib/calculations/brrrr";
import { calcNNN } from "@/lib/calculations/nnn";
import type { BRRRRInputs, NNNInputs } from "@/types/deal";

const STEPS = [-0.20, -0.10, 0, 0.10, 0.20];
const STEP_LABELS = ["-20%", "-10%", "Base", "+10%", "+20%"];

function cellColor(value: number, thresholds: [number, number, number]): string {
  const [good, ok, bad] = thresholds;
  if (value >= good) return "bg-[var(--accent)] text-[var(--bg)]";
  if (value >= ok)   return "bg-[#4a6b1a] text-[var(--ink)]";
  if (value >= bad)  return "bg-[#5a4a10] text-[var(--warn)]";
  return "bg-[#3a1010] text-[var(--bad)]";
}

export function SensitivityMatrix({ mode, brrrrInputs, nnnInputs }: {
  mode: "brrrr" | "nnn";
  brrrrInputs: BRRRRInputs;
  nnnInputs: NNNInputs;
}) {
  const grid = useMemo(() => {
    if (mode === "brrrr") {
      return STEPS.map(rowStep =>
        STEPS.map(colStep => {
          const i = {
            ...brrrrInputs,
            purchase: brrrrInputs.purchase * (1 + colStep),
            rent: brrrrInputs.rent * (1 + rowStep),
          };
          const r = calcBRRRR(i);
          // equityLeftInDeal <= 0 with negative CF → not meaningful (N/M)
          if (r.equityLeftInDeal <= 0 && r.cashflowMonthly <= 0) return NaN;
          return r.cocReturn * 100; // may be Infinity when equity <= 0 but CF > 0
        })
      );
    } else {
      return STEPS.map(rowStep =>
        STEPS.map(colStep => {
          const i = {
            ...nnnInputs,
            price: nnnInputs.price * (1 + colStep),
            rentPerSf: nnnInputs.rentPerSf * (1 + rowStep),
          };
          return calcNNN(i).goingInCapRate * 100;
        })
      );
    }
  }, [mode, brrrrInputs, nnnInputs]);

  const thresholds: [number, number, number] = mode === "brrrr" ? [10, 7, 4] : [7.5, 6.5, 5.5];
  const xLabel = mode === "brrrr" ? "Purchase Price" : "Purchase Price";
  const yLabel = mode === "brrrr" ? "Rent" : "Rent / SF";
  const metricLabel = mode === "brrrr" ? "CoC Return" : "Cap Rate";

  return (
    <div className="p-4">
      <div className="mb-3">
        <p className="text-xs font-mono font-bold text-[var(--ink)] mb-0.5">{metricLabel} Sensitivity</p>
        <p className="text-[10px] font-mono text-[var(--ink-faint)]">
          Rows: {yLabel} ±20% · Cols: {xLabel} ±20%
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="text-[10px] font-mono border-collapse">
          <thead>
            <tr>
              <th className="text-[var(--ink-faint)] text-right pr-3 pb-1 font-normal">{yLabel} ↓ / {xLabel} →</th>
              {STEP_LABELS.map(l => (
                <th key={l} className="text-center px-1 pb-1 text-[var(--ink-dim)] font-normal w-14">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, ri) => (
              <tr key={ri}>
                <td className="text-right pr-3 py-0.5 text-[var(--ink-dim)]">{STEP_LABELS[ri]}</td>
                {row.map((val, ci) => {
                  const display = isNaN(val) ? "N/M" : !isFinite(val) ? "∞" : val.toFixed(1) + "%";
                  const colorVal = isNaN(val) || !isFinite(val) ? (isNaN(val) ? -1 : 999) : val;
                  return (
                    <td key={ci} className={`text-center px-1 py-1 rounded text-[10px] font-bold mx-0.5 ${cellColor(colorVal, thresholds)} ${ri === 2 && ci === 2 ? "ring-1 ring-white/30" : ""}`}>
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 mt-3 text-[9px] font-mono text-[var(--ink-faint)]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[var(--accent)]" />≥{thresholds[0]}%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#4a6b1a]" />≥{thresholds[1]}%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#5a4a10]" />≥{thresholds[2]}%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#3a1010]" />&lt;{thresholds[2]}%</span>
        <span className="ml-2 text-[var(--line-2)]">■ = base case</span>
      </div>
    </div>
  );
}
