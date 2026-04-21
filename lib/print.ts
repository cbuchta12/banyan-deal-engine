import type { BRRRRResult, BRRRRInputs, NNNResult, NNNInputs } from "@/types/deal";
import type { DCFResult } from "./calculations/dcf";

const $f = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n: number) => (n * 100).toFixed(2) + "%";

export function generateBRRRRPrint(
  name: string, address: string,
  i: BRRRRInputs, r: BRRRRResult, dcf: DCFResult
): string {
  const rows = dcf.rows.map(row => `
    <tr>
      <td>${row.year}</td>
      <td>${$f(row.grossIncome)}</td>
      <td>${$f(row.noi)}</td>
      <td>(${$f(row.debtService)})</td>
      <td style="color:${row.cashFlow >= 0 ? "#5d9b27" : "#c0392b"}">${$f(row.cashFlow)}</td>
      <td>${$f(row.cumulative)}</td>
    </tr>`).join("");

  return buildHTML(`BRRRR — ${name || "Deal Analysis"}`, address, `
    <div class="verdict ${r.verdict.replace(/[^a-z]/gi, "-").toLowerCase()}">${r.verdict}</div>
    <div class="metrics">
      <div class="m"><div class="ml">Cash-on-Cash</div><div class="mv">${pct(r.cocReturn)}</div></div>
      <div class="m"><div class="ml">Monthly CF</div><div class="mv">${$f(r.cashflowMonthly)}</div></div>
      <div class="m"><div class="ml">DSCR</div><div class="mv">${r.dscr.toFixed(2)}</div></div>
      <div class="m"><div class="ml">Cap Rate</div><div class="mv">${pct(r.capRate)}</div></div>
      <div class="m"><div class="ml">ARV Ratio</div><div class="mv">${(r.arvRatio * 100).toFixed(0)}%</div></div>
      <div class="m"><div class="ml">GRM</div><div class="mv">${r.grm.toFixed(1)}</div></div>
    </div>

    <div class="section">
      <h3>BRRRR Waterfall</h3>
      <table><tbody>
        <tr><td>Purchase</td><td>${$f(i.purchase)}</td><td>Rehab</td><td>${$f(i.rehab)}</td></tr>
        <tr><td>Total Invested</td><td>${$f(r.totalInvested)}</td><td>ARV</td><td>${$f(i.arv)}</td></tr>
        <tr><td>Refi Loan</td><td>${$f(r.refiLoan)}</td><td>Cash Back</td><td>${$f(r.cashBackAtRefi)}</td></tr>
        <tr><td>Equity in Deal</td><td>${$f(r.equityLeftInDeal)}</td><td>Equity Created</td><td>${$f(r.equityCreated)}</td></tr>
      </tbody></table>
    </div>

    <div class="section">
      <h3>Operating (Annual)</h3>
      <table><tbody>
        <tr><td>Gross Rent</td><td>${$f(r.grossRent * 12)}</td><td>Effective Rent</td><td>${$f(r.effectiveRent * 12)}</td></tr>
        <tr><td>OpEx</td><td>${$f(r.opex * 12)}</td><td>NOI</td><td>${$f(r.noiAnnual)}</td></tr>
        <tr><td>Debt Service</td><td>${$f(r.debtService * 12)}</td><td>Net Cash Flow</td><td>${$f(r.cashflowAnnual)}</td></tr>
      </tbody></table>
    </div>

    <div class="section">
      <h3>${i.holdPeriod}-Year DCF · IRR ${pct(dcf.irr)} · ${dcf.equityMultiple.toFixed(2)}x Equity Multiple · Exit ${$f(dcf.exitValue)}</h3>
      <table>
        <thead><tr><th>Yr</th><th>Gross Income</th><th>NOI</th><th>Debt Service</th><th>Cash Flow</th><th>Cumulative</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `);
}

