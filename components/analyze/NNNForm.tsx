"use client";

import type { NNNInputs } from "@/types/deal";

interface Props { inputs: NNNInputs; onChange: (i: NNNInputs) => void; }

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

export function NNNForm({ inputs: i, onChange }: Props) {
  const n = (key: keyof NNNInputs) => (v: number) => onChange({ ...i, [key]: v });

  return (
    <div className="pb-6">
      <Section title="Property">
        <div className="col-span-2">
          <Field label="Purchase Price" value={i.price} onChange={n("price")} prefix="$" />
        </div>
        <Field label="Building SF" value={i.sf} onChange={n("sf")} suffix="sf" />
        <Field label="Closing Costs" value={i.closingCosts} onChange={n("closingCosts")} prefix="$" />
        <div className="col-span-2">
          <Select label="Asset Class" value={i.assetClass} onChange={v => onChange({ ...i, assetClass: v as NNNInputs["assetClass"] })}
            options={[
              { value: "industrial", label: "Industrial" },
              { value: "flex", label: "Flex / R&D" },
              { value: "retail", label: "Retail / NNN" },
              { value: "office", label: "Office" },
            ]}
          />
        </div>
      </Section>

      <Section title="Lease">
        <Field label="Rent / SF / Yr" value={i.rentPerSf} onChange={n("rentPerSf")} prefix="$" step={0.25} />
        <Field label="Lease Term" value={i.leaseTerm} onChange={n("leaseTerm")} suffix="yr" />
        <Field label="Escalator" value={i.escalator} onChange={n("escalator")} suffix="% / yr" step={0.25} />
        <Select label="Lease Type" value={i.leaseType} onChange={v => onChange({ ...i, leaseType: v as NNNInputs["leaseType"] })}
          options={[
            { value: "nnn", label: "NNN (Triple Net)" },
            { value: "nn", label: "NN (Double Net)" },
            { value: "gross", label: "Gross" },
          ]}
        />
        <Select label="Tenant Credit" value={i.tenantCredit} onChange={v => onChange({ ...i, tenantCredit: v as NNNInputs["tenantCredit"] })}
          options={[
            { value: "ig", label: "Investment Grade" },
            { value: "strong", label: "Strong / Regional" },
            { value: "mid", label: "Mid-Market" },
            { value: "sub", label: "Sub / Local" },
          ]}
        />
        <Select label="Mission Critical" value={i.missionCritical} onChange={v => onChange({ ...i, missionCritical: v as NNNInputs["missionCritical"] })}
          options={[
            { value: "yes", label: "Yes" },
            { value: "partial", label: "Partial" },
            { value: "no", label: "No" },
          ]}
        />
      </Section>

      <Section title="Debt">
        <Field label="LTV" value={i.ltv} onChange={n("ltv")} suffix="%" />
        <Field label="Interest Rate" value={i.rate} onChange={n("rate")} suffix="%" step={0.125} />
        <Field label="Amortization" value={i.amort} onChange={n("amort")} suffix="yr" />
        <Field label="Loan Term" value={i.loanTerm} onChange={n("loanTerm")} suffix="yr" />
      </Section>

      <Section title="Expenses / Exit">
        <Field label="Management" value={i.managementPct} onChange={n("managementPct")} suffix="% EGI" step={0.5} />
        <Field label="Structural Reserve" value={i.structuralReservePerSf} onChange={n("structuralReservePerSf")} suffix="$/sf" step={0.05} />
        <Field label="Vacancy" value={i.vacancy} onChange={n("vacancy")} suffix="%" step={0.5} />
        <Field label="Exit Cap Rate" value={i.exitCapRate} onChange={n("exitCapRate")} suffix="%" step={0.25} />
      </Section>
    </div>
  );
}
