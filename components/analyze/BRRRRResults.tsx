"use client";

import { useState } from "react";
import type { BRRRRResult, BRRRRInputs, NNNInputs } from "@/types/deal";
import type { DCFResult } from "@/lib/calculations/dcf";
import { DCFTable } from "./DCFTable";
import { SensitivityMatrix } from "./SensitivityMatrix";
import { OfferBacksolve } from "./OfferBacksolve";
import { AIAnalysis } from "./AIAnalysis";

const $ = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n: number) => (n * 100).toFixed(1) + "%";
const x = (n: number) => n.toFixed(2) + "x";

const VERDICT_STYLE: Record<string, string> = {
  "BUY / STRONG":       "bg-[var(--accent)] text-[var(--bg)]",
  "BUY / CONDITIONAL":  "bg-[var(--warn)] text-[var(--bg)]",
  "MARGINAL":           "border border-[var(--warn)] text-[var(--warn)]",
  "PASS / REWORK":      "border border-[var(--bad)] text-[var(--bad)]",
  "HARD PASS":          "bg-[var(--bad)] text-white",
};

function Metric({ label, value, good }: { label: string; value: string; good?: boolean | null }) {
  return (
    <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3 flex flex-col gap-1">
      <span className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-widest">{label}</span>
      <span className={`text-lg font-mono font-bold ${
        good === true ? "text-[var(--accent)]" : good === false ? "text-[var(--bad)]" : "text-[var(--ink)]"
      }`}>{value}</span>
    </div>
  );
}

function Row({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 border-b border-[var(--line)] last:border-0 ${dim ? "opacity-60" : ""}`}>
      <span className="text-xs font-mono text-[var(--ink-dim)]">{label}</span>
      <span className="text-xs font-mono text-[var(--ink)] font-medium">{value}</span>
    </div>
  );
}

const TABS = ["Results", "Sensitivity", "Backsolve", "AI Memo"] as const;
type Tab = typeof TABS[number];

export function BRRRRResults({ result: r, dcf, inputs, dealName, address, nnnInputs }: {
  result: BRRRRResult; dcf: DCFResult; inputs: BRRRRInputs;
  dealName?: string; address?: string; nnnInputs: NNNInputs;
}) {
  const [tab, setTab] = useState<Tab>("Results");
  const cashRecaptured = r.totalInvested > 0 ? (r.cashBackAtRefi / r.totalInvested) * 100 : 0;

  return (
    <div className="flex flex-col">
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-[var(--line)] bg-[var(--panel)] flex-shrink-0">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-[10px] font-mono font-bold transition-colors border-b-2 ${
              tab === t
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--ink-faint)] hover:text-[var(--ink-dim)]"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Results" && (
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded font-mono font-bold text-sm tracking-widest ${VERDICT_STYLE[r.verdict] ?? ""}`}>
              {r.verdict}
            </span>
            <span className="text-xs font-mono text-[var(--ink-faint)]">
              ARV ratio {(r.arvRatio * 100).toFixed(0)}% · GRM {r.grm.toFixed(1)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Metric label="Cash-on-Cash" value={pct(r.cocReturn)} good={r.cocReturn >= 0.08} />
            <Metric label="Monthly Cash Flow" value={$(r.cashflowMonthly)} good={r.cashflowMonthly >= 200} />
            <Metric label="DSCR" value={r.dscr.toFixed(2)} good={r.dscr >= 1.25} />
            <Metric label="Cap Rate" value={pct(r.capRate)} good={r.capRate >= 0.06} />
          </div>

          <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
            <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">BRRRR Waterfall</p>
            <Row label="Total Invested (all-in)" value={$(r.totalInvested)} />
            <Row label="Refi Loan (cash out)" value={$(r.refiLoan)} />
            <Row label="Cash Back at Refi" value={$(r.cashBackAtRefi)} />
            <Row label="Cash Recaptured" value={cashRecaptured.toFixed(0) + "%"} />
            <Row label="Equity Left in Deal" value={$(r.equityLeftInDeal)} />
            <Row label="Equity Created (ARV − basis)" value={$(r.equityCreated)} />
          </div>

          <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
            <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">Operating (Annual)</p>
            <Row label="Gross Rent" value={$(r.grossRent * 12)} />
            <Row label="Effective Rent" value={$(r.effectiveRent * 12)} />
            <Row label="Operating Expenses" value={$(r.opex * 12)} dim />
            <Row label="NOI" value={$(r.noiAnnual)} />
            <Row label="Debt Service" value={$(-r.debtService * 12)} dim />
            <Row label="Net Cash Flow" value={$(r.cashflowAnnual)} />
          </div>

          <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
            <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">
              {inputs.holdPeriod}-Year DCF
            </p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <p className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-wider">IRR</p>
                <p className="text-base font-mono font-bold text-[var(--accent)]">{pct(dcf.irr)}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-wider">Equity Multiple</p>
                <p className="text-base font-mono font-bold text-[var(--ink)]">{x(dcf.equityMultiple)}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-wider">Exit Value</p>
                <p className="text-base font-mono font-bold text-[var(--ink)]">{$(dcf.exitValue)}</p>
              </div>
            </div>
            <DCFTable rows={dcf.rows} />
          </div>
        </div>
      )}

      {tab === "Sensitivity" && (
        <SensitivityMatrix mode="brrrr" brrrrInputs={inputs} nnnInputs={nnnInputs} />
      )}

      {tab === "Backsolve" && (
        <OfferBacksolve mode="brrrr" brrrrInputs={inputs} nnnInputs={nnnInputs} />
      )}

      {tab === "AI Memo" && (
        <AIAnalysis mode="brrrr" dealName={dealName ?? ""} address={address ?? ""} inputs={inputs} result={r} />
      )}
    </div>
  );
}
