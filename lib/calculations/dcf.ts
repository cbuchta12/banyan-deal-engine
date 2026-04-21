import type { BRRRRResult, NNNResult, NNNInputs } from "@/types/deal";

export interface DCFRow {
  year: number;
  grossIncome: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  cumulative: number;
}

export interface DCFResult {
  rows: DCFRow[];
  exitValue: number;
  exitEquity: number;
  totalReturn: number;
  irr: number;
  npv10: number;
  equityMultiple: number;
}

function solveIRR(cashflows: number[]): number {
  let rate = 0.1;
  for (let i = 0; i < 200; i++) {
    let npv = 0, dnpv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const pv = Math.pow(1 + rate, t);
      npv += cashflows[t] / pv;
      dnpv -= (t * cashflows[t]) / (pv * (1 + rate));
    }
    if (Math.abs(npv) < 0.5) break;
    if (Math.abs(dnpv) < 1e-10) break;
    rate -= npv / dnpv;
    if (rate < -0.99) rate = -0.99;
    if (rate > 100) rate = 100;
  }
  return isFinite(rate) ? rate : 0;
}

export function calcDCF_BRRRR(
  result: BRRRRResult,
  opts: { rentGrowth: number; exitCapRate: number; holdPeriod: number }
): DCFResult {
  const { holdPeriod, rentGrowth, exitCapRate } = opts;
  const equity = Math.max(result.equityLeftInDeal, 1);
  const cashflows: number[] = [-equity];
  const rows: DCFRow[] = [];
  let cumulative = 0;

  for (let yr = 1; yr <= holdPeriod; yr++) {
    const g = Math.pow(1 + rentGrowth / 100, yr - 1);
    const grossIncome = result.grossRent * 12 * g;
    const noi = result.noiAnnual * g;
    const debtService = result.debtService * 12;
    const cashFlow = noi - debtService;
    cumulative += cashFlow;
    rows.push({ year: yr, grossIncome, noi, debtService, cashFlow, cumulative });
    if (yr < holdPeriod) cashflows.push(cashFlow);
  }

  const exitNOI = result.noiAnnual * Math.pow(1 + rentGrowth / 100, holdPeriod);
  const exitValue = exitCapRate > 0 ? exitNOI / (exitCapRate / 100) : 0;
  const remainingLoan = Math.max(0, result.refiLoan * (1 - holdPeriod / 30));
  const exitEquity = exitValue - remainingLoan;
  const lastCF = rows[holdPeriod - 1]?.cashFlow ?? 0;
  cashflows.push(lastCF + exitEquity);

  const totalReturn = cumulative + exitEquity;
  const irr = solveIRR(cashflows);
  const npv10 = cashflows.reduce((s, cf, t) => s + cf / Math.pow(1.1, t), 0);
  const equityMultiple = equity > 0 ? (totalReturn + equity) / equity : 0;

  return { rows, exitValue, exitEquity, totalReturn, irr, npv10, equityMultiple };
}

export function calcDCF_NNN(result: NNNResult, inputs: NNNInputs): DCFResult {
  const holdPeriod = inputs.loanTerm;
  const equity = Math.max(result.equity, 1);
  const cashflows: number[] = [-equity];
  const rows: DCFRow[] = [];
  let cumulative = 0;

  for (let yr = 1; yr <= holdPeriod; yr++) {
    const g = Math.pow(1 + inputs.escalator / 100, yr - 1);
    const grossIncome = result.baseRentAnnual * g;
    const noi = grossIncome * (1 - inputs.vacancy / 100) - result.landlordExpenses * Math.pow(1.02, yr - 1);
    const debtService = result.debtServiceAnnual;
    const cashFlow = noi - debtService;
    cumulative += cashFlow;
    rows.push({ year: yr, grossIncome, noi, debtService, cashFlow, cumulative });
    if (yr < holdPeriod) cashflows.push(cashFlow);
  }

  const exitNOI = result.noiAnnual * Math.pow(1 + inputs.escalator / 100, holdPeriod);
  const exitValue = inputs.exitCapRate > 0 ? exitNOI / (inputs.exitCapRate / 100) : 0;
  const remainingLoan = Math.max(0, result.loan * (1 - holdPeriod / inputs.amort));
  const exitEquity = exitValue - remainingLoan;
  cashflows.push((rows[holdPeriod - 1]?.cashFlow ?? 0) + exitEquity);

  const totalReturn = cumulative + exitEquity;
  const irr = solveIRR(cashflows);
  const npv10 = cashflows.reduce((s, cf, t) => s + cf / Math.pow(1.1, t), 0);
  const equityMultiple = equity > 0 ? (totalReturn + equity) / equity : 0;

  return { rows, exitValue, exitEquity, totalReturn, irr, npv10, equityMultiple };
}
