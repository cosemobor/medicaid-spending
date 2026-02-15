/**
 * Ingest pre-processed JSON data into Turso database.
 *
 * Usage:
 *   npx tsx scripts/ingest-medicaid.ts
 *
 * Requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN env vars.
 * Reads JSON files from data/ directory.
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import * as schema from '../src/lib/db/schema';

const DATA_DIR = path.join(__dirname, '..', 'data');

function loadJson<T>(filename: string): T[] {
  const filepath = path.join(DATA_DIR, filename);
  if (!existsSync(filepath)) {
    console.log(`  Skipping ${filename} (not found)`);
    return [];
  }
  const data = JSON.parse(readFileSync(filepath, 'utf-8'));
  console.log(`  Loaded ${filename}: ${data.length.toLocaleString()} rows`);
  return data;
}

async function insertBatch<T extends Record<string, unknown>>(
  db: ReturnType<typeof drizzle>,
  table: any,
  rows: T[],
  batchSize = 100
) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await db.insert(table).values(batch);
    if ((i + batchSize) % 1000 === 0 || i + batchSize >= rows.length) {
      process.stdout.write(`\r    Inserted ${Math.min(i + batchSize, rows.length).toLocaleString()} / ${rows.length.toLocaleString()}`);
    }
  }
  process.stdout.write('\n');
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set.');
    console.error('Create a database at https://turso.tech and set these env vars.');
    process.exit(1);
  }

  console.log('Connecting to Turso...');
  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema });

  // Drop and recreate tables for schema changes
  console.log('\nDropping existing tables...');
  await client.executeMultiple(`
    DROP TABLE IF EXISTS monthly_national;
    DROP TABLE IF EXISTS procedures;
    DROP TABLE IF EXISTS providers;
    DROP TABLE IF EXISTS states;
    DROP TABLE IF EXISTS procedure_monthly;
    DROP TABLE IF EXISTS provider_procedures;
    DROP TABLE IF EXISTS state_monthly;
    DROP TABLE IF EXISTS state_procedures;
    DROP TABLE IF EXISTS provider_monthly;
    DROP TABLE IF EXISTS outliers;
  `);

  console.log('Creating tables...');
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS monthly_national (
      month TEXT PRIMARY KEY,
      total_paid REAL NOT NULL,
      total_claims INTEGER NOT NULL,
      total_beneficiaries INTEGER NOT NULL,
      provider_count INTEGER,
      procedure_count INTEGER,
      avg_cost_per_claim REAL,
      avg_cost_per_beneficiary REAL
    );

    CREATE TABLE IF NOT EXISTS procedures (
      hcpcs_code TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      description TEXT,
      total_paid REAL NOT NULL,
      total_claims INTEGER NOT NULL,
      total_beneficiaries INTEGER NOT NULL,
      provider_count INTEGER NOT NULL,
      avg_cost_per_claim REAL,
      median_cost_per_claim REAL,
      avg_cost_per_beneficiary REAL,
      claims_per_beneficiary REAL
    );

    CREATE TABLE IF NOT EXISTS providers (
      npi TEXT PRIMARY KEY,
      name TEXT,
      state TEXT,
      total_paid REAL NOT NULL,
      total_claims INTEGER NOT NULL,
      total_beneficiaries INTEGER NOT NULL,
      procedure_count INTEGER NOT NULL,
      avg_cost_per_claim REAL,
      avg_cost_per_beneficiary REAL,
      top_procedure TEXT,
      top_procedure_paid REAL,
      spending_growth_pct REAL,
      cost_per_claim_growth_pct REAL,
      volume_growth_pct REAL,
      lat REAL,
      lng REAL
    );

    CREATE TABLE IF NOT EXISTS states (
      state TEXT PRIMARY KEY,
      total_paid REAL NOT NULL,
      total_claims INTEGER NOT NULL,
      total_beneficiaries INTEGER NOT NULL,
      provider_count INTEGER NOT NULL,
      procedure_count INTEGER NOT NULL,
      avg_cost_per_claim REAL,
      avg_cost_per_beneficiary REAL,
      claims_per_beneficiary REAL
    );

    CREATE TABLE IF NOT EXISTS procedure_monthly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hcpcs_code TEXT NOT NULL,
      month TEXT NOT NULL,
      total_paid REAL NOT NULL,
      total_claims INTEGER NOT NULL,
      total_beneficiaries INTEGER NOT NULL,
      avg_cost_per_claim REAL,
      avg_cost_per_beneficiary REAL,
      provider_count INTEGER
    );

    CREATE TABLE IF NOT EXISTS provider_procedures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      npi TEXT NOT NULL,
      hcpcs_code TEXT NOT NULL,
      total_paid REAL NOT NULL,
      total_claims INTEGER NOT NULL,
      total_beneficiaries INTEGER NOT NULL,
      cost_per_claim REAL,
      cost_per_beneficiary REAL,
      procedure_median_cost_per_claim REAL,
      cost_index REAL,
      state TEXT,
      provider_name TEXT
    );

    CREATE TABLE IF NOT EXISTS state_monthly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state TEXT NOT NULL,
      month TEXT NOT NULL,
      total_paid REAL NOT NULL,
      total_claims INTEGER NOT NULL,
      total_beneficiaries INTEGER NOT NULL,
      avg_cost_per_claim REAL,
      avg_cost_per_beneficiary REAL
    );

    CREATE TABLE IF NOT EXISTS state_procedures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state TEXT NOT NULL,
      hcpcs_code TEXT NOT NULL,
      total_paid REAL NOT NULL,
      total_claims INTEGER NOT NULL,
      total_beneficiaries INTEGER NOT NULL,
      avg_cost_per_claim REAL,
      provider_count INTEGER
    );

    CREATE TABLE IF NOT EXISTS provider_monthly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      npi TEXT NOT NULL,
      month TEXT NOT NULL,
      total_paid REAL NOT NULL,
      total_claims INTEGER NOT NULL,
      total_beneficiaries INTEGER NOT NULL,
      avg_cost_per_claim REAL,
      procedure_count INTEGER
    );

    CREATE TABLE IF NOT EXISTS outliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      npi TEXT NOT NULL,
      state TEXT,
      hcpcs_code TEXT NOT NULL,
      total_paid REAL NOT NULL,
      total_claims INTEGER NOT NULL,
      total_beneficiaries INTEGER NOT NULL,
      cost_per_claim REAL,
      procedure_median REAL,
      cost_index REAL,
      provider_name TEXT,
      hcpcs_description TEXT
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      event_data TEXT,
      page TEXT,
      timestamp TEXT NOT NULL
    );
  `);

  // Load NPI state, name, and lat/lng mappings (prefer full NPPES extract, fallback to API lookups)
  let npiStateMap: Record<string, string> = {};
  let npiNameMap: Record<string, string> = {};
  let npiLatMap: Record<string, number> = {};
  let npiLngMap: Record<string, number> = {};
  const npiFullPath = path.join(DATA_DIR, 'npi-lookup-full.json');
  const npiStatesPath = path.join(DATA_DIR, 'npi-states.json');
  if (existsSync(npiFullPath)) {
    const fullData: Record<string, { state: string; name: string; lat?: number | null; lng?: number | null }> = JSON.parse(readFileSync(npiFullPath, 'utf-8'));
    for (const [npi, info] of Object.entries(fullData)) {
      if (info.state) npiStateMap[npi] = info.state;
      if (info.name) npiNameMap[npi] = info.name;
      if (info.lat != null) npiLatMap[npi] = info.lat;
      if (info.lng != null) npiLngMap[npi] = info.lng;
    }
    console.log(`  Loaded full NPI mappings: ${Object.keys(npiStateMap).length} states, ${Object.keys(npiNameMap).length} names, ${Object.keys(npiLatMap).length} with lat/lng`);
  }
  if (existsSync(npiStatesPath)) {
    const npiStates = JSON.parse(readFileSync(npiStatesPath, 'utf-8'));
    // API lookups can supplement/override full NPPES data for top providers
    for (const entry of (Array.isArray(npiStates) ? npiStates : Object.values(npiStates)) as any[]) {
      if (entry.npi && entry.state && !npiStateMap[entry.npi]) {
        npiStateMap[entry.npi] = entry.state;
      }
      if (entry.npi && entry.name && !npiNameMap[entry.npi]) {
        npiNameMap[entry.npi] = entry.name;
      }
    }
    console.log(`  After API merge: ${Object.keys(npiStateMap).length} states, ${Object.keys(npiNameMap).length} names`);
  }

  // Load HCPCS description mapping
  const hcpcsDescPath = path.join(DATA_DIR, 'hcpcs-descriptions.json');
  let hcpcsDescMap: Record<string, string> = {};
  if (existsSync(hcpcsDescPath)) {
    const descriptions = JSON.parse(readFileSync(hcpcsDescPath, 'utf-8'));
    for (const entry of descriptions as any[]) {
      if (entry.code && (entry.shortDesc || entry.longDesc)) {
        hcpcsDescMap[entry.code] = entry.shortDesc || entry.longDesc;
      }
    }
    console.log(`  Loaded HCPCS descriptions: ${Object.keys(hcpcsDescMap).length}`);
  }

  // Merge manual CPT descriptions (fills in numeric CPT codes not in NLM API)
  const cptManualPath = path.join(DATA_DIR, 'cpt-descriptions-manual.json');
  if (existsSync(cptManualPath)) {
    const manual = JSON.parse(readFileSync(cptManualPath, 'utf-8'));
    let added = 0;
    for (const entry of manual as any[]) {
      if (entry.code && entry.shortDesc && !hcpcsDescMap[entry.code]) {
        hcpcsDescMap[entry.code] = entry.shortDesc;
        added++;
      }
    }
    console.log(`  Added ${added} manual CPT descriptions (total: ${Object.keys(hcpcsDescMap).length})`);
  }

  // Load and insert data
  console.log('\nLoading data...');

  const monthlyNational = loadJson<any>('monthly-national.json');
  const procedureSummary = loadJson<any>('procedure-summary.json');
  const providerSummary = loadJson<any>('provider-summary.json');
  // Merge NPI states into provider summary
  for (const p of providerSummary) {
    if (!p.state && npiStateMap[p.npi]) {
      p.state = npiStateMap[p.npi];
    }
  }
  const withState = providerSummary.filter((p: any) => p.state).length;
  console.log(`  Providers with state data: ${withState} / ${providerSummary.length}`);

  let stateSummary = loadJson<any>('state-summary.json');

  // If no state-summary.json, generate from provider data
  if (stateSummary.length === 0 && withState > 0) {
    console.log('  Generating state summary from provider data...');
    const stateAgg: Record<string, any> = {};
    for (const p of providerSummary) {
      if (!p.state) continue;
      if (!stateAgg[p.state]) {
        stateAgg[p.state] = {
          state: p.state,
          totalPaid: 0,
          totalClaims: 0,
          totalBeneficiaries: 0,
          providerCount: 0,
          procedureCount: 0,
        };
      }
      const s = stateAgg[p.state];
      s.totalPaid += p.totalPaid;
      s.totalClaims += p.totalClaims;
      s.totalBeneficiaries += p.totalBeneficiaries;
      s.providerCount += 1;
      s.procedureCount += p.procedureCount;
    }
    stateSummary = Object.values(stateAgg).map((s: any) => ({
      ...s,
      avgCostPerClaim: s.totalClaims > 0 ? s.totalPaid / s.totalClaims : null,
      avgCostPerBeneficiary: s.totalBeneficiaries > 0 ? s.totalPaid / s.totalBeneficiaries : null,
      claimsPerBeneficiary: s.totalBeneficiaries > 0 ? s.totalClaims / s.totalBeneficiaries : null,
    }));
    console.log(`  Generated state summaries: ${stateSummary.length} states`);
  }
  const procedureMonthly = loadJson<any>('procedure-monthly.json');
  const providerProcedures = loadJson<any>('provider-procedures.json');
  // Merge NPI states into provider procedures too
  for (const pp of providerProcedures) {
    if (!pp.state && npiStateMap[pp.npi]) {
      pp.state = npiStateMap[pp.npi];
    }
  }

  const stateMonthlyData = loadJson<any>('state-monthly.json');
  const stateProcData = loadJson<any>('state-procedures.json');
  const providerMonthly = loadJson<any>('provider-monthly.json');
  const outlierData = loadJson<any>('outliers.json');
  // Merge NPI states into outliers
  for (const o of outlierData) {
    if (!o.state && npiStateMap[o.npi]) {
      o.state = npiStateMap[o.npi];
    }
  }

  console.log('\nInserting data...');

  if (monthlyNational.length > 0) {
    console.log('  Monthly national...');
    await insertBatch(db, schema.monthlyNational, monthlyNational.map((r: any) => ({
      month: r.month,
      totalPaid: r.totalPaid,
      totalClaims: r.totalClaims,
      totalBeneficiaries: r.totalBeneficiaries,
      providerCount: r.providerCount ?? 0,
      procedureCount: r.procedureCount ?? 0,
      avgCostPerClaim: r.avgCostPerClaim,
      avgCostPerBeneficiary: r.avgCostPerBeneficiary,
    })));
  }

  if (procedureSummary.length > 0) {
    console.log('  Procedures...');
    await insertBatch(db, schema.procedures, procedureSummary.map((r: any) => ({
      hcpcsCode: r.hcpcsCode,
      category: r.category,
      description: hcpcsDescMap[r.hcpcsCode] ?? null,
      totalPaid: r.totalPaid,
      totalClaims: r.totalClaims,
      totalBeneficiaries: r.totalBeneficiaries,
      providerCount: r.providerCount ?? 0,
      avgCostPerClaim: r.avgCostPerClaim,
      medianCostPerClaim: r.medianCostPerClaim,
      avgCostPerBeneficiary: r.avgCostPerBeneficiary,
      claimsPerBeneficiary: r.claimsPerBeneficiary,
    })));
  }

  if (providerSummary.length > 0) {
    console.log('  Providers...');
    await insertBatch(db, schema.providers, providerSummary.map((r: any) => ({
      npi: r.npi,
      name: npiNameMap[r.npi] ?? null,
      state: r.state,
      totalPaid: r.totalPaid,
      totalClaims: r.totalClaims,
      totalBeneficiaries: r.totalBeneficiaries,
      procedureCount: r.procedureCount,
      avgCostPerClaim: r.avgCostPerClaim,
      avgCostPerBeneficiary: r.avgCostPerBeneficiary,
      topProcedure: r.topProcedure,
      topProcedurePaid: r.topProcedurePaid,
      spendingGrowthPct: r.spendingGrowthPct,
      costPerClaimGrowthPct: r.costPerClaimGrowthPct,
      volumeGrowthPct: r.volumeGrowthPct,
      lat: npiLatMap[r.npi] ?? null,
      lng: npiLngMap[r.npi] ?? null,
    })));
  }

  if (stateSummary.length > 0) {
    console.log('  States...');
    await insertBatch(db, schema.states, stateSummary.map((r: any) => ({
      state: r.state,
      totalPaid: r.totalPaid,
      totalClaims: r.totalClaims,
      totalBeneficiaries: r.totalBeneficiaries,
      providerCount: r.providerCount,
      procedureCount: r.procedureCount ?? 0,
      avgCostPerClaim: r.avgCostPerClaim,
      avgCostPerBeneficiary: r.avgCostPerBeneficiary,
      claimsPerBeneficiary: r.claimsPerBeneficiary,
    })));
  }

  if (stateMonthlyData.length > 0) {
    console.log('  State monthly...');
    await insertBatch(db, schema.stateMonthly, stateMonthlyData.map((r: any) => ({
      state: r.state,
      month: r.month,
      totalPaid: r.totalPaid,
      totalClaims: r.totalClaims,
      totalBeneficiaries: r.totalBeneficiaries,
      avgCostPerClaim: r.avgCostPerClaim,
      avgCostPerBeneficiary: r.avgCostPerBeneficiary,
    })));
  }

  if (stateProcData.length > 0) {
    console.log('  State procedures...');
    await insertBatch(db, schema.stateProcedures, stateProcData.map((r: any) => ({
      state: r.state,
      hcpcsCode: r.hcpcsCode,
      totalPaid: r.totalPaid,
      totalClaims: r.totalClaims,
      totalBeneficiaries: r.totalBeneficiaries,
      avgCostPerClaim: r.avgCostPerClaim,
      providerCount: r.providerCount,
    })));
  }

  if (procedureMonthly.length > 0) {
    console.log('  Procedure monthly...');
    await insertBatch(db, schema.procedureMonthly, procedureMonthly.map((r: any) => ({
      hcpcsCode: r.hcpcsCode,
      month: r.month,
      totalPaid: r.totalPaid,
      totalClaims: r.totalClaims,
      totalBeneficiaries: r.totalBeneficiaries,
      avgCostPerClaim: r.avgCostPerClaim,
      avgCostPerBeneficiary: r.avgCostPerBeneficiary,
      providerCount: r.providerCount,
    })));
  }

  if (providerProcedures.length > 0) {
    console.log('  Provider procedures...');
    await insertBatch(db, schema.providerProcedures, providerProcedures.map((r: any) => ({
      npi: r.npi,
      hcpcsCode: r.hcpcsCode,
      totalPaid: r.totalPaid,
      totalClaims: r.totalClaims,
      totalBeneficiaries: r.totalBeneficiaries,
      costPerClaim: r.costPerClaim,
      costPerBeneficiary: r.costPerBeneficiary,
      procedureMedianCostPerClaim: r.procedureMedianCostPerClaim,
      costIndex: r.costIndex,
      state: r.state,
      providerName: npiNameMap[r.npi] ?? null,
    })));
  }

  if (providerMonthly.length > 0) {
    console.log('  Provider monthly...');
    await insertBatch(db, schema.providerMonthly, providerMonthly.map((r: any) => ({
      npi: r.npi,
      month: r.month,
      totalPaid: r.totalPaid,
      totalClaims: r.totalClaims,
      totalBeneficiaries: r.totalBeneficiaries,
      avgCostPerClaim: r.avgCostPerClaim,
      procedureCount: r.procedureCount,
    })));
  }

  if (outlierData.length > 0) {
    console.log('  Outliers...');
    await insertBatch(db, schema.outliers, outlierData.map((r: any) => ({
      npi: r.npi,
      state: r.state,
      hcpcsCode: r.hcpcsCode,
      totalPaid: r.totalPaid,
      totalClaims: r.totalClaims,
      totalBeneficiaries: r.totalBeneficiaries,
      costPerClaim: r.costPerClaim,
      procedureMedian: r.procedureMedian,
      costIndex: r.costIndex,
      providerName: npiNameMap[r.npi] ?? null,
      hcpcsDescription: hcpcsDescMap[r.hcpcsCode] ?? null,
    })));
  }

  // Create indexes
  console.log('\nCreating indexes...');
  await client.executeMultiple(`
    CREATE INDEX IF NOT EXISTS idx_procedures_category ON procedures(category);
    CREATE INDEX IF NOT EXISTS idx_procedures_paid ON procedures(total_paid);
    CREATE INDEX IF NOT EXISTS idx_providers_state ON providers(state);
    CREATE INDEX IF NOT EXISTS idx_providers_paid ON providers(total_paid);
    CREATE INDEX IF NOT EXISTS idx_proc_monthly_code ON procedure_monthly(hcpcs_code);
    CREATE INDEX IF NOT EXISTS idx_proc_monthly_code_month ON procedure_monthly(hcpcs_code, month);
    CREATE INDEX IF NOT EXISTS idx_pp_code ON provider_procedures(hcpcs_code);
    CREATE INDEX IF NOT EXISTS idx_pp_npi ON provider_procedures(npi);
    CREATE INDEX IF NOT EXISTS idx_state_monthly_state ON state_monthly(state);
    CREATE INDEX IF NOT EXISTS idx_sp_state ON state_procedures(state);
    CREATE INDEX IF NOT EXISTS idx_pm_npi ON provider_monthly(npi);
    CREATE INDEX IF NOT EXISTS idx_outliers_code ON outliers(hcpcs_code);
    CREATE INDEX IF NOT EXISTS idx_outliers_npi ON outliers(npi);
    CREATE INDEX IF NOT EXISTS idx_outliers_index ON outliers(cost_index);
  `);

  console.log('\n=== Ingestion Complete ===');
  console.log(`Monthly national: ${monthlyNational.length}`);
  console.log(`Procedures: ${procedureSummary.length}`);
  console.log(`Providers: ${providerSummary.length}`);
  console.log(`States: ${stateSummary.length}`);
  console.log(`State monthly: ${stateMonthlyData.length}`);
  console.log(`State procedures: ${stateProcData.length}`);
  console.log(`Procedure monthly: ${procedureMonthly.length}`);
  console.log(`Provider procedures: ${providerProcedures.length}`);
  console.log(`Provider monthly: ${providerMonthly.length}`);
  console.log(`Outliers: ${outlierData.length}`);

  client.close();
}

main().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
