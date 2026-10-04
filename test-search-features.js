// Test script to verify Destination Searching (Paryatan Sthal) and Any-Station Search with ConfirmTkt API
const GATEWAY = 'http://127.0.0.1:5050';

async function testSearchFeatures() {
  console.log('--- STARTING SEARCH & CONFIRMTKT API VERIFICATION ---');

  // 1. Destination Search: All destinations
  const allDestRes = await fetch(`${GATEWAY}/api/destinations/featured-destinations`).then(r => r.json());
  console.log('1. Total Destinations in Paryatan Sthal:', allDestRes.total, 'Count:', allDestRes.count);
  if (allDestRes.count < 8) throw new Error('Expected at least 8 destinations');

  // 2. Destination Search: Query "Kashmir"
  const kashmirRes = await fetch(`${GATEWAY}/api/destinations/featured-destinations?q=Kashmir`).then(r => r.json());
  console.log('2. Search "Kashmir":', kashmirRes.destinations.map(d => d.title));
  if (!kashmirRes.destinations.some(d => d.title.includes('Kashmir'))) throw new Error('Kashmir not found in search');

  // 3. Destination Search: Category "Mountains & Snow"
  const mountainRes = await fetch(`${GATEWAY}/api/destinations/featured-destinations?category=Mountains%20%26%20Snow`).then(r => r.json());
  console.log('3. Category "Mountains & Snow":', mountainRes.destinations.map(d => d.title));
  if (mountainRes.destinations.length < 2) throw new Error('Expected multiple mountain destinations');

  // 4. Station Search: Any station "GZB"
  const gzbStationRes = await fetch(`${GATEWAY}/api/railway/stations?q=GZB`).then(r => r.json());
  console.log('4. Station Search "GZB":', gzbStationRes.stations);
  if (!gzbStationRes.stations.some(s => s.code === 'GZB')) throw new Error('GZB not found');

  // 5. Station Search: Any station "Bhagalpur" / "BGP"
  const bgpStationRes = await fetch(`${GATEWAY}/api/railway/stations?q=Bhagalpur`).then(r => r.json());
  console.log('5. Station Search "Bhagalpur":', bgpStationRes.stations);
  if (!bgpStationRes.stations.some(s => s.code === 'BGP')) throw new Error('BGP not found');

  // 6. Train Search: GZB to BGP with ConfirmTkt API
  const gzbBgpRes = await fetch(`${GATEWAY}/api/railway/search-trains?from=GZB&to=BGP`).then(r => r.json());
  console.log('6. Train Search GZB ➔ BGP: Found', gzbBgpRes.totalTrains, 'trains');
  gzbBgpRes.trains.forEach(t => {
    console.log(`   - Train: ${t.number} ${t.name} (${t.type})`);
    console.log(`     ConfirmTkt: ${t.confirmTkt?.probabilityScore}% | Status: ${t.confirmTkt?.statusText}`);
    console.log(`     Classes:`, Object.keys(t.availability || {}));
  });
  if (!gzbBgpRes.trains.some(t => t.number === '12368' || t.number === '22406')) {
    throw new Error('Expected Vikramshila Express or Garib Rath Express for GZB to BGP');
  }

  // 7. Train Search: Arbitrary Any Station Pair (e.g. PNBE to MAS) with ConfirmTkt API
  const customSearchRes = await fetch(`${GATEWAY}/api/railway/search-trains?from=PNBE&to=MAS`).then(r => r.json());
  console.log('7. Arbitrary Any Station Search PNBE ➔ MAS: Found', customSearchRes.totalTrains, 'trains');
  console.log('   Provider:', customSearchRes.apiProvider);
  console.log('   First Train ConfirmTkt Info:', customSearchRes.trains[0]?.confirmTkt);
  if (!customSearchRes.trains || customSearchRes.trains.length === 0) {
    throw new Error('Expected trains for PNBE to MAS');
  }

  console.log('\n--- ALL SEARCH & CONFIRMTKT API VERIFICATIONS PASSED! ---');
}

testSearchFeatures().catch(e => {
  console.error('FAILED:', e);
  process.exit(1);
});
