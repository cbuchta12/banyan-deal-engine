"use client";

import { useState } from "react";
import type { NNNResult, NNNInputs, BRRRRInputs } from "@/types/deal";
import type { DCFResult } from "@/lib/calculations/dcf";
import { DCFTable } from "./DCFTable";
import { SensitivityMatrix } from "./SensitivityMatrix";
import { OfferBacksolve } from "./OfferBacksolve";
import { AIAnalysis } from "./AIAnalysis";
import { LPWaterfall } from "./LPWaterfall";

const $ = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n: number) => (n * 100).toFixed(2) + "%";
const x = (n: number) => n.toFixed(2) + "x";

const VERDICT_STYLE: Record<string, string> = {
  "ACQUIRE":            "bg-[var(--accent)] text-[var(--bg)]",
  "ACQUIRE / CLEAN UP": "bg-[var(--warn)] text-[var(--bg)]",
  "NEGOTIATE":          "border border-[var(--warn)] text-[var(--warn)]",
  "PASS / REWORK":      "border border-[var(--bad)] text-[var(--bad)]",
  "HARD PASS":          "bg-[var(--bad)] text-white",
};

const STRENGTH_LABELS = ["Weak", "Below Avg", "Average", "Strong", "Very Strong", "Excellent", "Elite", "Class A", "Fortress"];

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

const TABS = ["Results", "Sensitivity", "Backsolve", "LP Waterfall", "AI Memo"] as const;
type Tab = typeof TABS[number];

export function NNNResults({ result: r, dcf, inputs, dealName, address, brrrrInputs, notes, onNotesChange }: {
  result: NNNResult; dcf: DCFResult; inputs: NNNInputs;
  dealName?: string; address?: string; brrrrInputs: BRRRRInputs;
  notes?: string; onNotesChange?: (v: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("Results");
  const [notesOpen, setNotesOpen] = useState(false);
  const strengthLabel = STRENGTH_LABELS[Math.min(r.leaseStrength, 8)] ?? "—";

  return (
    <div className="flex flex-col relative">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-[var(--line)] bg-[var(--panel)] flex-shrink-0">
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
        <button onClick={() => setNotesOpen(o => !o)}
          className={`ml-auto mr-3 px-2 py-1 text-[10px] font-mono rounded transition-colors ${
            notesOpen ? "bg-[var(--accent)] text-[var(--bg)]" : "text-[var(--ink-faint)] hover:text-[var(--accent)]"
          }`}>
          📝 Notes{notes ? " ●" : ""}
        </button>
      </div>

      {tab === "Results" && (
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded font-mono font-bold text-sm tracking-widest ${VERDICT_STYLE[r.verdict] ?? ""}`}>
              {r.verdict}
            </span>
            <span className="text-xs font-mono text-[var(--ink-faint)]">
              Lease strength {r.leaseStrength}/9 · {strengthLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Metric label="Going-In Cap Rate" value={pct(r.goingInCapRate)} good={r.goingInCapRate >= 0.075} />
            <Metric label="Monthly Cash Flow" value={$(r.cashflowMonthly)} good={r.cashflowMonthly > 0} />
            <Metric label="DSCR" value={r.dscr.toFixed(2)} good={r.dscr >= 1.30} />
            <Metric label="Price / SF" value={"$" + r.pricePerSf.toFixed(0)} />
          </div>

          <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
            <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">Income & Expenses (Annual)</p>
            <Row label="Base Rent" value={$(r.baseRentAnnual)} />
            <Row label="Vacancy Loss" value={$(-r.baseRentAnnual * inputs.vacancy / 100)} dim />
            <Row label="Landlord Expenses" value={$(-r.landlordExpenses)} dim />
            <Row label="NOI" value={$(r.noiAnnual)} />
            <Row label="Debt Service" value={$(-r.debtServiceAnnual)} dim />
            <Row label="Net Cash Flow" value={$(r.cashflowAnnual)} />
          </div>

          <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
            <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">Capital Structure</p>
            <Row label="Purchase Price" value={$(inputs.price)} />
            <Row label="Loan Amount" value={$(r.loan)} />
            <Row label="Equity (inc. closing)" value={$(r.equity)} />
            <Row label="Cash-on-Cash Return" value={pct(r.cocReturn)} />
          </div>

          <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
            <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">Exit Analysis</p>
            <Row label={`Exit Cap Rate (Yr ${inputs.loanTerm})`} value={inputs.exitCapRate + "%"} dim />
            <Row label="Projected Exit Value" value={$(r.exitValue)} />
            <Row label="Appreciation" value={$(r.appreciation)} />
          </div>

          <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
            <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">
              {inputs.loanTerm}-Year DCF
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
                <p className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-wider">NPV @ 10%</p>
                <p className={`text-base font-mono font-bold ${dcf.npv10 >= 0 ? "text-[var(--accent)]" : "text-[var(--bad)]"}`}>
                  {$(dcf.npv10)}
                </p>
              </div>
            </div>
            <DCFTable rows={dcf.rows} />
          </div>
        </div>
      )}

      {tab === "Sensitivity" && (
        <SensitivityMatrix mode="nnn" brrrrInputs={brrrrInputs} nnnInputs={inputs} />
      )}

      {tab === "Backsolve" && (
        <OfferBacksolve mode="nnn" brrrrInputs={brrrrInputs} nnnInputs={inputs} />
      )}

      {tab === "LP Waterfall" && (
        <LPWaterfall equity={r.equity} dcf={dcf} />
      )}

      {tab === "AI Memo" && (
        <AIAnalysis mode="nnn" dealName={dealName ?? ""} address={address ?? ""} inputs={inputs} result={r} />
      )}

      {/* Notes slide panel */}
      {notesOpen && (
        <div className="absolute top-0 right-0 bottom-0 w-72 bg-[var(--panel)] border-l border-[var(--line)] flex flex-col z-10 shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--line)] flex-shrink-0">
            <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest">Deal Notes</p>
            <button onClick={() => setNotesOpen(false)} className="text-[var(--ink-faint)] hover:text-[var(--bad)] text-xs transition-colors">✕</button>
          </div>
          <textarea
            value={notes ?? ""}
            onChange={e => onNotesChange?.(e.target.value)}
            placeholder="Due diligence items, contacts, deal history…"
            className="flex-1 bg-transparent p-3 text-xs font-mono text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] resize-none"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
