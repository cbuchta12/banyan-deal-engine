"use client";

import { useState, useMemo } from "react";
import { backsolveBRRRR, backsolveNNN } from "@/lib/calculations/backsolve";
import type { BRRRRInputs, NNNInputs } from "@/types/deal";

const $ = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function TargetField({ label, value, onChange, suffix }: {
  label: string; value: number; onChange: (v: number) => void; suffix: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-mono text-[var(--ink-dim)] w-36 flex-shrink-0">{label}</label>
      <div className="flex items-center bg-[var(--bg)] border border-[var(--line)] rounded focus-within:border-[var(--accent)] transition-colors">
        <input
          type="number" value={value} step={0.25} min={0}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-20 bg-transparent px-2 py-1.5 text-sm font-mono text-[var(--ink)] outline-none"
        />
        <span className="pr-2 text-xs font-mono text-[var(--ink-faint)]">{suffix}</span>
      </div>
    </div>
  );
}

function Result({ label, value, current }: {
  label: string; value: number; current: number;
}) {
  if (value === Infinity) {
    return (
      <div className="flex items-center justify-between py-2 border-b border-[var(--line)] last:border-0">
        <span className="text-xs font-mono text-[var(--ink-dim)]">{label}</span>
        <span className="text-sm font-mono font-bold text-[var(--accent)]">Currently met ✓</span>
      </div>
    );
  }
  if (value === 0) {
    return (
      <div className="flex items-center justify-between py-2 border-b border-[var(--line)] last:border-0">
        <span className="text-xs font-mono text-[var(--ink-dim)]">{label}</span>
        <span className="text-sm font-mono font-bold text-[var(--bad)]">N/A — not achievable</span>
      </div>
    );
  }
  const delta = value - current;
  const pct = current > 0 ? (delta / current) * 100 : 0;
  const good = delta <= 0;
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--line)] last:border-0">
      <span className="text-xs font-mono text-[var(--ink-dim)]">{label}</span>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-mono font-bold ${good ? "text-[var(--accent)]" : "text-[var(--bad)]"}`}>
          {$(value)}
        </span>
        <span className={`text-[10px] font-mono ${good ? "text-[var(--ink-faint)]" : "text-[var(--bad)]"}`}>
          {delta >= 0 ? "+" : ""}{pct.toFixed(0)}% vs ask
        </span>
      </div>
    </div>
  );
}

export function OfferBacksolve({ mode, brrrrInputs, nnnInputs }: {
  mode: "brrrr" | "nnn";
  brrrrInputs: BRRRRInputs;
  nnnInputs: NNNInputs;
}) {
  const [cocTarget, setCocTarget] = useState(mode === "brrrr" ? 10 : 8);
  const [dscrTarget, setDscrTarget] = useState(1.25);
  const [cfTarget, setCfTarget] = useState(200);

  const bResult = useMemo(() => {
    if (mode !== "brrrr") return null;
    return backsolveBRRRR(brrrrInputs, {
      targetCoC: cocTarget,
      targetDSCR: dscrTarget,
      targetMonthlyCF: cfTarget,
    });
  }, [mode, brrrrInputs, cocTarget, dscrTarget, cfTarget]);

  const nResult = useMemo(() => {
    if (mode !== "nnn") return null;
    return backsolveNNN(nnnInputs, {
      targetCapRate: cocTarget,
      targetCoC: dscrTarget,
      targetDSCR: cfTarget / 100,
    });
  }, [mode, nnnInputs, cocTarget, dscrTarget, cfTarget]);

  if (mode === "brrrr" && bResult) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <div>
          <p className="text-xs font-mono font-bold text-[var(--ink)] mb-0.5">Offer Backsolve</p>
          <p className="text-[10px] font-mono text-[var(--ink-faint)]">What's the max purchase price to hit your targets?</p>
        </div>

        <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3 flex flex-col gap-2">
          <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-1">Targets</p>
          <TargetField label="Min Cash-on-Cash" value={cocTarget} onChange={setCocTarget} suffix="%" />
          <TargetField label="Min DSCR" value={dscrTarget} onChange={setDscrTarget} suffix="x" />
          <TargetField label="Min Monthly CF" value={cfTarget} onChange={setCfTarget} suffix="$/mo" />
        </div>

        <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
          <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">Max Purchase Price</p>
          <p className="text-[10px] font-mono text-[var(--ink-faint)] mb-2">Current ask: {$(brrrrInputs.purchase)}</p>
          <Result label={`To hit ≥${cocTarget}% CoC`} value={bResult.maxPriceForCoC} current={brrrrInputs.purchase} />
          <Result label={`To hit ≥${dscrTarget}x DSCR`} value={bResult.maxPriceForDSCR} current={brrrrInputs.purchase} />
          <Result label={`To hit ≥$${cfTarget}/mo CF`} value={bResult.maxPriceForCF} current={brrrrInputs.purchase} />
        </div>

        <div className="bg-[var(--panel-2)] border border-[var(--line)] rounded p-3">
          <p className="text-[10px] font-mono text-[var(--ink-faint)]">
            <span className="text-[var(--accent)] font-bold">Binding constraint: </span>
            {(() => {
              const finite = [bResult.maxPriceForCoC, bResult.maxPriceForDSCR, bResult.maxPriceForCF].filter(v => isFinite(v) && v > 0);
              if (finite.length === 0) return "No target achievable at any purchase price — check rent / expenses / rate.";
              return $(Math.min(...finite)) + " — most restrictive of your targets.";
            })()}
          </p>
          <p className="text-[9px] font-mono text-[var(--ink-faint)] mt-1">
            * In BRRRR, DSCR and monthly CF are determined by rent, expenses, and refi terms — not purchase price.
          </p>
        </div>
      </div>
    );
  }

  if (mode === "nnn" && nResult) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <div>
          <p className="text-xs font-mono font-bold text-[var(--ink)] mb-0.5">Offer Backsolve</p>
          <p className="text-[10px] font-mono text-[var(--ink-faint)]">What's the max purchase price to hit your targets?</p>
        </div>

        <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3 flex flex-col gap-2">
          <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-1">Targets</p>
          <TargetField label="Min Cap Rate" value={cocTarget} onChange={setCocTarget} suffix="%" />
          <TargetField label="Min CoC Return" value={dscrTarget} onChange={setDscrTarget} suffix="%" />
          <TargetField label="Min DSCR" value={cfTarget / 100} onChange={v => setCfTarget(v * 100)} suffix="x" />
        </div>

        <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
          <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">Max Purchase Price</p>
          <p className="text-[10px] font-mono text-[var(--ink-faint)] mb-2">Current ask: {$(nnnInputs.price)}</p>
          <Result label={`To hit ≥${cocTarget}% cap`} value={nResult.maxPriceForCapRate} current={nnnInputs.price} />
          <Result label={`To hit ≥${dscrTarget}% CoC`} value={nResult.maxPriceForCoC} current={nnnInputs.price} />
          <Result label={`To hit ≥${(cfTarget / 100).toFixed(2)}x DSCR`} value={nResult.maxPriceForDSCR} current={nnnInputs.price} />
        </div>

        <div className="bg-[var(--panel-2)] border border-[var(--line)] rounded p-3">
          <p className="text-[10px] font-mono text-[var(--ink-faint)]">
            <span className="text-[var(--accent)] font-bold">Binding constraint: </span>
            {$(Math.min(nResult.maxPriceForCapRate, nResult.maxPriceForCoC, nResult.maxPriceForDSCR))} — the most restrictive of your three targets.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
