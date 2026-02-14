/**
 * Look up provider state information from the NPPES NPI Registry API.
 *
 * Reads the top providers from data/provider-summary.json (must run process-medicaid.ts first
 * WITHOUT state data, then run this, then re-run process-medicaid.ts to enrich).
 *
 * Alternatively, can accept a list of NPIs from DuckDB query output.
 *
 * Usage:
 *   npx tsx scripts/lookup-npi-states.ts
 *
 * Output: data/npi-states.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_PATH = path.join(DATA_DIR, 'npi-states.json');
const PROVIDER_SUMMARY_PATH = path.join(DATA_DIR, 'provider-summary.json');

const NPPES_API = 'https://npiregistry.cms.hhs.gov/api/';
const BATCH_SIZE = 10; // API supports up to 200 results per call but we query one at a time for reliability
const CONCURRENCY = 5;
const DELAY_MS = 100; // rate limit courtesy

interface NpiState {
  npi: string;
  state: string;
  city?: string;
  name?: string;
}

async function lookupNpi(npi: string): Promise<NpiState | null> {
  try {
    const url = `${NPPES_API}?version=2.1&number=${npi}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    const result = data.results[0];
    const address = result.addresses?.[0]; // practice location
    const name = result.basic?.organization_name
      || `${result.basic?.first_name ?? ''} ${result.basic?.last_name ?? ''}`.trim()
      || null;

    return {
      npi,
      state: address?.state ?? null,
      city: address?.city ?? null,
      name,
    };
  } catch {
    return null;
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Load existing results if available (for resume support)
  let existing = new Map<string, NpiState>();
  if (existsSync(OUTPUT_PATH)) {
    const data: NpiState[] = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));
    existing = new Map(data.map(r => [r.npi, r]));
    console.log(`Loaded ${existing.size.toLocaleString()} existing NPI lookups`);
  }

  // Get NPIs to look up
  let npis: string[] = [];

  if (existsSync(PROVIDER_SUMMARY_PATH)) {
    const providers = JSON.parse(readFileSync(PROVIDER_SUMMARY_PATH, 'utf-8'));
    npis = providers.map((p: any) => p.npi).filter((npi: string) => !existing.has(npi));
    console.log(`Found ${providers.length.toLocaleString()} providers, ${npis.length.toLocaleString()} need lookup`);
  } else {
    console.error('No provider-summary.json found. Run process-medicaid.ts first.');
    process.exit(1);
  }

  if (npis.length === 0) {
    console.log('All NPIs already looked up. Nothing to do.');
    return;
  }

  // Process in batches with concurrency
  let completed = 0;
  const total = npis.length;
  const results = new Map(existing);

  for (let i = 0; i < npis.length; i += CONCURRENCY) {
    const batch = npis.slice(i, i + CONCURRENCY);
    const promises = batch.map(npi => lookupNpi(npi));
    const batchResults = await Promise.all(promises);

    for (const result of batchResults) {
      if (result) {
        results.set(result.npi, result);
      }
    }

    completed += batch.length;

    // Save progress every 100 lookups
    if (completed % 100 === 0 || completed === total) {
      const arr = Array.from(results.values());
      writeFileSync(OUTPUT_PATH, JSON.stringify(arr));
      const withState = arr.filter(r => r.state).length;
      console.log(`  Progress: ${completed.toLocaleString()}/${total.toLocaleString()} (${withState.toLocaleString()} with state)`);
    }

    await sleep(DELAY_MS);
  }

  // Final save
  const finalArr = Array.from(results.values());
  writeFileSync(OUTPUT_PATH, JSON.stringify(finalArr));

  const withState = finalArr.filter(r => r.state).length;
  console.log(`\nDone. ${finalArr.length.toLocaleString()} total NPIs, ${withState.toLocaleString()} with state.`);
}

main().catch((err) => {
  console.error('Lookup failed:', err);
  process.exit(1);
});
