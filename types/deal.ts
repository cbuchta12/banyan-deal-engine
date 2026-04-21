export type DealMode = "brrrr" | "nnn";

export type DealStatus = "analyzing" | "pass" | "negotiate" | "loi" | "under_contract" | "closed" | "dead";

export interface Deal {
  id: string;
  org_id: string;
  created_by: string;
  name: string;
  address: string | null;
  mode: DealMode;
  status: DealStatus;
  inputs: BRRRRInputs | NNNInputs;
  created_at: string;
  updated_at: string;
}

// ── BRRRR ──────────────────────────────────────────────────────

export interface BRRRRInputs {
  purchase: number;
  rehab: number;
  closingCosts: number;
  holdingCosts: number;
  arv: number;
  rent: number;
  loanType: "cash" | "hard" | "conv" | "dscr";
  initRate: number;
  refiLtv: number;
  refiRate: number;
  amort: number;
  refiClosingCosts: number;
  tax: number;
  insurance: number;
  hoa: number;
  vacancy: number;
  maintenance: number;
  capex: number;
  management: number;
  utilities: number;
  other: number;
}

export interface BRRRRResult {
  totalInvested: number;
  refiLoan: number;
  cashBackAtRefi: number;
  equityLeftInDeal: number;
  equityCreated: number;
  grossRent: number;
  effectiveRent: number;
  opex: number;
  noiMonthly: number;
  noiAnnual: number;
  debtService: number;
  cashflowMonthly: number;
  cashflowAnnual: number;
  cocReturn: number;
  capRate: number;
  dscr: number;
  rentToPrice: number;
  arvRatio: number;
  grm: number;
  verdict: BRRRRVerdict;
}

export type BRRRRVerdict =
  | "BUY / STRONG"
  | "BUY / CONDITIONAL"
  | "MARGINAL"
  | "PASS / REWORK"
  | "HARD PASS";

// ── NNN ────────────────────────────────────────────────────────

export interface NNNInputs {
  price: number;
  sf: number;
  closingCosts: number;
  assetClass: "industrial" | "flex" | "office" | "retail";
  rentPerSf: number;
  leaseType: "nnn" | "nn" | "gross";
  leaseTerm: number;
  escalator: number;
  tenantCredit: "ig" | "strong" | "mid" | "sub";
  missionCritical: "yes" | "partial" | "no";
  ltv: number;
  rate: number;
  amort: number;
  loanTerm: number;
  managementPct: number;
  structuralReservePerSf: number;
  vacancy: number;
  exitCapRate: number;
}

export interface NNNResult {
  baseRentAnnual: number;
  noiAnnual: number;
  noiMonthly: number;
  landlordExpenses: number;
  loan: number;
  equity: number;
  debtServiceAnnual: number;
  cashflowAnnual: number;
  cashflowMonthly: number;
  goingInCapRate: number;
  cocReturn: number;
  dscr: number;
  pricePerSf: number;
  exitValue: number;
  appreciation: number;
  leaseStrength: number;
  verdict: NNNVerdict;
}

export type NNNVerdict =
  | "ACQUIRE"
  | "ACQUIRE / CLEAN UP"
  | "NEGOTIATE"
  | "PASS / REWORK"
  | "HARD PASS";
