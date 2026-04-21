import type { BRRRRInputs, NNNInputs } from "@/types/deal";
import { calcBRRRR } from "./brrrr";
import { calcNNN } from "./nnn";

export interface BRRRRBacksolve {
  maxPriceForCoC: number;    // 0 = unachievable at any price
  maxPriceForDSCR: number;   // 0 = unachievable; Infinity = met at any price (not price-sensitive)
  maxPriceForCF: number;     // same semantics as maxPriceForDSCR
}

export interface NNNBacksolve {
  maxPriceForCapRate: number;
  maxPriceForCoC: number;
  maxPriceForDSCR: number;
}

function binarySearch(
  lo: number, hi: number,
  test: (v: number) => number,
  target: number,
  iterations = 60
): number {
  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    if (test(mid) > target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

export function backsolveBRRRR(inputs: BRRRRInputs, targets: {
  targetCoC: number;
  targetDSCR: number;
  targetMonthlyCF: number;
}): BRRRRBacksolve {
  const { targetCoC, targetDSCR, targetMonthlyCF } = targets;

  // In BRRRR, operating metrics (DSCR, monthly CF) are INDEPENDENT of purchase price.
  // Debt service = refiLoan (ARV × LTV) / rate — unaffected by what you paid.
  // Only CoC varies with purchase because equityLeftInDeal = purchase + fixedCosts − refiLoan + refiClosingCosts.
  const base = calcBRRRR(inputs);

  // DSCR: constant across all purchase prices.
  const maxPriceForDSCR = base.dscr >= targetDSCR ? Infinity : 0;
  // Monthly CF: same.
  const maxPriceForCF = base.cashflowMonthly >= targetMonthlyCF ? Infinity : 0;

  // CoC — closed-form solution (no iteration needed):
  // equityLeftInDeal = purchase + rehab + closingCosts + holdingCosts − refiLoan + refiClosingCosts
  // CoC = cashflowAnnual / equityLeftInDeal  →  equityLeftInDeal = cashflowAnnual / (targetCoC/100)
  // purchase_max = equityLeftInDeal − (rehab + closingCosts + holdingCosts) + refiLoan − refiClosingCosts
  if (base.cashflowAnnual <= 0) {
    // Negative/zero CF: CoC can never be positive, no purchase price helps.
    return { maxPriceForCoC: 0, maxPriceForDSCR, maxPriceForCF };
  }

  const refiLoan = inputs.arv * (inputs.refiLtv / 100);
  const fixedCosts = inputs.rehab + inputs.closingCosts + inputs.holdingCosts;
  const targetEquityInDeal = base.cashflowAnnual / (targetCoC / 100);
  const maxPriceForCoC = Math.max(0, targetEquityInDeal - fixedCosts + refiLoan - inputs.refiClosingCosts);

  return { maxPriceForCoC, maxPriceForDSCR, maxPriceForCF };
}

export function backsolveNNN(inputs: NNNInputs, targets: {
  targetCapRate: number;
  targetCoC: number;
  targetDSCR: number;
}): NNNBacksolve {
  const { targetCapRate, targetCoC, targetDSCR } = targets;
  const hi = inputs.price * 5;

  const maxPriceForCapRate = binarySearch(
    10000, hi,
    p => calcNNN({ ...inputs, price: p }).goingInCapRate * 100,
    targetCapRate
  );

  const maxPriceForCoC = binarySearch(
    10000, hi,
    p => calcNNN({ ...inputs, price: p }).cocReturn * 100,
    targetCoC
  );

  const maxPriceForDSCR = binarySearch(
    10000, hi,
    p => calcNNN({ ...inputs, price: p }).dscr,
    targetDSCR
  );

  return { maxPriceForCapRate, maxPriceForCoC, maxPriceForDSCR };
}
