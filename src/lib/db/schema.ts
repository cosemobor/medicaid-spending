import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

export const procedures = sqliteTable('procedures', {
  hcpcsCode: text('hcpcs_code').primaryKey(),
  category: text('category').notNull(),
  description: text('description'),
  totalPaid: real('total_paid').notNull(),
  totalClaims: integer('total_claims').notNull(),
  totalBeneficiaries: integer('total_beneficiaries').notNull(),
  providerCount: integer('provider_count').notNull(),
  avgCostPerClaim: real('avg_cost_per_claim'),
  medianCostPerClaim: real('median_cost_per_claim'),
  avgCostPerBeneficiary: real('avg_cost_per_beneficiary'),
  claimsPerBeneficiary: real('claims_per_beneficiary'),
}, (table) => [
  index('idx_procedures_category').on(table.category),
  index('idx_procedures_paid').on(table.totalPaid),
]);

export const providers = sqliteTable('providers', {
  npi: text('npi').primaryKey(),
  name: text('name'),
  state: text('state'),
  totalPaid: real('total_paid').notNull(),
  totalClaims: integer('total_claims').notNull(),
  totalBeneficiaries: integer('total_beneficiaries').notNull(),
  procedureCount: integer('procedure_count').notNull(),
  avgCostPerClaim: real('avg_cost_per_claim'),
  avgCostPerBeneficiary: real('avg_cost_per_beneficiary'),
  topProcedure: text('top_procedure'),
  topProcedurePaid: real('top_procedure_paid'),
  spendingGrowthPct: real('spending_growth_pct'),
  costPerClaimGrowthPct: real('cost_per_claim_growth_pct'),
  volumeGrowthPct: real('volume_growth_pct'),
  lat: real('lat'),
  lng: real('lng'),
}, (table) => [
  index('idx_providers_state').on(table.state),
  index('idx_providers_paid').on(table.totalPaid),
]);

export const states = sqliteTable('states', {
  state: text('state').primaryKey(),
  totalPaid: real('total_paid').notNull(),
  totalClaims: integer('total_claims').notNull(),
  totalBeneficiaries: integer('total_beneficiaries').notNull(),
  providerCount: integer('provider_count').notNull(),
  procedureCount: integer('procedure_count').notNull(),
  avgCostPerClaim: real('avg_cost_per_claim'),
  avgCostPerBeneficiary: real('avg_cost_per_beneficiary'),
  claimsPerBeneficiary: real('claims_per_beneficiary'),
});

export const monthlyNational = sqliteTable('monthly_national', {
  month: text('month').primaryKey(),
  totalPaid: real('total_paid').notNull(),
  totalClaims: integer('total_claims').notNull(),
  totalBeneficiaries: integer('total_beneficiaries').notNull(),
  providerCount: integer('provider_count'),
  procedureCount: integer('procedure_count'),
  avgCostPerClaim: real('avg_cost_per_claim'),
  avgCostPerBeneficiary: real('avg_cost_per_beneficiary'),
});

export const procedureMonthly = sqliteTable('procedure_monthly', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  hcpcsCode: text('hcpcs_code').notNull(),
  month: text('month').notNull(),
  totalPaid: real('total_paid').notNull(),
  totalClaims: integer('total_claims').notNull(),
  totalBeneficiaries: integer('total_beneficiaries').notNull(),
  avgCostPerClaim: real('avg_cost_per_claim'),
  avgCostPerBeneficiary: real('avg_cost_per_beneficiary'),
  providerCount: integer('provider_count'),
}, (table) => [
  index('idx_proc_monthly_code').on(table.hcpcsCode),
  index('idx_proc_monthly_code_month').on(table.hcpcsCode, table.month),
]);

export const providerProcedures = sqliteTable('provider_procedures', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  npi: text('npi').notNull(),
  hcpcsCode: text('hcpcs_code').notNull(),
  totalPaid: real('total_paid').notNull(),
  totalClaims: integer('total_claims').notNull(),
  totalBeneficiaries: integer('total_beneficiaries').notNull(),
  costPerClaim: real('cost_per_claim'),
  costPerBeneficiary: real('cost_per_beneficiary'),
  procedureMedianCostPerClaim: real('procedure_median_cost_per_claim'),
  costIndex: real('cost_index'),
  state: text('state'),
  providerName: text('provider_name'),
}, (table) => [
  index('idx_pp_code').on(table.hcpcsCode),
  index('idx_pp_npi').on(table.npi),
]);

export const stateMonthly = sqliteTable('state_monthly', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  state: text('state').notNull(),
  month: text('month').notNull(),
  totalPaid: real('total_paid').notNull(),
  totalClaims: integer('total_claims').notNull(),
  totalBeneficiaries: integer('total_beneficiaries').notNull(),
  avgCostPerClaim: real('avg_cost_per_claim'),
  avgCostPerBeneficiary: real('avg_cost_per_beneficiary'),
}, (table) => [
  index('idx_state_monthly_state').on(table.state),
]);

export const stateProcedures = sqliteTable('state_procedures', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  state: text('state').notNull(),
  hcpcsCode: text('hcpcs_code').notNull(),
  totalPaid: real('total_paid').notNull(),
  totalClaims: integer('total_claims').notNull(),
  totalBeneficiaries: integer('total_beneficiaries').notNull(),
  avgCostPerClaim: real('avg_cost_per_claim'),
  providerCount: integer('provider_count'),
}, (table) => [
  index('idx_sp_state').on(table.state),
]);

export const providerMonthly = sqliteTable('provider_monthly', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  npi: text('npi').notNull(),
  month: text('month').notNull(),
  totalPaid: real('total_paid').notNull(),
  totalClaims: integer('total_claims').notNull(),
  totalBeneficiaries: integer('total_beneficiaries').notNull(),
  avgCostPerClaim: real('avg_cost_per_claim'),
  procedureCount: integer('procedure_count'),
}, (table) => [
  index('idx_pm_npi').on(table.npi),
]);

export const outliers = sqliteTable('outliers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  npi: text('npi').notNull(),
  state: text('state'),
  hcpcsCode: text('hcpcs_code').notNull(),
  totalPaid: real('total_paid').notNull(),
  totalClaims: integer('total_claims').notNull(),
  totalBeneficiaries: integer('total_beneficiaries').notNull(),
  costPerClaim: real('cost_per_claim'),
  procedureMedian: real('procedure_median'),
  costIndex: real('cost_index'),
  providerName: text('provider_name'),
  hcpcsDescription: text('hcpcs_description'),
}, (table) => [
  index('idx_outliers_code').on(table.hcpcsCode),
  index('idx_outliers_npi').on(table.npi),
  index('idx_outliers_index').on(table.costIndex),
]);

export const analyticsEvents = sqliteTable('analytics_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull(),
  eventType: text('event_type').notNull(),
  eventData: text('event_data'),
  page: text('page'),
  timestamp: text('timestamp').notNull(),
}, (table) => [
  index('idx_analytics_session').on(table.sessionId),
  index('idx_analytics_type').on(table.eventType),
  index('idx_analytics_timestamp').on(table.timestamp),
]);
