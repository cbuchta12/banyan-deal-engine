import type { NNNInputs, NNNResult, NNNVerdict } from "@/types/deal";
import { monthlyPayment } from "./mortgage";

export function calcNNN(i: NNNInputs): NNNResult {
  // ── Income ────────────────────────────────────────────────────
  const baseRentAnnual = i.rentPerSf * i.sf;
  const noiPreExp = baseRentAnnual * (1 - i.vacancy / 100);

  // Landlord-borne expenses vary by lease type
  let landlordExpenses = 0;
  if (i.leaseType === "nnn") {
    landlordExpenses = baseRentAnnual * (i.managementPct / 100) + i.structuralReservePerSf * i.sf;
  } else if (i.leaseType === "nn") {
    landlordExpenses = baseRentAnnual * (i.managementPct / 100) + i.structuralReservePerSf * i.sf + 0.50 * i.sf;
  } else {
    landlordExpenses = baseRentAnnual * (i.managementPct / 100) + i.structuralReservePerSf * i.sf + 2.50 * i.sf;
  }

  const noiAnnual = noiPreExp - landlordExpenses;
  const noiMonthly = noiAnnual / 12;

  // ── Debt ──────────────────────────────────────────────────────
  const loan = i.price * (i.ltv / 100);
  const equity = i.price * (1 - i.ltv / 100) + i.closingCosts;
  const pi_monthly = monthlyPayment(loan, i.rate, i.amort);
  const debtServiceAnnual = pi_monthly * 12;

  const cashflowAnnual = noiAnnual - debtServiceAnnual;
  const cashflowMonthly = cashflowAnnual / 12;

  // ── Ratios ────────────────────────────────────────────────────
  const goingInCapRate = i.price > 0 ? noiAnnual / i.price : 0;
  const cocReturn = equity > 0 ? cashflowAnnual / equity : 0;
  const dscr = debtServiceAnnual > 0 ? noiAnnual / debtServiceAnnual : 0;
  const pricePerSf = i.sf > 0 ? i.price / i.sf : 0;

  // ── Exit ──────────────────────────────────────────────────────
  const rentAtExit = baseRentAnnual * Math.pow(1 + i.escalator / 100, Math.min(i.loanTerm, i.leaseTerm));
  const noiAtExit = rentAtExit * (1 - i.vacancy / 100) - landlordExpenses * Math.pow(1.02, i.loanTerm);
  const exitValue = i.exitCapRate > 0 ? noiAtExit / (i.exitCapRate / 100) : 0;
  const appreciation = exitValue - i.price;

  // ── Lease strength score (max 9) ──────────────────────────────
  const creditScore = { ig: 4, strong: 3, mid: 2, sub: 1 }[i.tenantCredit];
  const mcScore = { yes: 2, partial: 1, no: 0 }[i.missionCritical];
  const termScore = i.leaseTerm >= 15 ? 2 : i.leaseTerm >= 10 ? 1 : 0;
  const escScore = i.escalator >= 2 ? 1 : 0;
  const leaseStrength = creditScore + mcScore + termScore + escScore;

  // ── Verdict ───────────────────────────────────────────────────
  const score =
    (goingInCapRate >= 0.075 ? 1 : 0) +
    (dscr >= 1.30 ? 1 : 0) +
    (cocReturn >= 0.08 ? 1 : 0) +
    (leaseStrength >= 6 ? 1 : 0) +
    (cashflowAnnual > 0 ? 1 : 0);

  const verdictMap: [number, NNNVerdict][] = [
    [5, "ACQUIRE"],
    [4, "ACQUIRE / CLEAN UP"],
    [3, "NEGOTIATE"],
    [2, "PASS / REWORK"],
    [0, "HARD PASS"],
  ];
  const verdict = (verdictMap.find(([s]) => score >= s) ?? verdictMap[4])[1];

  return {
    baseRentAnnual, noiAnnual, noiMonthly, landlordExpenses,
    loan, equity, debtServiceAnnual, cashflowAnnual, cashflowMonthly,
    goingInCapRate, cocReturn, dscr, pricePerSf,
    exitValue, appreciation, leaseStrength, verdict,
  };
}
