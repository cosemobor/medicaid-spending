/**
 * Process raw Medicaid provider spending CSV into pre-aggregated JSON files.
 *
 * Uses multi-pass streaming to process 227M rows within memory limits.
 * Pass 1: Lightweight totals (procedures, providers, months)
 * Pass 2: Targeted detail data for top procedures/providers
 *
 * Usage:
 *   NODE_OPTIONS=--max-old-space-size=6144 npx tsx scripts/process-medicaid.ts
 *
 * Reads:  medicaid-provider-spending.csv
 * Writes: data/*.json
 */

import { createReadStream, writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { createInterface } from 'readline';
import path from 'path';

const CSV_PATH = path.join(__dirname, '..', 'medicaid-provider-spending.csv');
const DATA_DIR = path.join(__dirname, '..', 'data');
const NPI_STATES_PATH = path.join(DATA_DIR, 'npi-states.json');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// --- HCPCS Category mapping ---

function getHcpcsCategory(code: string): string {
  if (!code) return 'Other';
  const first = code.charAt(0);
  if (first >= 'A' && first <= 'V') {
    if (first === 'A') return 'Transport & DME';
    if (first === 'B') return 'Enteral/Parenteral';
    if (first === 'C') return 'Outpatient Hospital';
    if (first === 'D') return 'Dental';
    if (first === 'E') return 'DME';
    if (first === 'G') return 'Procedures/Services';
    if (first === 'H') return 'Behavioral Health';
    if (first === 'J') return 'Drugs';
    if (first === 'K') return 'DME';
    if (first === 'L') return 'Orthotics/Prosthetics';
    if (first === 'M') return 'Quality Measures';
    if (first === 'P') return 'Pathology/Lab';
    if (first === 'Q') return 'Temporary Codes';
    if (first === 'R') return 'Radiology';
    if (first === 'S') return 'Private Payer';
    if (first === 'T') return 'State Medicaid';
    if (first === 'V') return 'Vision/Hearing';
    return 'Other Level II';
  }
  const num = parseInt(code.substring(0, 5), 10);
  if (isNaN(num)) return 'Other';
  if (num >= 99201 && num <= 99499) return 'E&M';
  if (num >= 10000 && num <= 69999) return 'Surgery';
  if (num >= 70000 && num <= 79999) return 'Radiology';
  if (num >= 80000 && num <= 89999) return 'Pathology/Lab';
  if (num >= 90000 && num <= 99199) return 'Medicine';
  if (num >= 0 && num <= 9999) return 'E&M';
  return 'Other';
}

// --- Helpers ---

function writeJson(filename: string, data: unknown) {
  const filepath = path.join(DATA_DIR, filename);
  writeFileSync(filepath, JSON.stringify(data));
  console.log(`  ${filename}: ${Array.isArray(data) ? data.length.toLocaleString() + ' rows' : 'written'}`);
}

function median(arr: number[]): number | null {
  if (arr.length === 0) return null;
  const sorted = arr.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function createLineReader() {
  return createInterface({
    input: createReadStream(CSV_PATH, { highWaterMark: 512 * 1024 }),
    crlfDelay: Infinity,
  });
}

const MID_DATE = '2021-07';

// ============================================================================
// PASS 1: Lightweight totals — procedures, providers (flat numbers), months
// ============================================================================

async function pass1() {
  console.log('\n=== PASS 1: Building totals ===');
  const startTime = Date.now();

  // Procedure: hcpcsCode → {paid, claims, bene}
  const procMap = new Map<string, { paid: number; claims: number; bene: number }>();

  // Provider: npi → {paid, claims, bene, earlyPaid, latePaid, earlyClaims, lateClaims, procCount}
  // procCount tracks unique procedures via a simple hash
  const providerMap = new Map<string, {
    paid: number; claims: number; bene: number;
    earlyPaid: number; latePaid: number; earlyClaims: number; lateClaims: number;
    procCount: number; lastProc: string;
  }>();

  // Month: month → {paid, claims, bene}
  const monthMap = new Map<string, { paid: number; claims: number; bene: number }>();

  let rowCount = 0;
  let isHeader = true;
  const rl = createLineReader();

  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; }
    const parts = line.split(',');
    if (parts.length < 7) continue;

    const npi = parts[0];
    const hcpcs = parts[2];
    const month = parts[3];
    const bene = parseInt(parts[4], 10) || 0;
    const claims = parseInt(parts[5], 10) || 0;
    const paid = parseFloat(parts[6]) || 0;

    rowCount++;
    if (rowCount % 10_000_000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0);
      console.log(`  ${(rowCount / 1_000_000).toFixed(0)}M rows (${elapsed}s, ${mem}MB heap)`);
    }

    // Procedure totals
    let proc = procMap.get(hcpcs);
    if (!proc) { proc = { paid: 0, claims: 0, bene: 0 }; procMap.set(hcpcs, proc); }
    proc.paid += paid;
    proc.claims += claims;
    proc.bene += bene;

    // Provider totals (no Sets — just flat numbers)
    let prov = providerMap.get(npi);
    if (!prov) {
      prov = { paid: 0, claims: 0, bene: 0, earlyPaid: 0, latePaid: 0, earlyClaims: 0, lateClaims: 0, procCount: 0, lastProc: '' };
      providerMap.set(npi, prov);
    }
    prov.paid += paid;
    prov.claims += claims;
    prov.bene += bene;
    if (month < MID_DATE) { prov.earlyPaid += paid; prov.earlyClaims += claims; }
    else { prov.latePaid += paid; prov.lateClaims += claims; }
    // Approximate procedure count: increment when we see a new procedure
    if (hcpcs !== prov.lastProc) { prov.procCount++; prov.lastProc = hcpcs; }

    // Month totals
    let mo = monthMap.get(month);
    if (!mo) { mo = { paid: 0, claims: 0, bene: 0 }; monthMap.set(month, mo); }
    mo.paid += paid;
    mo.claims += claims;
    mo.bene += bene;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\nPass 1 complete: ${rowCount.toLocaleString()} rows in ${elapsed}s`);
  console.log(`  Procedures: ${procMap.size.toLocaleString()}`);
  console.log(`  Providers: ${providerMap.size.toLocaleString()}`);
  console.log(`  Months: ${monthMap.size}`);

  return { procMap, providerMap, monthMap, rowCount };
}

// ============================================================================
// PASS 2: Targeted detail — top procedures and providers only
// ============================================================================

async function pass2(
  topProcCodes: Set<string>,
  topProviderNpis: Set<string>,
  top1000Npis: Set<string>,
) {
  console.log('\n=== PASS 2: Building detail data ===');
  console.log(`  Tracking ${topProcCodes.size} procedures, ${topProviderNpis.size} providers, ${top1000Npis.size} for monthly`);
  const startTime = Date.now();

  // Procedure × Month (for top procedures only)
  const procMonthMap = new Map<string, { paid: number; claims: number; bene: number; providers: number }>();

  // Provider × Procedure (for top procedures only — to build dot plots)
  const provProcMap = new Map<string, { paid: number; claims: number; bene: number }>();

  // Provider monthly (for top 1000 providers only)
  const provMonthMap = new Map<string, { paid: number; claims: number; bene: number; procs: number }>();

  // Provider top procedure tracking (for top providers)
  const provTopProc = new Map<string, { proc: string; paid: number }>();

  // Provider procedure count (accurate count for top providers)
  const provProcSets = new Map<string, Set<string>>();

  // Cost per claim samples for median (per procedure, for top procedures)
  const procCpcSamples = new Map<string, number[]>();

  let rowCount = 0;
  let isHeader = true;
  const rl = createLineReader();

  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; }
    const parts = line.split(',');
    if (parts.length < 7) continue;

    const npi = parts[0];
    const hcpcs = parts[2];
    const month = parts[3];
    const bene = parseInt(parts[4], 10) || 0;
    const claims = parseInt(parts[5], 10) || 0;
    const paid = parseFloat(parts[6]) || 0;

    rowCount++;
    if (rowCount % 10_000_000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0);
      console.log(`  ${(rowCount / 1_000_000).toFixed(0)}M rows (${elapsed}s, ${mem}MB heap)`);
    }

    const isTopProc = topProcCodes.has(hcpcs);
    const isTopProvider = topProviderNpis.has(npi);
    const isTop1000 = top1000Npis.has(npi);

    // Skip rows that don't match any target
    if (!isTopProc && !isTopProvider && !isTop1000) continue;

    // Procedure × Month (top 100 procedures)
    if (isTopProc) {
      const pmKey = `${hcpcs}|${month}`;
      let pm = procMonthMap.get(pmKey);
      if (!pm) { pm = { paid: 0, claims: 0, bene: 0, providers: 0 }; procMonthMap.set(pmKey, pm); }
      pm.paid += paid;
      pm.claims += claims;
      pm.bene += bene;
      pm.providers++;

      // Provider × Procedure (for dot plots — track all providers for top procedures)
      const ppKey = `${npi}|${hcpcs}`;
      let pp = provProcMap.get(ppKey);
      if (!pp) { pp = { paid: 0, claims: 0, bene: 0 }; provProcMap.set(ppKey, pp); }
      pp.paid += paid;
      pp.claims += claims;
      pp.bene += bene;

      // Cost per claim samples
      if (claims > 0) {
        let samples = procCpcSamples.get(hcpcs);
        if (!samples) { samples = []; procCpcSamples.set(hcpcs, samples); }
        if (samples.length < 10000) {
          samples.push(paid / claims);
        }
      }
    }

    // Provider detail (top providers)
    if (isTopProvider) {
      // Top procedure tracking
      const existing = provTopProc.get(npi);
      if (!existing) {
        provTopProc.set(npi, { proc: hcpcs, paid });
      } else {
        // Accumulate per procedure — use a simplified approach
        if (hcpcs === existing.proc) {
          existing.paid += paid;
        } else if (paid > existing.paid * 0.5) {
          // This is a rough heuristic — we'll refine in pass 2 output
        }
      }

      // Accurate procedure count
      let procSet = provProcSets.get(npi);
      if (!procSet) { procSet = new Set(); provProcSets.set(npi, procSet); }
      procSet.add(hcpcs);

      // Also track provider-procedure for the provider detail dot plots
      if (!isTopProc) {
        // If not already tracked by the topProc logic above, track for this provider
        const ppKey = `${npi}|${hcpcs}`;
        let pp = provProcMap.get(ppKey);
        if (!pp) { pp = { paid: 0, claims: 0, bene: 0 }; provProcMap.set(ppKey, pp); }
        pp.paid += paid;
        pp.claims += claims;
        pp.bene += bene;
      }
    }

    // Provider monthly (top 1000)
    if (isTop1000) {
      const pmKey = `${npi}|${month}`;
      let entry = provMonthMap.get(pmKey);
      if (!entry) { entry = { paid: 0, claims: 0, bene: 0, procs: 0 }; provMonthMap.set(pmKey, entry); }
      entry.paid += paid;
      entry.claims += claims;
      entry.bene += bene;
      entry.procs++;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\nPass 2 complete: ${rowCount.toLocaleString()} rows in ${elapsed}s`);
  console.log(`  ProcMonth entries: ${procMonthMap.size.toLocaleString()}`);
  console.log(`  ProvProc entries: ${provProcMap.size.toLocaleString()}`);
  console.log(`  ProvMonthly entries: ${provMonthMap.size.toLocaleString()}`);

  return { procMonthMap, provProcMap, provMonthMap, provTopProc, provProcSets, procCpcSamples };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('Starting multi-pass processing of medicaid-provider-spending.csv...');

  // Load NPI → state mapping if available
  let npiStateMap = new Map<string, string>();
  if (existsSync(NPI_STATES_PATH)) {
    const data = JSON.parse(readFileSync(NPI_STATES_PATH, 'utf-8'));
    npiStateMap = new Map(data.filter((r: any) => r.state).map((r: any) => [r.npi, r.state]));
    console.log(`  Loaded ${npiStateMap.size.toLocaleString()} NPI → state mappings`);
  } else {
    console.log('  No NPI state mapping found. State analysis will be limited.');
  }

  // === PASS 1 ===
  const { procMap, providerMap, monthMap } = await pass1();

  // === Output: Monthly National ===
  console.log('\nBuilding output files...');
  console.log('\n1. Monthly national...');
  const monthlyNational = Array.from(monthMap.entries())
    .map(([month, m]) => ({
      month,
      totalPaid: Math.round(m.paid * 100) / 100,
      totalClaims: m.claims,
      totalBeneficiaries: m.bene,
      providerCount: 0, // We don't track this anymore to save memory
      procedureCount: 0,
      avgCostPerClaim: m.claims > 0 ? Math.round((m.paid / m.claims) * 100) / 100 : 0,
      avgCostPerBeneficiary: m.bene > 0 ? Math.round((m.paid / m.bene) * 100) / 100 : 0,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
  writeJson('monthly-national.json', monthlyNational);

  // Sort procedures by total paid
  const procsSorted = Array.from(procMap.entries())
    .sort((a, b) => b[1].paid - a[1].paid);

  // Sort providers by total paid
  const provsSorted = Array.from(providerMap.entries())
    .sort((a, b) => b[1].paid - a[1].paid);

  // Identify top sets for pass 2
  const top200ProcCodes = new Set(procsSorted.slice(0, 200).map(([code]) => code));
  const top10KProvNpis = new Set(provsSorted.slice(0, 10000).map(([npi]) => npi));
  const top1000Npis = new Set(provsSorted.slice(0, 1000).map(([npi]) => npi));

  console.log(`\nTop procedure: ${procsSorted[0]?.[0]} ($${(procsSorted[0]?.[1].paid / 1e9).toFixed(2)}B)`);
  console.log(`Top provider: ${provsSorted[0]?.[0]} ($${(provsSorted[0]?.[1].paid / 1e6).toFixed(1)}M)`);

  // Free pass 1 memory before pass 2
  monthMap.clear();

  // === PASS 2 ===
  const { procMonthMap, provProcMap, provMonthMap, provTopProc, provProcSets, procCpcSamples } =
    await pass2(top200ProcCodes, top10KProvNpis, top1000Npis);

  // === Build remaining output files ===

  // 2. Procedure Summary
  console.log('\n2. Procedure summary...');
  const procedureSummary = procsSorted.map(([hcpcsCode, p]) => {
    const samples = procCpcSamples.get(hcpcsCode);
    return {
      hcpcsCode,
      category: getHcpcsCategory(hcpcsCode),
      totalPaid: Math.round(p.paid * 100) / 100,
      totalClaims: p.claims,
      totalBeneficiaries: p.bene,
      providerCount: 0, // Will be set from pass 2 data if available
      avgCostPerClaim: p.claims > 0 ? Math.round((p.paid / p.claims) * 100) / 100 : 0,
      medianCostPerClaim: samples ? median(samples) : null,
      avgCostPerBeneficiary: p.bene > 0 ? Math.round((p.paid / p.bene) * 100) / 100 : 0,
      claimsPerBeneficiary: p.bene > 0 ? Math.round((p.claims / p.bene) * 100) / 100 : 0,
    };
  });

  // Count providers per top procedure from provProcMap
  const procProviderCounts = new Map<string, Set<string>>();
  for (const [key] of provProcMap) {
    const [npi, hcpcs] = key.split('|');
    let s = procProviderCounts.get(hcpcs);
    if (!s) { s = new Set(); procProviderCounts.set(hcpcs, s); }
    s.add(npi);
  }
  for (const ps of procedureSummary) {
    const count = procProviderCounts.get(ps.hcpcsCode);
    if (count) ps.providerCount = count.size;
  }
  procProviderCounts.clear();
  writeJson('procedure-summary.json', procedureSummary);

  const procMedianMap = new Map(procedureSummary.map(p => [p.hcpcsCode, p.medianCostPerClaim]));

  // 3. Provider Summary (top 10K)
  console.log('\n3. Provider summary (top 10,000)...');
  const providerSummary = provsSorted.slice(0, 10000).map(([npi, p]) => {
    const earlyCpc = p.earlyClaims > 0 ? p.earlyPaid / p.earlyClaims : 0;
    const lateCpc = p.lateClaims > 0 ? p.latePaid / p.lateClaims : 0;
    const topProc = provTopProc.get(npi);
    const procSet = provProcSets.get(npi);
    return {
      npi,
      state: npiStateMap.get(npi) ?? null,
      totalPaid: Math.round(p.paid * 100) / 100,
      totalClaims: p.claims,
      totalBeneficiaries: p.bene,
      procedureCount: procSet?.size ?? p.procCount,
      avgCostPerClaim: p.claims > 0 ? Math.round((p.paid / p.claims) * 100) / 100 : 0,
      avgCostPerBeneficiary: p.bene > 0 ? Math.round((p.paid / p.bene) * 100) / 100 : 0,
      topProcedure: topProc?.proc ?? null,
      topProcedurePaid: topProc ? Math.round(topProc.paid * 100) / 100 : null,
      spendingGrowthPct: p.earlyPaid > 0 ? Math.round(((p.latePaid - p.earlyPaid) / p.earlyPaid) * 10000) / 100 : null,
      costPerClaimGrowthPct: earlyCpc > 0 ? Math.round(((lateCpc - earlyCpc) / earlyCpc) * 10000) / 100 : null,
      volumeGrowthPct: p.earlyClaims > 0 ? Math.round(((p.lateClaims - p.earlyClaims) / p.earlyClaims) * 10000) / 100 : null,
    };
  });
  writeJson('provider-summary.json', providerSummary);

  // Free provider pass 1 data
  providerMap.clear();
  procMap.clear();
  provTopProc.clear();
  provProcSets.clear();

  // 4. Procedure Monthly (top 100 procedures)
  console.log('\n4. Procedure monthly (top 100)...');
  const top100Codes = new Set(procedureSummary.slice(0, 100).map(p => p.hcpcsCode));
  const procedureMonthly = Array.from(procMonthMap.entries())
    .filter(([key]) => top100Codes.has(key.split('|')[0]))
    .map(([key, pm]) => {
      const [hcpcsCode, month] = key.split('|');
      return {
        hcpcsCode,
        month,
        totalPaid: Math.round(pm.paid * 100) / 100,
        totalClaims: pm.claims,
        totalBeneficiaries: pm.bene,
        avgCostPerClaim: pm.claims > 0 ? Math.round((pm.paid / pm.claims) * 100) / 100 : 0,
        avgCostPerBeneficiary: pm.bene > 0 ? Math.round((pm.paid / pm.bene) * 100) / 100 : 0,
        providerCount: pm.providers,
      };
    })
    .sort((a, b) => a.hcpcsCode.localeCompare(b.hcpcsCode) || a.month.localeCompare(b.month));
  writeJson('procedure-monthly.json', procedureMonthly);
  procMonthMap.clear();

  // 5. Provider Procedures (top 50 per top 200 procedures)
  console.log('\n5. Provider-procedure details...');
  const procProviders = new Map<string, { npi: string; paid: number; claims: number; bene: number }[]>();
  for (const [key, pp] of provProcMap) {
    const [npi, hcpcs] = key.split('|');
    if (!top200ProcCodes.has(hcpcs)) continue;
    let arr = procProviders.get(hcpcs);
    if (!arr) { arr = []; procProviders.set(hcpcs, arr); }
    arr.push({ npi, paid: pp.paid, claims: pp.claims, bene: pp.bene });
  }

  const providerProcedures: any[] = [];
  for (const [hcpcs, providers] of procProviders) {
    providers.sort((a, b) => b.paid - a.paid);
    const top50 = providers.slice(0, 50);
    const procMedian = procMedianMap.get(hcpcs);
    for (let i = 0; i < top50.length; i++) {
      const p = top50[i];
      const cpc = p.claims > 0 ? p.paid / p.claims : 0;
      providerProcedures.push({
        npi: p.npi,
        hcpcsCode: hcpcs,
        totalPaid: Math.round(p.paid * 100) / 100,
        totalClaims: p.claims,
        totalBeneficiaries: p.bene,
        costPerClaim: Math.round(cpc * 100) / 100,
        costPerBeneficiary: p.bene > 0 ? Math.round((p.paid / p.bene) * 100) / 100 : 0,
        procedureMedianCostPerClaim: procMedian != null ? Math.round(procMedian * 100) / 100 : null,
        costIndex: procMedian && procMedian > 0 ? Math.round((cpc / procMedian) * 100) / 100 : null,
        state: npiStateMap.get(p.npi) ?? null,
        rn: i + 1,
      });
    }
  }
  writeJson('provider-procedures.json', providerProcedures);
  procProviders.clear();

  // 6. Provider Monthly (top 1000)
  console.log('\n6. Provider monthly (top 1000)...');
  const providerMonthly = Array.from(provMonthMap.entries())
    .map(([key, pm]) => {
      const [npi, month] = key.split('|');
      return {
        npi,
        month,
        totalPaid: Math.round(pm.paid * 100) / 100,
        totalClaims: pm.claims,
        totalBeneficiaries: pm.bene,
        avgCostPerClaim: pm.claims > 0 ? Math.round((pm.paid / pm.claims) * 100) / 100 : 0,
        procedureCount: pm.procs,
      };
    })
    .sort((a, b) => a.npi.localeCompare(b.npi) || a.month.localeCompare(b.month));
  writeJson('provider-monthly.json', providerMonthly);
  provMonthMap.clear();

  // 7. Outliers
  console.log('\n7. Computing outliers (cost index > 2.0x or < 0.5x)...');
  const outliers: any[] = [];
  for (const [key, pp] of provProcMap) {
    if (pp.claims < 100 || pp.paid < 10000) continue;
    const [npi, hcpcs] = key.split('|');
    const cpc = pp.paid / pp.claims;
    const procMedian = procMedianMap.get(hcpcs);
    if (!procMedian || procMedian <= 0) continue;
    const costIndex = cpc / procMedian;
    if (costIndex > 2.0 || costIndex < 0.5) {
      outliers.push({
        npi,
        state: npiStateMap.get(npi) ?? null,
        hcpcsCode: hcpcs,
        totalPaid: Math.round(pp.paid * 100) / 100,
        totalClaims: pp.claims,
        totalBeneficiaries: pp.bene,
        costPerClaim: Math.round(cpc * 100) / 100,
        procedureMedian: Math.round(procMedian * 100) / 100,
        costIndex: Math.round(costIndex * 100) / 100,
      });
    }
  }
  outliers.sort((a: any, b: any) => b.totalPaid - a.totalPaid);
  writeJson('outliers.json', outliers.slice(0, 5000));
  provProcMap.clear();

  // 8. State Summary (using NPI state mapping)
  if (npiStateMap.size > 0) {
    console.log('\n8. Computing state summaries...');
    const stateMap = new Map<string, { paid: number; claims: number; bene: number; providers: Set<string>; procedures: Set<string> }>();

    for (const ps of providerSummary) {
      if (!ps.state) continue;
      let s = stateMap.get(ps.state);
      if (!s) {
        s = { paid: 0, claims: 0, bene: 0, providers: new Set(), procedures: new Set() };
        stateMap.set(ps.state, s);
      }
      s.paid += ps.totalPaid;
      s.claims += ps.totalClaims;
      s.bene += ps.totalBeneficiaries;
      s.providers.add(ps.npi);
    }

    const stateSummary = Array.from(stateMap.entries())
      .map(([state, s]) => ({
        state,
        totalPaid: Math.round(s.paid * 100) / 100,
        totalClaims: s.claims,
        totalBeneficiaries: s.bene,
        providerCount: s.providers.size,
        procedureCount: 0,
        avgCostPerClaim: s.claims > 0 ? Math.round((s.paid / s.claims) * 100) / 100 : 0,
        avgCostPerBeneficiary: s.bene > 0 ? Math.round((s.paid / s.bene) * 100) / 100 : 0,
        claimsPerBeneficiary: s.bene > 0 ? Math.round((s.claims / s.bene) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.totalPaid - a.totalPaid);
    writeJson('state-summary.json', stateSummary);
  } else {
    console.log('\n8. Skipping state analysis (no NPI state mapping)');
  }

  // === Summary ===
  console.log('\n=== Processing Complete ===');
  console.log(`Procedures: ${procedureSummary.length.toLocaleString()}`);
  console.log(`Top providers saved: ${providerSummary.length.toLocaleString()}`);
  console.log(`Outliers: ${Math.min(outliers.length, 5000).toLocaleString()}`);

  console.log('\n=== Top 10 Procedures by Total Spending ===');
  for (let i = 0; i < Math.min(10, procedureSummary.length); i++) {
    const p = procedureSummary[i];
    const paid = `$${(p.totalPaid / 1_000_000_000).toFixed(2)}B`;
    console.log(`  ${(i + 1).toString().padStart(2)}. ${p.hcpcsCode.padEnd(8)} ${p.category.padEnd(20)} ${paid.padStart(12)}`);
  }
}

main().catch((err) => {
  console.error('Processing failed:', err);
  process.exit(1);
});
