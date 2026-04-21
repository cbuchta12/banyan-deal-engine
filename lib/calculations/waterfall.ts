import type { DCFRow } from "./dcf";

export interface WaterfallInputs {
  lpPct: number;        // LP equity % (e.g. 80)
  prefReturn: number;   // preferred return % (e.g. 8)
  promote: number;      // GP promote above pref % (e.g. 20)
  totalEquity: number;  // total deal equity
  rows: DCFRow[];       // DCF cash flow rows
  exitEquity: number;   // equity at exit
}

export interface WaterfallRow {
  year: number;
  cashFlow: number;
  lpPref: number;
  lpAbovePref: number;
  gpPromote: number;
  lpTotal: number;
  gpTotal: number;
  accrued: number;     // unpaid pref carried forward
}

export interface WaterfallResult {
  rows: WaterfallRow[];
  lpEquity: number;
  gpEquity: number;
  totalLPReturn: number;
  totalGPReturn: number;
  lpIRR: number;
  gpIRR: number;
  lpEquityMultiple: number;
  gpEquityMultiple: number;
}

function solveIRR(cfs: number[]): number {
  let r = 0.1;
  for (let i = 0; i < 200; i++) {
    let npv = 0, dnpv = 0;
    for (let t = 0; t < cfs.length; t++) {
      const pv = Math.pow(1 + r, t);
      npv += cfs[t] / pv;
      dnpv -= (t * cfs[t]) / (pv * (1 + r));
    }
    if (Math.abs(npv) < 0.5) break;
    if (Math.abs(dnpv) < 1e-10) break;
    r -= npv / dnpv;
    if (r < -0.99) r = -0.99;
    if (r > 100) r = 100;
  }
  return isFinite(r) ? r : 0;
}

export function calcWaterfall(inp: WaterfallInputs): WaterfallResult {
  const lpEquity = inp.totalEquity * (inp.lpPct / 100);
  const gpEquity = inp.totalEquity * (1 - inp.lpPct / 100);
  const prefRate = inp.prefReturn / 100;
  const promoteRate = inp.promote / 100;

  const rows: WaterfallRow[] = [];
  let accrued = 0;
  const lpCFs: number[] = [-lpEquity];
  const gpCFs: number[] = [-gpEquity];

  const periods = [...inp.rows.map(r => ({ year: r.year, cf: r.cashFlow, isExit: false }))];
  if (periods.length > 0) {
    periods[periods.length - 1] = { ...periods[periods.length - 1], cf: periods[periods.length - 1].cf + inp.exitEquity, isExit: true };
  }

  for (const p of periods) {
    let cash = p.cf;

    // Step 1: LP preferred return + accrued
    const prefDue = lpEquity * prefRate + accrued;
    const prefPaid = Math.max(0, Math.min(cash, prefDue));
    cash -= prefPaid;
    accrued = Math.max(0, prefDue - prefPaid);

    // Step 2: Split remaining
    const lpAbove = cash * (1 - promoteRate);
    const gpProm = cash * promoteRate;

    // Step 3: At exit, return capital
    let lpCapReturn = 0, gpCapReturn = 0;
    if (p.isExit) {
      // Capital already embedded in exitEquity distributions — no separate return needed
    }

    const lpTotal = prefPaid + lpAbove + lpCapReturn;
    const gpTotal = gpProm + gpCapReturn;

    rows.push({ year: p.year, cashFlow: p.cf, lpPref: prefPaid, lpAbovePref: lpAbove, gpPromote: gpProm, lpTotal, gpTotal, accrued });
    lpCFs.push(lpTotal);
    gpCFs.push(gpTotal);
  }

  // Add capital return at exit
  if (lpCFs.length > 1) {
    lpCFs[lpCFs.length - 1] += lpEquity;
    gpCFs[gpCFs.length - 1] += gpEquity;
    rows[rows.length - 1].lpTotal += lpEquity;
    rows[rows.length - 1].gpTotal += gpEquity;
  }

  const totalLP = lpCFs.slice(1).reduce((s, v) => s + v, 0);
  const totalGP = gpCFs.slice(1).reduce((s, v) => s + v, 0);

  return {
    rows,
    lpEquity,
    gpEquity,
    totalLPReturn: totalLP,
    totalGPReturn: totalGP,
    lpIRR: solveIRR(lpCFs),
    gpIRR: solveIRR(gpCFs),
    lpEquityMultiple: lpEquity > 0 ? totalLP / lpEquity : 0,
    gpEquityMultiple: gpEquity > 0 ? totalGP / gpEquity : 0,
  };
}
