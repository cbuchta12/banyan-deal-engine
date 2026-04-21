export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-xs font-mono tracking-widest text-[var(--ink-faint)] uppercase">
          Banyan Deal Engine
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--ink)]">
          BRRRR + NNN Underwriting Terminal
        </h1>
        <p className="text-[var(--ink-dim)] text-sm max-w-sm mt-1">
          Phase 0 scaffold — auth, schema, and underwriting UI coming next.
        </p>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <div className="h-px w-16 bg-[var(--line)]" />
        <span className="text-[var(--accent)] font-mono text-xs tracking-widest">v0.1.0</span>
        <div className="h-px w-16 bg-[var(--line)]" />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2 text-xs font-mono text-[var(--ink-dim)]">
        {["BRRRR Analyzer", "NNN Underwriter", "10-yr DCF Engine", "AI Value Add"].map((f) => (
          <div key={f} className="flex items-center gap-2 bg-[var(--panel)] border border-[var(--line)] rounded px-3 py-2">
            <span className="text-[var(--accent-dim)]">◆</span>
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}
