"use client";

import { useState } from "react";

interface RentEstimate {
  rent: number;
  rentRangeLow: number;
  rentRangeHigh: number;
  listings?: Array<{
    id: string;
    formattedAddress: string;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    price: number;
    daysOnMarket?: number;
  }>;
}

const $ = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function RentComps({ defaultAddress }: { defaultAddress?: string }) {
  const [address, setAddress] = useState(defaultAddress ?? "");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RentEstimate | null>(null);
  const [error, setError] = useState("");

  async function fetchComps() {
    if (!address.trim()) return;
    setLoading(true);
    setData(null);
    setError("");
    try {
      const res = await fetch(`/api/comps/rent?address=${encodeURIComponent(address)}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Request failed");
        return;
      }
      setData(json);
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <p className="text-xs font-mono font-bold text-[var(--ink)] mb-0.5">Rent Comps</p>
        <p className="text-[10px] font-mono text-[var(--ink-faint)]">RentCast AVM + nearby rental listings</p>
      </div>

      <div className="flex gap-2">
        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          onKeyDown={e => e.key === "Enter" && fetchComps()}
          placeholder="123 Main St, Rochester, NY 14620"
          className="flex-1 bg-[var(--panel)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-[var(--ink)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--ink-faint)] transition-colors"
        />
        <button onClick={fetchComps} disabled={loading || !address.trim()}
          className={`px-4 py-1.5 text-xs font-mono font-bold rounded border transition-colors flex-shrink-0 ${
            loading || !address.trim()
              ? "border-[var(--line)] text-[var(--ink-faint)] cursor-not-allowed"
              : "border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--bg)]"
          }`}>
          {loading ? "Fetching…" : "Fetch Comps"}
        </button>
      </div>

      {error && (
        <div className="bg-[#3a1010] border border-[var(--bad)] rounded p-3 text-xs font-mono text-[var(--bad)]">
          {error === "RENTCAST_API_KEY not configured"
            ? "Add RENTCAST_API_KEY to Vercel env vars to enable rent comps."
            : error}
        </div>
      )}

      {data && (
        <>
          {/* AVM estimate */}
          <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
            <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">AVM Rent Estimate</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-wider">Low</p>
                <p className="text-base font-mono font-bold text-[var(--ink-dim)]">{$(data.rentRangeLow)}/mo</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-wider">Estimate</p>
                <p className="text-xl font-mono font-bold text-[var(--accent)]">{$(data.rent)}/mo</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-wider">High</p>
                <p className="text-base font-mono font-bold text-[var(--ink-dim)]">{$(data.rentRangeHigh)}/mo</p>
              </div>
            </div>
          </div>

          {/* Nearby listings */}
          {data.listings && data.listings.length > 0 && (
            <div className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
              <p className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">
                Nearby Listings ({data.listings.length})
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] font-mono">
                  <thead>
                    <tr className="text-[var(--ink-faint)] border-b border-[var(--line)]">
                      <th className="text-left py-1 pr-3">Address</th>
                      <th className="text-right py-1 pr-2">Bed/Bath</th>
                      <th className="text-right py-1 pr-2">SF</th>
                      <th className="text-right py-1 pr-2">Rent</th>
                      <th className="text-right py-1">DOM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.listings.slice(0, 8).map(l => (
                      <tr key={l.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--panel-2)]">
                        <td className="py-1 pr-3 text-[var(--ink-dim)] max-w-[180px] truncate">{l.formattedAddress}</td>
                        <td className="py-1 pr-2 text-right text-[var(--ink-faint)]">{l.bedrooms}/{l.bathrooms}</td>
                        <td className="py-1 pr-2 text-right text-[var(--ink-faint)]">{l.squareFootage?.toLocaleString() ?? "—"}</td>
                        <td className="py-1 pr-2 text-right font-bold text-[var(--accent)]">{$(l.price)}</td>
                        <td className="py-1 text-right text-[var(--ink-faint)]">{l.daysOnMarket ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!data && !loading && !error && (
        <div className="border border-dashed border-[var(--line)] rounded p-6 text-center">
          <p className="text-xs font-mono text-[var(--ink-faint)]">Enter an address to pull rent comps.</p>
          <p className="text-[10px] font-mono text-[var(--ink-faint)] mt-1">Powered by RentCast · Residential only</p>
        </div>
      )}
    </div>
  );
}
