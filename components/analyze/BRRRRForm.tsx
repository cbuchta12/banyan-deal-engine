"use client";

import type { BRRRRInputs } from "@/types/deal";

interface Props { inputs: BRRRRInputs; onChange: (i: BRRRRInputs) => void; }

function Field({ label, value, onChange, prefix, suffix, step = 1, min = 0 }: {
  label: string; value: number; onChange: (v: number) => void;
  prefix?: string; suffix?: string; step?: number; min?: number;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-widest">{label}</label>
      <div className="flex items-center bg-[var(--bg)] border border-[var(--line)] rounded focus-within:border-[var(--accent)] transition-colors">
        {prefix && <span className="pl-2 text-xs font-mono text-[var(--ink-faint)] select-none">{prefix}</span>}
        <input
          type="number" value={value} step={step} min={min}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="flex-1 bg-transparent px-2 py-1.5 text-sm font-mono text-[var(--ink)] outline-none min-w-0 w-full"
        />
        {suffix && <span className="pr-2 text-xs font-mono text-[var(--ink-faint)] select-none">{suffix}</span>}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-widest">{label}</label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="bg-[var(--bg)] border border-[var(--line)] rounded px-2 py-1.5 text-sm font-mono text-[var(--ink)] outline-none focus:border-[var(--accent)] transition-colors"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 pt-4 pb-2">
      <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-3 flex items-center gap-2">
        <span className="h-px flex-1 bg-[var(--line)]" />{title}<span className="h-px flex-1 bg-[var(--line)]" />
      </p>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

export function BRRRRForm({ inputs: i, onChange }: Props) {
  const set = (key: keyof BRRRRInputs) => (v: number | string) =>
    onChange({ ...i, [key]: typeof v === "string" ? v : v });
  const n = (key: keyof BRRRRInputs) => (v: number) => onChange({ ...i, [key]: v });

  return (
    <div className="pb-6">
      <Section title="Acquisition">
        <Field label="Purchase Price" value={i.purchase} onChange={n("purchase")} prefix="$" />
        <Field label="Rehab Budget" value={i.rehab} onChange={n("rehab")} prefix="$" />
        <Field label="Closing Costs" value={i.closingCosts} onChange={n("closingCosts")} prefix="$" />
        <Field label="Holding Costs" value={i.holdingCosts} onChange={n("holdingCosts")} prefix="$" />
        <div className="col-span-2">
          <Field label="After Repair Value (ARV)" value={i.arv} onChange={n("arv")} prefix="$" />
        </div>
      </Section>

      <Section title="Financing">
        <div className="col-span-2">
          <Select label="Loan Type" value={i.loanType} onChange={v => onChange({ ...i, loanType: v as BRRRRInputs["loanType"] })}
            options={[
              { value: "hard", label: "Hard Money" },
              { value: "conv", label: "Conventional (80%)" },
              { value: "dscr", label: "DSCR (75%)" },
              { value: "cash", label: "All Cash" },
            ]}
          />
        </div>
        <Field label="Initial Rate" value={i.initRate} onChange={n("initRate")} suffix="%" step={0.25} />
        <Field label="Refi LTV" value={i.refiLtv} onChange={n("refiLtv")} suffix="%" />
        <Field label="Refi Rate" value={i.refiRate} onChange={n("refiRate")} suffix="%" step={0.125} />
        <Field label="Amortization" value={i.amort} onChange={n("amort")} suffix="yr" />
        <div className="col-span-2">
          <Field label="Refi Closing Costs" value={i.refiClosingCosts} onChange={n("refiClosingCosts")} prefix="$" />
        </div>
      </Section>

      <Section title="Operating (Monthly)">
        <Field label="Gross Rent" value={i.rent} onChange={n("rent")} prefix="$" />
        <Field label="Vacancy" value={i.vacancy} onChange={n("vacancy")} suffix="%" />
        <Field label="Property Tax" value={i.tax} onChange={n("tax")} prefix="$" />
        <Field label="Insurance" value={i.insurance} onChange={n("insurance")} prefix="$" />
        <Field label="HOA" value={i.hoa} onChange={n("hoa")} prefix="$" />
        <Field label="Maintenance" value={i.maintenance} onChange={n("maintenance")} suffix="% rent" step={0.5} />
        <Field label="CapEx" value={i.capex} onChange={n("capex")} suffix="% rent" step={0.5} />
        <Field label="Management" value={i.management} onChange={n("management")} suffix="% rent" step={0.5} />
        <Field label="Utilities" value={i.utilities} onChange={n("utilities")} prefix="$" />
        <Field label="Other" value={i.other} onChange={n("other")} prefix="$" />
      </Section>

      <Section title="Exit / DCF">
        <Field label="Rent Growth" value={i.rentGrowth} onChange={n("rentGrowth")} suffix="% / yr" step={0.5} />
        <Field label="Exit Cap Rate" value={i.exitCapRate} onChange={n("exitCapRate")} suffix="%" step={0.25} />
        <div className="col-span-2">
          <Field label="Hold Period" value={i.holdPeriod} onChange={n("holdPeriod")} suffix="years" />
        </div>
      </Section>
    </div>
  );
}
