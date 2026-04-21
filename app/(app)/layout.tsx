import { getAuthContext } from "@/lib/auth";
import Link from "next/link";

async function Nav() {
  return (
    <nav className="h-12 flex items-center px-4 border-b border-[var(--line)] bg-[var(--panel)] flex-shrink-0">
      <div className="flex items-center gap-6 w-full">
        <Link href="/" className="text-xs font-mono font-bold text-[var(--accent)] tracking-widest hover:opacity-80 transition-opacity">
          BANYAN
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/"
            className="px-3 py-1 text-xs font-mono text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-[var(--panel-2)] rounded transition-colors">
            Analyze
          </Link>
          <Link href="/deals"
            className="px-3 py-1 text-xs font-mono text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-[var(--panel-2)] rounded transition-colors">
            Pipeline
          </Link>
        </div>
        <div className="flex-1" />
        <span className="text-[9px] font-mono text-[var(--ink-faint)] tracking-widest">BRRRR + NNN UNDERWRITING TERMINAL</span>
      </div>
    </nav>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_AUTH_ENABLED === "true") {
    await getAuthContext();
  }
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
