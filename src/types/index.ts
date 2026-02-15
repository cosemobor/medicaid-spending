export type ViewTab = 'overview' | 'procedures' | 'states' | 'providers' | 'anomalies';

export type SortDir = 'asc' | 'desc';

export interface MonthlyNational {
  month: string;
  totalPaid: number;
  totalClaims: number;
  totalBeneficiaries: number;
  providerCount: number | null;
  procedureCount: number | null;
  avgCostPerClaim: number | null;
  avgCostPerBeneficiary: number | null;
}

export interface ProcedureSummary {
  hcpcsCode: string;
  category: string;
  description?: string | null;
  totalPaid: number;
  totalClaims: number;
  totalBeneficiaries: number;
  providerCount: number;
  avgCostPerClaim: number | null;
  medianCostPerClaim: number | null;
  avgCostPerBeneficiary: number | null;
  claimsPerBeneficiary: number | null;
}

export interface ProviderSummary {
  npi: string;
  name?: string | null;
  state: string | null;
  totalPaid: number;
  totalClaims: number;
  totalBeneficiaries: number;
  procedureCount: number;
  avgCostPerClaim: number | null;
  avgCostPerBeneficiary: number | null;
  topProcedure: string | null;
  topProcedurePaid: number | null;
  spendingGrowthPct: number | null;
  costPerClaimGrowthPct: number | null;
  volumeGrowthPct: number | null;
  avgCostIndex?: number | null;
  lat: number | null;
  lng: number | null;
}

export interface StateSummary {
  state: string;
  totalPaid: number;
  totalClaims: number;
  totalBeneficiaries: number;
  providerCount: number;
  procedureCount: number;
  avgCostPerClaim: number | null;
  avgCostPerBeneficiary: number | null;
  claimsPerBeneficiary: number | null;
}

export interface ProcedureMonthly {
  hcpcsCode: string;
  month: string;
  totalPaid: number;
  totalClaims: number;
  totalBeneficiaries: number;
  avgCostPerClaim: number | null;
  avgCostPerBeneficiary: number | null;
  providerCount: number | null;
}

export interface ProviderProcedure {
  npi: string;
  hcpcsCode: string;
  totalPaid: number;
  totalClaims: number;
  totalBeneficiaries: number;
  costPerClaim: number | null;
  costPerBeneficiary: number | null;
  procedureMedianCostPerClaim: number | null;
  costIndex: number | null;
  state: string | null;
  providerName?: string | null;
}

export interface ProviderMonthly {
  npi: string;
  month: string;
  totalPaid: number;
  totalClaims: number;
  totalBeneficiaries: number;
  avgCostPerClaim: number | null;
  procedureCount: number | null;
}

export interface StateMonthly {
  state: string;
  month: string;
  totalPaid: number;
  totalClaims: number;
  totalBeneficiaries: number;
  avgCostPerClaim: number | null;
  avgCostPerBeneficiary: number | null;
}

export interface StateProcedure {
  state: string;
  hcpcsCode: string;
  totalPaid: number;
  totalClaims: number;
  totalBeneficiaries: number;
  avgCostPerClaim: number | null;
  providerCount: number | null;
}

export interface Outlier {
  npi: string;
  state: string | null;
  hcpcsCode: string;
  totalPaid: number;
  totalClaims: number;
  totalBeneficiaries: number;
  costPerClaim: number | null;
  procedureMedian: number | null;
  costIndex: number | null;
  providerName?: string | null;
  hcpcsDescription?: string | null;
}
