import type { BRRRRInputs, NNNInputs } from "@/types/deal";

export interface Preset {
  id: string;
  label: string;
  brrrr: BRRRRInputs;
  nnn: NNNInputs;
}

export const PRESETS: Preset[] = [
  {
    id: "us-default",
    label: "US Default",
    brrrr: {
      purchase: 85000, rehab: 30000, closingCosts: 3000, holdingCosts: 2000, arv: 150000,
      rent: 1400, loanType: "hard", initRate: 12, refiLtv: 75, refiRate: 7.25, amort: 30,
      refiClosingCosts: 3500, tax: 200, insurance: 100, hoa: 0,
      vacancy: 8, maintenance: 8, capex: 5, management: 10, utilities: 0, other: 0,
      rentGrowth: 3, exitCapRate: 7.5, holdPeriod: 10,
    },
    nnn: {
      price: 2500000, sf: 10000, closingCosts: 50000, assetClass: "industrial",
      rentPerSf: 12, leaseType: "nnn", leaseTerm: 10, escalator: 2,
      tenantCredit: "strong", missionCritical: "partial",
      ltv: 65, rate: 7.0, amort: 25, loanTerm: 10,
      managementPct: 3, structuralReservePerSf: 0.15, vacancy: 5, exitCapRate: 7.5,
    },
  },
  {
    id: "rochester-ny",
    label: "Rochester, NY",
    brrrr: {
      purchase: 75000, rehab: 25000, closingCosts: 2500, holdingCosts: 1500, arv: 130000,
      rent: 1200, loanType: "hard", initRate: 12, refiLtv: 75, refiRate: 7.25, amort: 30,
      refiClosingCosts: 3000, tax: 250, insurance: 90, hoa: 0,
      vacancy: 8, maintenance: 8, capex: 5, management: 10, utilities: 0, other: 0,
      rentGrowth: 2.5, exitCapRate: 8.0, holdPeriod: 10,
    },
    nnn: {
      price: 1800000, sf: 8000, closingCosts: 36000, assetClass: "industrial",
      rentPerSf: 10, leaseType: "nnn", leaseTerm: 10, escalator: 2,
      tenantCredit: "mid", missionCritical: "partial",
      ltv: 65, rate: 7.25, amort: 25, loanTerm: 10,
      managementPct: 3, structuralReservePerSf: 0.20, vacancy: 5, exitCapRate: 8.0,
    },
  },
  {
    id: "naples-fl",
    label: "Naples / Estero, FL",
    brrrr: {
      purchase: 220000, rehab: 45000, closingCosts: 6000, holdingCosts: 4000, arv: 380000,
      rent: 2800, loanType: "hard", initRate: 11.5, refiLtv: 75, refiRate: 7.0, amort: 30,
      refiClosingCosts: 6000, tax: 380, insurance: 250, hoa: 150,
      vacancy: 7, maintenance: 7, capex: 5, management: 10, utilities: 0, other: 0,
      rentGrowth: 4, exitCapRate: 6.5, holdPeriod: 10,
    },
    nnn: {
      price: 4500000, sf: 15000, closingCosts: 90000, assetClass: "retail",
      rentPerSf: 18, leaseType: "nnn", leaseTerm: 15, escalator: 2,
      tenantCredit: "strong", missionCritical: "yes",
      ltv: 65, rate: 6.75, amort: 25, loanTerm: 10,
      managementPct: 2, structuralReservePerSf: 0.10, vacancy: 3, exitCapRate: 6.5,
    },
  },
];
