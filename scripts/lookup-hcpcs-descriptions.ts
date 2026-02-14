/**
 * Look up HCPCS code descriptions from the NLM Clinical Tables API.
 *
 * Reads procedure codes from data/procedure-summary.json and queries the
 * NLM API for human-readable descriptions. Supports resume (skips codes
 * already looked up).
 *
 * Usage:
 *   npx tsx scripts/lookup-hcpcs-descriptions.ts
 *
 * Output: data/hcpcs-descriptions.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_PATH = path.join(DATA_DIR, 'hcpcs-descriptions.json');
const PROCEDURE_SUMMARY_PATH = path.join(DATA_DIR, 'procedure-summary.json');

const NLM_API = 'https://clinicaltables.nlm.nih.gov/api/hcpcs/v3/search';
const CONCURRENCY = 5;
const DELAY_MS = 100;

interface HcpcsDescription {
  code: string;
  shortDesc: string | null;
  longDesc: string | null;
}

async function lookupHcpcs(code: string): Promise<HcpcsDescription> {
  try {
    const url = `${NLM_API}?terms=${encodeURIComponent(code)}&df=code,short_desc,long_desc&maxList=5`;
    const res = await fetch(url);
    if (!res.ok) return { code, shortDesc: null, longDesc: null };

    const data = await res.json();
    // Response format: [totalCount, [matchedCodes], null, [[code, shortDesc, longDesc], ...]]
    const results = data[3] as string[][] | undefined;
    if (!results || results.length === 0) return { code, shortDesc: null, longDesc: null };

    // Find exact match
    const match = results.find(r => r[0] === code);
    if (!match) return { code, shortDesc: null, longDesc: null };

    return {
      code,
      shortDesc: match[1] || null,
      longDesc: match[2] || null,
    };
  } catch {
    return { code, shortDesc: null, longDesc: null };
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Load existing results for resume support
  let existing = new Map<string, HcpcsDescription>();
  if (existsSync(OUTPUT_PATH)) {
    const data: HcpcsDescription[] = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));
    existing = new Map(data.map(r => [r.code, r]));
    console.log(`Loaded ${existing.size.toLocaleString()} existing HCPCS lookups`);
  }

  // Get codes to look up
  if (!existsSync(PROCEDURE_SUMMARY_PATH)) {
    console.error('No procedure-summary.json found. Run process-medicaid.ts first.');
    process.exit(1);
  }

  const procedures = JSON.parse(readFileSync(PROCEDURE_SUMMARY_PATH, 'utf-8'));
  const allCodes: string[] = procedures.map((p: any) => p.hcpcsCode);
  const needLookup = allCodes.filter((code: string) => !existing.has(code));

  console.log(`Found ${allCodes.length.toLocaleString()} procedures, ${needLookup.length.toLocaleString()} need lookup`);

  if (needLookup.length === 0) {
    console.log('All codes already looked up. Nothing to do.');
    return;
  }

  // Process in batches with concurrency
  let completed = 0;
  const total = needLookup.length;
  const results = new Map(existing);

  for (let i = 0; i < needLookup.length; i += CONCURRENCY) {
    const batch = needLookup.slice(i, i + CONCURRENCY);
    const promises = batch.map(code => lookupHcpcs(code));
    const batchResults = await Promise.all(promises);

    for (const result of batchResults) {
      results.set(result.code, result);
    }

    completed += batch.length;

    // Save progress every 100 lookups
    if (completed % 100 === 0 || completed === total) {
      const arr = Array.from(results.values());
      writeFileSync(OUTPUT_PATH, JSON.stringify(arr));
      const withDesc = arr.filter(r => r.shortDesc).length;
      console.log(`  Progress: ${completed.toLocaleString()}/${total.toLocaleString()} (${withDesc.toLocaleString()} with descriptions)`);
    }

    await sleep(DELAY_MS);
  }

  // Final save
  const finalArr = Array.from(results.values());
  writeFileSync(OUTPUT_PATH, JSON.stringify(finalArr));

  const withDesc = finalArr.filter(r => r.shortDesc).length;
  console.log(`\nDone. ${finalArr.length.toLocaleString()} total codes, ${withDesc.toLocaleString()} with descriptions.`);
}

main().catch((err) => {
  console.error('Lookup failed:', err);
  process.exit(1);
});
