"use client";

import type { NNNResult, NNNInputs } from "@/types/deal";
import type { DCFResult } from "@/lib/calculations/dcf";
import { DCFTable } from "./DCFTable";

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

export function NNNResults({ result: r, dcf, inputs }: {
  result: NNNResult; dcf: DCFResult; inputs: NNNInputs;
}) {
  const strengthLabel = STRENGTH_LABELS[Math.min(r.leaseStrength, 8)] ?? "—";

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Verdict */}
      <div className="flex items-center gap-3">
        <span className={`px-4 py-1.5 rounded font-mono font-bold text-sm tracking-widest ${VERDICT_STYLE[r.verdict] ?? ""}`}>
          {r.verdict}
        </span>
        <span className="text-xs font-mono text-[var(--ink-faint)]">
          Lease strength {r.leaseStrength}/9 · {strengthLabel}
        </span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2">
        <Metric label="Going-In Cap Rate" value={pct(r.goingInCapRate)} good={r.goingInCapRate >= 0.075} />
        <Metric label="Monthly Cash Flow" value={$(r.cashflowMonthly)} good={r.cashflowMonthly > 0} />
        <Metric label="DSCR" value={r.dscr.toFixed(2)} good={r.dscr >= 1.30} />
        <Metric label="Price / SF" value={"$" + r.pricePerSf.toFixed(0)} />
      </div>

      {/* Income / expense */}
      <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
        <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">Income & Expenses (Annual)</p>
        <Row label="Base Rent" value={$(r.baseRentAnnual)} />
        <Row label="Vacancy Loss" value={$(-r.baseRentAnnual * inputs.vacancy / 100)} dim />
        <Row label="Landlord Expenses" value={$(-r.landlordExpenses)} dim />
        <Row label="NOI" value={$(r.noiAnnual)} />
        <Row label="Debt Service" value={$(-r.debtServiceAnnual)} dim />
        <Row label="Net Cash Flow" value={$(r.cashflowAnnual)} />
      </div>

      {/* Debt / equity */}
      <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
        <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">Capital Structure</p>
        <Row label="Purchase Price" value={$(inputs.price)} />
        <Row label="Loan Amount" value={$(r.loan)} />
        <Row label="Equity (inc. closing)" value={$(r.equity)} />
        <Row label="Cash-on-Cash Return" value={pct(r.cocReturn)} />
      </div>

      {/* Exit */}
      <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
        <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">Exit Analysis</p>
        <Row label={`Exit Cap Rate (Yr ${inputs.loanTerm})`} value={inputs.exitCapRate + "%"} dim />
        <Row label="Projected Exit Value" value={$(r.exitValue)} />
        <Row label="Appreciation" value={$(r.appreciation)} />
      </div>

      {/* DCF */}
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
  );
}
