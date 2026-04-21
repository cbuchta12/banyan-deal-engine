import { sendMagicLink } from "./actions";

interface Props {
  searchParams: Promise<{ sent?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { sent, error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="mb-8 text-center">
          <p className="text-xs font-mono tracking-widest text-[var(--ink-faint)] uppercase mb-2">
            Banyan Deal Engine
          </p>
          <h1 className="text-2xl font-bold text-[var(--ink)]">Sign in</h1>
          <p className="text-sm text-[var(--ink-dim)] mt-1">
            Enter your email — we&apos;ll send a magic link.
          </p>
        </div>

        {sent ? (
          <div className="rounded border border-[var(--accent-dim)] bg-[var(--panel)] px-5 py-4 text-center">
            <p className="text-sm font-mono text-[var(--accent)]">Check your inbox.</p>
            <p className="text-xs text-[var(--ink-dim)] mt-1">
              Click the link in the email to sign in.
            </p>
          </div>
        ) : (
          <form action={sendMagicLink} className="flex flex-col gap-3">
            <input
              type="email"
              name="email"
              required
              autoFocus
              placeholder="you@example.com"
              className="w-full rounded border border-[var(--line)] bg-[var(--panel-2)] px-4 py-3 text-sm font-mono text-[var(--ink)] placeholder:text-[var(--ink-faint)] outline-none focus:border-[var(--accent)] transition-colors"
            />
            <button
              type="submit"
              className="w-full rounded bg-[var(--accent)] py-3 text-sm font-bold font-mono text-[var(--bg)] hover:bg-[var(--accent-dim)] hover:text-[var(--ink)] transition-colors"
            >
              Send magic link
            </button>
            {error && (
              <p className="text-xs text-[var(--bad)] text-center">
                {error === "email" ? "Enter a valid email." : "Something went wrong — try again."}
              </p>
            )}
          </form>
        )}

      </div>
    </div>
  );
}
