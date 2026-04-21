import type { BRRRRInputs, NNNInputs } from "@/types/deal";
import { calcBRRRR } from "./brrrr";
import { calcNNN } from "./nnn";

export interface BRRRRBacksolve {
  maxPriceForCoC: number;
  maxPriceForDSCR: number;
  maxPriceForCF: number;
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
  const cap = (v: number) => Math.max(1000, Math.min(v, inputs.arv * 3));

  const maxPriceForCoC = binarySearch(
    1000, inputs.arv * 3,
    p => calcBRRRR({ ...inputs, purchase: cap(p) }).cocReturn * 100,
    targetCoC
  );

  const maxPriceForDSCR = binarySearch(
    1000, inputs.arv * 3,
    p => calcBRRRR({ ...inputs, purchase: cap(p) }).dscr,
    targetDSCR
  );

  const maxPriceForCF = binarySearch(
    1000, inputs.arv * 3,
    p => calcBRRRR({ ...inputs, purchase: cap(p) }).cashflowMonthly,
    targetMonthlyCF
  );

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
