"use client";

import { useState } from "react";

export interface RentRollTenant {
  id: string;
  name: string;
  sf: number;
  rentPerSf: number;
  leaseStart: string;
  leaseEnd: string;
  leaseType: "nnn" | "nn" | "gross";
}

interface Props {
  tenants: RentRollTenant[];
  onChange: (tenants: RentRollTenant[]) => void;
  onApply: (totalSf: number, weightedRentPerSf: number) => void;
}

const BLANK: Omit<RentRollTenant, "id"> = {
  name: "", sf: 0, rentPerSf: 0, leaseStart: "", leaseEnd: "", leaseType: "nnn",
};

const $f = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function NNNRentRoll({ tenants, onChange, onApply }: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Omit<RentRollTenant, "id">>(BLANK);

  const totalSf = tenants.reduce((s, t) => s + t.sf, 0);
  const totalAnnualRent = tenants.reduce((s, t) => s + t.sf * t.rentPerSf, 0);
  const weightedRentPerSf = totalSf > 0 ? totalAnnualRent / totalSf : 0;

  function addTenant() {
    if (!draft.name || draft.sf <= 0) return;
    onChange([...tenants, { ...draft, id: crypto.randomUUID() }]);
    setDraft(BLANK);
    setAdding(false);
  }

  function remove(id: string) {
    onChange(tenants.filter(t => t.id !== id));
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-bold text-[var(--ink)]">Rent Roll</p>
          <p className="text-[10px] font-mono text-[var(--ink-faint)]">{tenants.length} tenant{tenants.length !== 1 ? "s" : ""} · {totalSf.toLocaleString()} SF total</p>
        </div>
        <div className="flex gap-2">
          {tenants.length > 0 && (
            <button onClick={() => onApply(totalSf, weightedRentPerSf)}
              className="px-3 py-1 text-[10px] font-mono font-bold bg-[var(--accent)] text-[var(--bg)] rounded hover:opacity-90 transition-opacity">
              Apply to Calculator
            </button>
          )}
          <button onClick={() => setAdding(true)}
            className="px-3 py-1 text-[10px] font-mono border border-[var(--line)] text-[var(--ink-dim)] rounded hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
            + Add Tenant
          </button>
        </div>
      </div>

      {/* Tenant table */}
      {tenants.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="text-[var(--ink-faint)] border-b border-[var(--line)]">
                <th className="text-left py-1 pr-2">Tenant</th>
                <th className="text-right py-1 pr-2">SF</th>
                <th className="text-right py-1 pr-2">$/SF/Yr</th>
                <th className="text-right py-1 pr-2">Ann. Rent</th>
                <th className="text-left py-1 pr-2">Type</th>
                <th className="text-left py-1 pr-2">Expires</th>
                <th className="py-1 w-4" />
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="py-1.5 pr-2 text-[var(--ink)]">{t.name}</td>
                  <td className="py-1.5 pr-2 text-right">{t.sf.toLocaleString()}</td>
                  <td className="py-1.5 pr-2 text-right">${t.rentPerSf}</td>
                  <td className="py-1.5 pr-2 text-right text-[var(--accent)]">{$f(t.sf * t.rentPerSf)}</td>
                  <td className="py-1.5 pr-2 text-[var(--ink-faint)]">{t.leaseType.toUpperCase()}</td>
                  <td className="py-1.5 pr-2 text-[var(--ink-faint)]">{t.leaseEnd || "—"}</td>
                  <td className="py-1.5">
                    <button onClick={() => remove(t.id)} className="text-[var(--ink-faint)] hover:text-[var(--bad)] transition-colors">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--line-2)] font-bold">
                <td className="py-1.5 pr-2 text-[var(--ink)]">Total / Avg</td>
                <td className="py-1.5 pr-2 text-right text-[var(--ink)]">{totalSf.toLocaleString()}</td>
                <td className="py-1.5 pr-2 text-right text-[var(--ink)]">${weightedRentPerSf.toFixed(2)}</td>
                <td className="py-1.5 pr-2 text-right text-[var(--accent)]">{$f(totalAnnualRent)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Add tenant form */}
      {adding && (
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3 flex flex-col gap-2">
          <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-1">New Tenant</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                placeholder="Tenant name"
                className="w-full bg-[var(--bg)] border border-[var(--line)] rounded px-2 py-1.5 text-xs font-mono text-[var(--ink)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--ink-faint)]" />
            </div>
            {[
              { label: "SF", key: "sf" as const, type: "number" },
              { label: "$/SF/Yr", key: "rentPerSf" as const, type: "number" },
              { label: "Lease Start", key: "leaseStart" as const, type: "text" },
              { label: "Lease End", key: "leaseEnd" as const, type: "text" },
            ].map(({ label, key, type }) => (
              <div key={key} className="flex flex-col gap-0.5">
                <label className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-wider">{label}</label>
                <input value={draft[key]} type={type}
                  onChange={e => setDraft(d => ({ ...d, [key]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))}
                  placeholder={label}
                  className="bg-[var(--bg)] border border-[var(--line)] rounded px-2 py-1.5 text-xs font-mono text-[var(--ink)] outline-none focus:border-[var(--accent)]" />
              </div>
            ))}
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-wider">Lease Type</label>
              <select value={draft.leaseType} onChange={e => setDraft(d => ({ ...d, leaseType: e.target.value as "nnn" | "nn" | "gross" }))}
                className="bg-[var(--bg)] border border-[var(--line)] rounded px-2 py-1.5 text-xs font-mono text-[var(--ink)] outline-none">
                <option value="nnn">NNN</option>
                <option value="nn">NN</option>
                <option value="gross">Gross</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <button onClick={addTenant}
              className="px-3 py-1.5 text-xs font-mono font-bold bg-[var(--accent)] text-[var(--bg)] rounded hover:opacity-90 transition-opacity">
              Add
            </button>
            <button onClick={() => { setAdding(false); setDraft(BLANK); }}
              className="px-3 py-1.5 text-xs font-mono text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {tenants.length === 0 && !adding && (
        <div className="border border-dashed border-[var(--line)] rounded p-6 text-center">
          <p className="text-xs font-mono text-[var(--ink-faint)]">No tenants yet.</p>
          <p className="text-[10px] font-mono text-[var(--ink-faint)] mt-1">Add tenants to build a rent roll and apply the aggregate to the NNN calculator.</p>
        </div>
      )}
    </div>
  );
}
