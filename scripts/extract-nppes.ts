/**
 * Extract NPI → state + name + city + zip + lat/lng from the NPPES bulk download file.
 *
 * Streams the 11GB CSV directly from the zip (no extraction to disk needed).
 * Cross-references against our 617K unique billing NPIs from the Medicaid data.
 * Geocodes providers using Census ZCTA zip code centroids.
 *
 * Usage:
 *   npx tsx scripts/extract-nppes.ts
 *
 * Requires: data/nppes.zip (download from https://download.cms.gov/nppes/NPI_Files.html)
 * Requires: data/unique-billing-npis.txt (one NPI per line)
 * Optional: data/zip-centroids.json (Census ZCTA centroids for geocoding)
 *
 * Output: data/npi-lookup-full.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync, spawn } from 'child_process';
import { createInterface } from 'readline';
import path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');
const ZIP_PATH = path.join(DATA_DIR, 'nppes.zip');
const NPI_LIST_PATH = path.join(DATA_DIR, 'unique-billing-npis.txt');
const OUTPUT_PATH = path.join(DATA_DIR, 'npi-lookup-full.json');

// Parse a CSV line that uses double-quote quoting
// Only parses up to maxFields fields for efficiency
function parseCSVLine(line: string, maxFields: number): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < line.length && fields.length < maxFields) {
    if (line[i] === '"') {
      let j = i + 1;
      let value = '';
      while (j < line.length) {
        if (line[j] === '"') {
          if (j + 1 < line.length && line[j + 1] === '"') {
            value += '"';
            j += 2;
          } else {
            j++; // skip closing quote
            break;
          }
        } else {
          value += line[j];
          j++;
        }
      }
      fields.push(value);
      if (j < line.length && line[j] === ',') j++;
      i = j;
    } else if (line[i] === ',') {
      fields.push('');
      i++;
    } else {
      let j = i;
      while (j < line.length && line[j] !== ',') j++;
      fields.push(line.substring(i, j));
      if (j < line.length) j++;
      i = j;
    }
  }
  return fields;
}

async function main() {
  if (!existsSync(ZIP_PATH)) {
    console.error('Error: data/nppes.zip not found.');
    console.error('Download from: https://download.cms.gov/nppes/NPI_Files.html');
    process.exit(1);
  }

  // Load target NPIs
  console.log('Loading target NPIs...');
  const targetNpis = new Set<string>();
  if (existsSync(NPI_LIST_PATH)) {
    const lines = readFileSync(NPI_LIST_PATH, 'utf-8').trim().split('\n');
    for (const line of lines) {
      const npi = line.trim();
      if (npi && /^\d{10}$/.test(npi)) {
        targetNpis.add(npi);
      }
    }
  }
  console.log(`  Target NPIs: ${targetNpis.size.toLocaleString()}`);

  if (targetNpis.size === 0) {
    console.error('Error: No target NPIs found. Run unique billing NPI extraction first.');
    process.exit(1);
  }

  // Find the main CSV filename in the zip
  const zipList = execSync(`unzip -l "${ZIP_PATH}" | grep "npidata_pfile_" | grep -v fileheader`, { encoding: 'utf-8' });
  const csvFilename = zipList.trim().split(/\s+/).pop();
  if (!csvFilename) {
    console.error('Error: Could not find main CSV in zip file.');
    process.exit(1);
  }
  console.log(`  NPPES CSV: ${csvFilename}`);

  // Load zip code centroids for geocoding
  const ZIP_CENTROIDS_PATH = path.join(DATA_DIR, 'zip-centroids.json');
  let zipCentroids: Record<string, { lat: number; lng: number }> = {};
  if (existsSync(ZIP_CENTROIDS_PATH)) {
    zipCentroids = JSON.parse(readFileSync(ZIP_CENTROIDS_PATH, 'utf-8'));
    console.log(`  Zip centroids loaded: ${Object.keys(zipCentroids).length.toLocaleString()}`);
  } else {
    console.log('  Warning: zip-centroids.json not found, lat/lng will be null');
  }

  // Stream the CSV from the zip
  console.log('\nStreaming NPPES CSV from zip...');
  const unzip = spawn('unzip', ['-p', ZIP_PATH, csvFilename]);

  const rl = createInterface({
    input: unzip.stdout,
    crlfDelay: Infinity,
  });

  interface NpiData { state: string; name: string; city: string; zip: string; lat: number | null; lng: number | null }
  const results = new Map<string, NpiData>();
  let rowCount = 0;
  let isHeader = true;
  const startTime = Date.now();

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    rowCount++;

    if (rowCount % 1_000_000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0);
      console.log(`  ${(rowCount / 1_000_000).toFixed(1)}M rows (${elapsed}s, ${mem}MB heap, ${results.size.toLocaleString()} matches)`);
    }

    // Quick check: extract NPI (first field) without full parse
    // NPI is always the first field: "1234567890",...
    const firstComma = line.indexOf(',');
    if (firstComma === -1) continue;
    const npiRaw = line.substring(0, firstComma).replace(/"/g, '');

    if (!targetNpis.has(npiRaw)) continue;

    // Full parse only for matching NPIs (columns 0-31 needed)
    const fields = parseCSVLine(line, 33);
    if (fields.length < 32) continue;

    const npi = fields[0];
    const entityType = fields[1]; // 1=Individual, 2=Organization
    const orgName = fields[4];
    const lastName = fields[5];
    const firstName = fields[6];
    const city = fields[30] || '';     // Practice location city
    const state = fields[31] || '';    // Practice location state
    const zipRaw = fields[32] || '';   // Practice location postal code

    // Normalize zip to 5 digits
    const zip = zipRaw.replace(/[^0-9]/g, '').substring(0, 5);

    // Geocode via zip centroid
    const centroid = zip ? zipCentroids[zip] : undefined;
    const lat = centroid?.lat ?? null;
    const lng = centroid?.lng ?? null;

    // Build name
    let name: string;
    if (entityType === '2' && orgName) {
      name = orgName;
    } else if (lastName) {
      name = firstName ? `${firstName} ${lastName}` : lastName;
    } else if (orgName) {
      name = orgName;
    } else {
      name = '';
    }

    if (state || name) {
      results.set(npi, { state, name, city, zip, lat, lng });
    }
  }

  // Wait for unzip to finish
  await new Promise<void>((resolve, reject) => {
    unzip.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`unzip exited with code ${code}`));
    });
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\nDone. Processed ${rowCount.toLocaleString()} NPPES rows in ${elapsed}s`);
  console.log(`  Matched: ${results.size.toLocaleString()} / ${targetNpis.size.toLocaleString()} target NPIs`);
  console.log(`  Match rate: ${((results.size / targetNpis.size) * 100).toFixed(1)}%`);

  const vals = Array.from(results.values());
  const withState = vals.filter(r => r.state).length;
  const withName = vals.filter(r => r.name).length;
  const withLatLng = vals.filter(r => r.lat !== null).length;
  console.log(`  With state: ${withState.toLocaleString()}`);
  console.log(`  With name: ${withName.toLocaleString()}`);
  console.log(`  With lat/lng: ${withLatLng.toLocaleString()} (${((withLatLng / results.size) * 100).toFixed(1)}%)`);

  // Write output as a JSON object
  const output: Record<string, NpiData> = {};
  for (const [npi, data] of results) {
    output[npi] = data;
  }
  writeFileSync(OUTPUT_PATH, JSON.stringify(output));
  const fileSize = (readFileSync(OUTPUT_PATH).length / 1024 / 1024).toFixed(1);
  console.log(`\nWrote ${OUTPUT_PATH} (${fileSize} MB)`);
}

main().catch((err) => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
