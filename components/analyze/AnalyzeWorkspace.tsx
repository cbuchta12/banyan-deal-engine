"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { calcBRRRR } from "@/lib/calculations/brrrr";
import { calcNNN } from "@/lib/calculations/nnn";
import { calcDCF_BRRRR, calcDCF_NNN } from "@/lib/calculations/dcf";
import { PRESETS } from "@/lib/presets";
import { useDeals } from "@/lib/hooks/useDeals";
import { BRRRRForm } from "./BRRRRForm";
import { NNNForm } from "./NNNForm";
import { BRRRRResults } from "./BRRRRResults";
import { NNNResults } from "./NNNResults";
import type { DealMode, BRRRRInputs, NNNInputs } from "@/types/deal";

const DEFAULT = PRESETS[0];

export function AnalyzeWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { deals, saveDeal } = useDeals();

  const [mode, setMode] = useState<DealMode>("brrrr");
  const [dealName, setDealName] = useState("");
  const [address, setAddress] = useState("");
  const [currentId, setCurrentId] = useState<string | undefined>();
  const [activePreset, setActivePreset] = useState("us-default");
  const [saved, setSaved] = useState(false);

  const [brrrrInputs, setBrrrrInputs] = useState<BRRRRInputs>(DEFAULT.brrrr);
  const [nnnInputs, setNnnInputs] = useState<NNNInputs>(DEFAULT.nnn);

  // Load deal from URL param
  useEffect(() => {
    const id = searchParams.get("deal");
    if (!id || deals.length === 0) return;
    const deal = deals.find(d => d.id === id);
    if (!deal) return;
    setMode(deal.mode);
    setDealName(deal.name);
    setAddress(deal.address);
    setCurrentId(deal.id);
    if (deal.mode === "brrrr") setBrrrrInputs(deal.inputs as BRRRRInputs);
    else setNnnInputs(deal.inputs as NNNInputs);
  }, [searchParams, deals]);

  function applyPreset(id: string) {
    const preset = PRESETS.find(p => p.id === id);
    if (!preset) return;
    setBrrrrInputs(preset.brrrr);
    setNnnInputs(preset.nnn);
    setActivePreset(id);
  }

  const brrrrResult = useMemo(() => calcBRRRR(brrrrInputs), [brrrrInputs]);
  const nnnResult = useMemo(() => calcNNN(nnnInputs), [nnnInputs]);
  const brrrrDCF = useMemo(() =>
    calcDCF_BRRRR(brrrrResult, {
      rentGrowth: brrrrInputs.rentGrowth,
      exitCapRate: brrrrInputs.exitCapRate,
      holdPeriod: brrrrInputs.holdPeriod,
    }), [brrrrResult, brrrrInputs]);
  const nnnDCF = useMemo(() => calcDCF_NNN(nnnResult, nnnInputs), [nnnResult, nnnInputs]);

  function handleSave() {
    const name = dealName.trim() || "Untitled Deal";
    const deal = saveDeal({
      id: currentId,
      name,
      address,
      mode,
      status: "analyzing",
      inputs: mode === "brrrr" ? brrrrInputs : nnnInputs,
      result: mode === "brrrr" ? brrrrResult : nnnResult,
    });
    setCurrentId(deal.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleNew() {
    setMode("brrrr");
    setDealName("");
    setAddress("");
    setCurrentId(undefined);
    setBrrrrInputs(DEFAULT.brrrr);
    setNnnInputs(DEFAULT.nnn);
    router.push("/");
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 48px)" }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--line)] bg-[var(--panel)] flex-shrink-0 flex-wrap">
        <input
          value={dealName}
          onChange={e => { setDealName(e.target.value); setSaved(false); }}
          placeholder="Deal name…"
          className="bg-transparent text-[var(--ink)] font-mono text-sm outline-none placeholder:text-[var(--ink-faint)] w-36"
        />
        <span className="text-[var(--line-2)] select-none">|</span>
        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Address…"
          className="bg-transparent text-[var(--ink-dim)] font-mono text-xs outline-none placeholder:text-[var(--ink-faint)] flex-1 min-w-0"
        />

        {/* Mode toggle */}
        <div className="flex items-center gap-0.5 bg-[var(--bg)] rounded border border-[var(--line)] p-0.5 flex-shrink-0">
          {(["brrrr", "nnn"] as DealMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                mode === m ? "bg-[var(--accent)] text-[var(--bg)]" : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
              }`}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Preset */}
        <select value={activePreset} onChange={e => applyPreset(e.target.value)}
          className="bg-[var(--panel-2)] border border-[var(--line)] text-[var(--ink-dim)] text-xs font-mono rounded px-2 py-1 outline-none flex-shrink-0">
          {PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>

        {/* New */}
        <button onClick={handleNew}
          className="px-3 py-1 text-xs font-mono text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors flex-shrink-0">
          + New
        </button>

        {/* Save */}
        <button onClick={handleSave}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded border transition-colors flex-shrink-0 ${
            saved
              ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--bg)]"
              : "border-[var(--line)] text-[var(--ink-dim)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          }`}>
          {saved ? "✓ Saved" : "Save Deal"}
        </button>
      </div>

      {/* Two-column workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Inputs */}
        <div className="w-[400px] flex-shrink-0 overflow-y-auto border-r border-[var(--line)] bg-[var(--panel)]">
          {mode === "brrrr"
            ? <BRRRRForm inputs={brrrrInputs} onChange={setBrrrrInputs} />
            : <NNNForm inputs={nnnInputs} onChange={setNnnInputs} />
          }
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {mode === "brrrr"
            ? <BRRRRResults result={brrrrResult} dcf={brrrrDCF} inputs={brrrrInputs}
                dealName={dealName} address={address} nnnInputs={nnnInputs} />
            : <NNNResults result={nnnResult} dcf={nnnDCF} inputs={nnnInputs}
                dealName={dealName} address={address} brrrrInputs={brrrrInputs} />
          }
        </div>
      </div>
    </div>
  );
}