export function generateNNNPrint(
  name: string, address: string,
  i: NNNInputs, r: NNNResult, dcf: DCFResult
): string {
  const rows = dcf.rows.map(row => `
    <tr>
      <td>${row.year}</td>
      <td>${$f(row.grossIncome)}</td>
      <td>${$f(row.noi)}</td>
      <td>(${$f(row.debtService)})</td>
      <td style="color:${row.cashFlow >= 0 ? "#5d9b27" : "#c0392b"}">${$f(row.cashFlow)}</td>
      <td>${$f(row.cumulative)}</td>
    </tr>`).join("");

  return buildHTML(`NNN — ${name || "Deal Analysis"}`, address, `
    <div class="verdict">${r.verdict}</div>
    <div class="metrics">
      <div class="m"><div class="ml">Cap Rate</div><div class="mv">${pct(r.goingInCapRate)}</div></div>
      <div class="m"><div class="ml">Monthly CF</div><div class="mv">${$f(r.cashflowMonthly)}</div></div>
      <div class="m"><div class="ml">DSCR</div><div class="mv">${r.dscr.toFixed(2)}</div></div>
      <div class="m"><div class="ml">Price/SF</div><div class="mv">$${r.pricePerSf.toFixed(0)}</div></div>
      <div class="m"><div class="ml">CoC Return</div><div class="mv">${pct(r.cocReturn)}</div></div>
      <div class="m"><div class="ml">Lease Strength</div><div class="mv">${r.leaseStrength}/9</div></div>
    </div>

    <div class="section">
      <h3>Property & Lease</h3>
      <table><tbody>
        <tr><td>Price</td><td>${$f(i.price)}</td><td>SF</td><td>${i.sf.toLocaleString()}</td></tr>
        <tr><td>Rent/SF/Yr</td><td>$${i.rentPerSf}</td><td>Lease</td><td>${i.leaseTerm}yr ${i.leaseType.toUpperCase()}</td></tr>
        <tr><td>Tenant Credit</td><td>${i.tenantCredit}</td><td>Escalator</td><td>${i.escalator}%/yr</td></tr>
        <tr><td>LTV</td><td>${i.ltv}%</td><td>Rate</td><td>${i.rate}%</td></tr>
      </tbody></table>
    </div>

    <div class="section">
      <h3>Income & Expenses (Annual)</h3>
      <table><tbody>
        <tr><td>Base Rent</td><td>${$f(r.baseRentAnnual)}</td><td>Landlord Exp</td><td>${$f(r.landlordExpenses)}</td></tr>
        <tr><td>NOI</td><td>${$f(r.noiAnnual)}</td><td>Debt Service</td><td>${$f(r.debtServiceAnnual)}</td></tr>
        <tr><td>Net CF</td><td>${$f(r.cashflowAnnual)}</td><td>Exit Value</td><td>${$f(r.exitValue)}</td></tr>
      </tbody></table>
    </div>

    <div class="section">
      <h3>${i.loanTerm}-Year DCF · IRR ${pct(dcf.irr)} · ${dcf.equityMultiple.toFixed(2)}x Equity Multiple · NPV ${$f(dcf.npv10)}</h3>
      <table>
        <thead><tr><th>Yr</th><th>Gross Income</th><th>NOI</th><th>Debt Service</th><th>Cash Flow</th><th>Cumulative</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `);
}

function buildHTML(title: string, address: string, body: string): string {
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Courier New", monospace; font-size: 11px; color: #111; padding: 24px; max-width: 900px; margin: 0 auto; }
  h1 { font-size: 18px; margin-bottom: 2px; }
  h2 { font-size: 12px; color: #666; margin-bottom: 16px; font-weight: normal; }
  h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #4a7c10; margin-bottom: 6px; margin-top: 16px; }
  .verdict { display: inline-block; padding: 4px 14px; border: 2px solid #4a7c10; border-radius: 4px; font-weight: bold; font-size: 13px; letter-spacing: 0.1em; margin-bottom: 16px; }
  .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
  .m { border: 1px solid #ddd; border-radius: 4px; padding: 8px; }
  .ml { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; }
  .mv { font-size: 16px; font-weight: bold; margin-top: 2px; }
  .section { margin-top: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #eee; }
  th { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; }
  .footer { margin-top: 24px; border-top: 1px solid #ddd; padding-top: 8px; font-size: 9px; color: #aaa; }
  @media print { body { padding: 0; } }
</style>
</head><body>
<h1>${title}</h1>
${address ? `<h2>${address}</h2>` : ""}
<p style="font-size:9px;color:#aaa;margin-bottom:12px;">Generated ${new Date().toLocaleDateString()} · Banyan Deal Engine</p>
${body}
<div class="footer">Banyan Deal Engine — For internal use only. Not investment advice.</div>
<script>window.onload = () => window.print();</script>
</body></html>`;
}
