import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Verify Dataset
const stationsPath = path.join(__dirname, 'services/railway-service/stations.json');
assert(fs.existsSync(stationsPath), 'stations.json must exist in railway-service');

const stations = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
console.log(`\n=== 1. VERIFYING STATION DATASET ===`);
console.log(`Total stations loaded: ${stations.length}`);
assert(stations.length > 8500, 'Station dataset must contain at least 8500 stations');

// Check schema of sample stations
const sample = stations.slice(0, 5);
for (const s of sample) {
  assert(s.code, 'Station must have code');
  assert(s.name, 'Station must have name');
  assert(s.state, 'Station must have state');
  console.log(`  Station: [${s.code}] ${s.name} - ${s.city}, ${s.state} (coords: ${s.lat}, ${s.lng})`);
}

// 2. Test Client stationService
import stationService from './client/src/services/stationService.js';

console.log(`\n=== 2. TESTING CLIENT SEARCH & RANKING ===`);

// Test 2a: Station Name search
const delhiResults = stationService.searchStations('Delhi');
console.log(`Search "Delhi" returned ${delhiResults.length} stations:`);
delhiResults.slice(0, 4).forEach((s, i) => console.log(`  ${i+1}. ${s.name} (${s.code}) - ${s.city}, ${s.state}`));
assert(delhiResults.some(s => s.code === 'NDLS' || s.code === 'DLI'), 'Delhi search must find NDLS or DLI');

// Test 2b: Exact Station Code
const gzbResults = stationService.searchStations('GZB');
console.log(`Search "GZB" top match: ${gzbResults[0].name} (${gzbResults[0].code})`);
assert.strictEqual(gzbResults[0].code, 'GZB', 'GZB search must rank GZB first');

// Test 2c: Partial Station Code
const ndlResults = stationService.searchStations('NDL');
console.log(`Search "NDL" matches:`);
ndlResults.slice(0, 3).forEach((s, i) => console.log(`  ${i+1}. ${s.name} (${s.code})`));
assert(ndlResults.some(s => s.code === 'NDLS'), 'Partial code NDL must return NDLS');

// Test 2d: Capitalization invariance
const lowerResults = stationService.searchStations('new delhi');
const mixedResults = stationService.searchStations('NeW DeLhI');
assert(lowerResults.length > 0 && lowerResults[0].code === 'NDLS', 'Lower case "new delhi" must find NDLS');
assert(mixedResults.length > 0 && mixedResults[0].code === 'NDLS', 'Mixed case "NeW DeLhI" must find NDLS');
console.log(`Case invariance verified for "new delhi" and "NeW DeLhI" -> ${lowerResults[0].name}`);

// Test 2e: Previously missing stations
const previouslyMissing = ['KYN', 'TNA', 'BJU', 'TPJ', 'GNT', 'RU', 'CLT', 'UBL', 'DDU', 'VGLJ'];
console.log(`\nTesting previously missing stations across Indian Railways:`);
for (const code of previouslyMissing) {
  const match = stationService.getStationByCode(code);
  assert(match, `Station ${code} must now be found!`);
  console.log(`  ✓ Found ${code}: ${match.name} in ${match.state} (lat: ${match.lat}, lng: ${match.lng})`);
}

// 3. Test API Gateway Railway Service Endpoints
const GATEWAY_URL = 'http://127.0.0.1:5050';

async function testBackend() {
  console.log(`\n=== 3. TESTING BACKEND RAILWAY API VIA GATEWAY ===`);

  // 3a. Search Stations API
  const res1 = await fetch(`${GATEWAY_URL}/api/railway/stations?q=GZB`);
  const data1 = await res1.json();
  assert(data1.stations && data1.stations.length > 0, 'Backend /stations?q=GZB must return stations');
  assert.strictEqual(data1.stations[0].code, 'GZB');
  console.log(`✓ Backend /stations?q=GZB returned ${data1.stations.length} stations. Top: ${data1.stations[0].name} (${data1.stations[0].code})`);

  // 3b. Partial code API
  const res2 = await fetch(`${GATEWAY_URL}/api/railway/stations?q=NDL`);
  const data2 = await res2.json();
  assert(data2.stations.some(s => s.code === 'NDLS'), 'Backend /stations?q=NDL must include NDLS');
  console.log(`✓ Backend /stations?q=NDL includes NDLS: ${data2.stations.find(s => s.code === 'NDLS').name}`);

  // 3c. Train Search between previously missing station pair (Kalyan KYN to Pune PUNE)
  const res3 = await fetch(`${GATEWAY_URL}/api/railway/search-trains?from=KYN&to=PUNE`);
  const data3 = await res3.json();
  assert(data3.success, 'Train search between KYN and PUNE must succeed');
  assert(data3.trains.length > 0, 'Trains must be returned between KYN and PUNE');
  console.log(`✓ Train search KYN -> PUNE returned ${data3.trains.length} trains:`);
  console.log(`   Train: ${data3.trains[0].name} (${data3.trains[0].number}), ConfirmTkt score: ${data3.trains[0].confirmTkt?.probabilityScore}%`);

  // 3d. Existing PNR Status
  const res4 = await fetch(`${GATEWAY_URL}/api/railway/pnr/2849102941`);
  const data4 = await res4.json();
  assert(data4.success, 'PNR lookup must succeed');
  console.log(`✓ PNR 2849102941: Train ${data4.trainNumber} (${data4.trainName}), Status: ${data4.bookingStatus}`);

  // 3e. Live Running Status
  const res5 = await fetch(`${GATEWAY_URL}/api/railway/live-status/12952`);
  const data5 = await res5.json();
  assert(data5.success, 'Live status lookup must succeed');
  console.log(`✓ Live status for 12952: ${data5.runningStatus}, Speed: ${data5.currentSpeedKmh} km/h`);

  console.log(`\n========================================`);
  console.log(` ALL COMPLETE STATION SEARCH TESTS PASSED! `);
  console.log(`========================================\n`);
}

testBackend().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
