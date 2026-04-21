"use client";

import { useState } from "react";
import type { BRRRRInputs, NNNInputs, BRRRRResult, NNNResult } from "@/types/deal";

interface Props {
  mode: "brrrr" | "nnn";
  dealName: string;
  address: string;
  inputs: BRRRRInputs | NNNInputs;
  result: BRRRRResult | NNNResult;
}

export function AIAnalysis({ mode, dealName, address, inputs, result }: Props) {
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setMemo("");
    setError("");

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, dealName, address, inputs, result }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Request failed");
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMemo(full);
      }
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-bold text-[var(--ink)]">AI Deal Memo</p>
          <p className="text-[10px] font-mono text-[var(--ink-faint)]">Strengths, risks, negotiation, value-add, exit</p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className={`px-4 py-1.5 text-xs font-mono font-bold rounded border transition-colors ${
            loading
              ? "border-[var(--line)] text-[var(--ink-faint)] cursor-not-allowed"
              : "border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--bg)]"
          }`}>
          {loading ? "Analyzing…" : memo ? "Regenerate" : "Generate Analysis"}
        </button>
      </div>

      {error && (
        <div className="bg-[#3a1010] border border-[var(--bad)] rounded p-3 text-xs font-mono text-[var(--bad)]">
          {error === "AI not configured" ? "Add ANTHROPIC_API_KEY to Vercel env vars to enable AI." : error}
        </div>
      )}

      {!memo && !loading && !error && (
        <div className="border border-dashed border-[var(--line)] rounded p-6 text-center">
          <p className="text-xs font-mono text-[var(--ink-faint)]">Click Generate Analysis to get an AI deal memo.</p>
          <p className="text-[10px] font-mono text-[var(--ink-faint)] mt-1">Uses Claude Haiku · ~5 sec</p>
        </div>
      )}

      {memo && (
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-4">
          <div className="prose-sm font-mono text-xs text-[var(--ink)] leading-relaxed whitespace-pre-wrap">
            {memo.split(/\n/).map((line, i) => {
              if (line.startsWith("## ")) {
                return (
                  <p key={i} className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-widest mt-4 mb-1 first:mt-0">
                    {line.replace("## ", "")}
                  </p>
                );
              }
              if (line.startsWith("- ")) {
                return (
                  <p key={i} className="text-[var(--ink-dim)] mb-0.5 pl-2">
                    <span className="text-[var(--accent-dim)]">›</span> {line.replace("- ", "")}
                  </p>
                );
              }
              if (line.trim() === "") return <br key={i} />;
              return <p key={i} className="text-[var(--ink-dim)] mb-0.5">{line}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
