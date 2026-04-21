/** Monthly payment for a fully-amortizing mortgage. Returns 0 for degenerate inputs. */
export function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  if (principal <= 0 || annualRatePct <= 0 || years <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}
