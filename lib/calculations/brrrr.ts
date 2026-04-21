import type { BRRRRInputs, BRRRRResult, BRRRRVerdict } from "@/types/deal";
import { monthlyPayment } from "./mortgage";

export function calcBRRRR(i: BRRRRInputs): BRRRRResult {
  // ── Cash in ──────────────────────────────────────────────────
  let initialDebt = 0;
  if (i.loanType === "hard") {
    initialDebt = Math.min(i.arv * 0.70, i.purchase + i.rehab);
  } else if (i.loanType === "conv") {
    initialDebt = i.purchase * 0.80;
  } else if (i.loanType === "dscr") {
    initialDebt = i.purchase * 0.75;
  }

  const totalInvested = i.purchase + i.rehab + i.closingCosts + i.holdingCosts;
  const initialEquity = totalInvested - initialDebt;

  // ── Refi ─────────────────────────────────────────────────────
  const refiLoan = i.arv * (i.refiLtv / 100);
  const cashBackAtRefi = refiLoan - initialDebt - i.refiClosingCosts;
  const equityLeftInDeal = initialEquity - cashBackAtRefi;
  const allInBasis = totalInvested + i.refiClosingCosts;
  const equityCreated = i.arv - allInBasis;

  // ── Operating (post-refi, monthly) ───────────────────────────
  const grossRent = i.rent;
  const vacancy$ = i.rent * (i.vacancy / 100);
  const effectiveRent = grossRent - vacancy$;
  const maint$ = i.rent * (i.maintenance / 100);
  const capex$ = i.rent * (i.capex / 100);
  const mgmt$ = i.rent * (i.management / 100);
  const opex = i.tax + i.insurance + i.hoa + maint$ + capex$ + mgmt$ + i.utilities + i.other;
  const noiMonthly = effectiveRent - opex;
  const noiAnnual = noiMonthly * 12;

  const debtService = monthlyPayment(refiLoan, i.refiRate, i.amort);
  const cashflowMonthly = noiMonthly - debtService;
  const cashflowAnnual = cashflowMonthly * 12;

  // ── Ratios ────────────────────────────────────────────────────
  const cocReturn = equityLeftInDeal > 0 ? cashflowAnnual / equityLeftInDeal : (cashflowAnnual > 0 ? Infinity : 0);
  const capRate = i.arv > 0 ? noiAnnual / i.arv : 0;
  const dscr = debtService > 0 ? noiMonthly / debtService : 0;
  const rentToPrice = i.arv > 0 ? i.rent / i.arv : 0;
  const arvRatio = i.arv > 0 ? (i.purchase + i.rehab) / i.arv : 0;
  const grm = i.rent > 0 ? i.arv / (i.rent * 12) : 0;

  // ── Verdict ───────────────────────────────────────────────────
  const score =
    (cashflowMonthly >= 200 ? 1 : 0) +
    (arvRatio <= 0.75 ? 1 : 0) +
    (equityLeftInDeal <= totalInvested * 0.20 ? 1 : 0) +
    (dscr >= 1.25 ? 1 : 0);

  const verdictMap: [number, BRRRRVerdict][] = [
    [4, "BUY / STRONG"],
    [3, "BUY / CONDITIONAL"],
    [2, "MARGINAL"],
    [1, "PASS / REWORK"],
    [0, "HARD PASS"],
  ];
  const verdict = (verdictMap.find(([s]) => score >= s) ?? verdictMap[4])[1];

  return {
    totalInvested, refiLoan, cashBackAtRefi, equityLeftInDeal, equityCreated,
    grossRent, effectiveRent, opex, noiMonthly, noiAnnual,
    debtService, cashflowMonthly, cashflowAnnual,
    cocReturn, capRate, dscr, rentToPrice, arvRatio, grm,
    verdict,
  };
}
