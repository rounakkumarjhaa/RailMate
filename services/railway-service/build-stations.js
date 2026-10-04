import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const datameetPath = path.join(__dirname, 'raw_datameet_stations.json');
const iamyvjPath = path.join(__dirname, 'raw_iamyvj_stations.json');
const vstflugelPath = path.join(__dirname, 'raw_vstflugel_stations.json');

if (!fs.existsSync(datameetPath) || !fs.existsSync(iamyvjPath) || !fs.existsSync(vstflugelPath)) {
  console.log('Raw source files not present; existing stations.json is already compiled.');
  process.exit(0);
}

const datameet = JSON.parse(fs.readFileSync(datameetPath, 'utf8'));
const iamyvj = JSON.parse(fs.readFileSync(iamyvjPath, 'utf8'));
const vst = JSON.parse(fs.readFileSync(vstflugelPath, 'utf8'));

// 1. Reference stations with state and coordinates
const knownRefStations = [];
for (const f of datameet.features) {
  const p = f.properties || {};
  if (p.state && f.geometry?.coordinates) {
    let st = p.state;
    if (st === 'Delhi NCT') st = 'Delhi';
    if (st === 'Orissa') st = 'Odisha';
    if (st === 'Jammu and Kashmir') st = 'Jammu & Kashmir';
    knownRefStations.push({
      code: p.code,
      name: p.name,
      state: st,
      lon: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1]
    });
  }
}

function getNearestState(lon, lat) {
  let bestDist = Infinity;
  let bestState = 'Indian Railways';
  for (const s of knownRefStations) {
    const dLon = lon - s.lon;
    const dLat = lat - s.lat;
    const dist = dLon * dLon + dLat * dLat;
    if (dist < bestDist) {
      bestDist = dist;
      bestState = s.state;
    }
  }
  return bestState;
}

const ZONE_STATES = {
  NR: 'Delhi / Northern Railway',
  NCR: 'Uttar Pradesh',
  NER: 'Uttar Pradesh',
  NFR: 'Assam / North East',
  NWR: 'Rajasthan',
  ER: 'West Bengal',
  ECR: 'Bihar',
  ECoR: 'Odisha',
  SER: 'West Bengal',
  SECR: 'Chhattisgarh',
  CR: 'Maharashtra',
  WR: 'Maharashtra / Gujarat',
  WCR: 'Madhya Pradesh',
  SR: 'Tamil Nadu / Kerala',
  SCR: 'Telangana / Andhra Pradesh',
  SWR: 'Karnataka',
  KR: 'Goa / Maharashtra'
};

function formatName(raw) {
  if (!raw) return '';
  let s = raw.trim();
  s = s.replace(/\bJN\.?\b/gi, 'Junction')
       .replace(/\bTRM\.?\b|\bTERM\.?\b/gi, 'Terminal')
       .replace(/\bCANTT?\.?\b/gi, 'Cantt')
       .replace(/\bHLT\.?\b|\bHL\b/gi, 'Halt')
       .replace(/\bCABIN\b/gi, 'Cabin')
       .replace(/\bCITY\b/gi, 'City')
       .replace(/\bCENTRAL\b/gi, 'Central')
       .replace(/\bWEST\b/gi, 'West')
       .replace(/\bEAST\b/gi, 'East')
       .replace(/\bNORTH\b/gi, 'North')
       .replace(/\bSOUTH\b/gi, 'South')
       .replace(/\bROAD\b/gi, 'Road')
       .replace(/\bBYPASS\b/gi, 'Bypass')
       .replace(/\bTOWN\b/gi, 'Town');

  return s.split(' ').filter(Boolean).map(w => {
    if (['CSMT', 'KSR', 'SMVT', 'BG', 'MG', 'NG'].includes(w.toUpperCase())) return w.toUpperCase();
    if (w.toLowerCase() === 'jn') return 'Junction';
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
}

// City mapping from IamYVJ
const cityMap = new Map();
for (const s of (iamyvj.stations || [])) {
  const code = (s.stnCode || '').trim().toUpperCase();
  if (code && s.stnCity) {
    cityMap.set(code, s.stnCity.trim());
  }
}

// Region map from vstflugel
const regionMap = new Map();
for (const s of vst) {
  const code = (s.station_code || '').trim().toUpperCase();
  if (code && s.region_code) {
    regionMap.set(code, s.region_code.trim());
  }
}

const stationsMap = new Map();

function addStation(item) {
  const code = (item.code || '').trim().toUpperCase();
  if (!code || code.length < 2 || code.length > 5 || code.includes('(') || code.includes(')') || code.startsWith('XX-') || code.startsWith('YY-') || code.startsWith('ZZ-')) return;
  if (/^(ZZZZ|XXXX|NLDS)$/.test(code)) return;

  const existing = stationsMap.get(code);
  if (!existing) {
    stationsMap.set(code, item);
  } else {
    if ((!existing.state || existing.state === 'Indian Railways') && item.state && item.state !== 'Indian Railways') {
      existing.state = item.state;
    }
    if (!existing.city && item.city) existing.city = item.city;
    if ((!existing.lat || !existing.lng) && item.lat && item.lng) {
      existing.lat = item.lat;
      existing.lng = item.lng;
    }
    if (!existing.zone && item.zone) existing.zone = item.zone;
  }
}

// Process datameet
for (const f of datameet.features) {
  const p = f.properties || {};
  const code = (p.code || '').trim().toUpperCase();
  if (!code || code.length < 2 || code.startsWith('XX-') || code.startsWith('YY-') || code.startsWith('ZZ-')) continue;

  const coords = f.geometry?.coordinates;
  const lng = coords ? Number(coords[0].toFixed(5)) : undefined;
  const lat = coords ? Number(coords[1].toFixed(5)) : undefined;

  let state = p.state;
  if (state === 'Delhi NCT') state = 'Delhi';
  if (state === 'Orissa') state = 'Odisha';
  if (state === 'Jammu and Kashmir') state = 'Jammu & Kashmir';

  if (!state && lat && lng) {
    state = getNearestState(lng, lat);
  }

  const zone = p.zone || regionMap.get(code);
  if (!state && zone && ZONE_STATES[zone]) {
    state = ZONE_STATES[zone];
  }

  const city = cityMap.get(code) || (p.address ? p.address.split(',')[0].trim() : undefined);

  addStation({
    code,
    name: formatName(p.name || code),
    state: state || 'Indian Railways',
    city: city || formatName(p.name || code).replace(/ Junction| Central| Cantt| Terminal| Halt/gi, ''),
    lat,
    lng,
    zone: zone || 'IR'
  });
}

// Modern overrides & popular stations
const modernOverrides = [
  { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra', lat: 18.9696, lng: 72.8193, zone: 'WR' },
  { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', state: 'Maharashtra', lat: 18.9402, lng: 72.8356, zone: 'CR' },
  { code: 'PRYJ', name: 'Prayagraj Junction', city: 'Prayagraj', state: 'Uttar Pradesh', lat: 25.4438, lng: 81.8285, zone: 'NCR' },
  { code: 'VGLJ', name: 'Virangana Lakshmibai Jhansi', city: 'Jhansi', state: 'Uttar Pradesh', lat: 25.4436, lng: 78.5530, zone: 'NCR' },
  { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya Junction', city: 'Mughalsarai', state: 'Uttar Pradesh', lat: 25.2817, lng: 83.1162, zone: 'ECR' },
  { code: 'AY', name: 'Ayodhya Dham Junction', city: 'Ayodhya', state: 'Uttar Pradesh', lat: 26.7922, lng: 82.2033, zone: 'NR' },
  { code: 'AYC', name: 'Ayodhya Cantt', city: 'Ayodhya', state: 'Uttar Pradesh', lat: 26.7725, lng: 82.1386, zone: 'NR' },
  { code: 'RKMP', name: 'Rani Kamlapati (Habibganj)', city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2128, lng: 77.4385, zone: 'WCR' },
  { code: 'SMVB', name: 'Sir M. Visvesvaraya Terminal Bengaluru', city: 'Bengaluru', state: 'Karnataka', lat: 13.0039, lng: 77.6521, zone: 'SWR' },
  { code: 'SBC', name: 'KSR Bengaluru City Junction', city: 'Bengaluru', state: 'Karnataka', lat: 12.9776, lng: 77.5681, zone: 'SWR' },
  { code: 'YPR', name: 'Yesvantpur Junction', city: 'Bengaluru', state: 'Karnataka', lat: 13.0238, lng: 77.5503, zone: 'SWR' },
  { code: 'SVDK', name: 'Shri Mata Vaishno Devi Katra', city: 'Katra', state: 'Jammu & Kashmir', lat: 32.9965, lng: 74.9312, zone: 'NR' },
  { code: 'NDLS', name: 'New Delhi Railway Station', city: 'New Delhi', state: 'Delhi', lat: 28.6423, lng: 77.2200, zone: 'NR' },
  { code: 'GZB', name: 'Ghaziabad Junction', city: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6497, lng: 77.4311, zone: 'NR' },
  { code: 'BGP', name: 'Bhagalpur Junction', city: 'Bhagalpur', state: 'Bihar', lat: 25.2419, lng: 86.9768, zone: 'ER' },
  { code: 'ANVT', name: 'Anand Vihar Terminal', city: 'Delhi', state: 'Delhi', lat: 28.6505, lng: 77.3152, zone: 'NR' },
  { code: 'DLI', name: 'Old Delhi Junction', city: 'Delhi', state: 'Delhi', lat: 28.6618, lng: 77.2284, zone: 'NR' },
  { code: 'DEE', name: 'Delhi Sarai Rohilla', city: 'Delhi', state: 'Delhi', lat: 28.6657, lng: 77.1857, zone: 'NR' },
  { code: 'NZM', name: 'Hazrat Nizamuddin', city: 'Delhi', state: 'Delhi', lat: 28.5884, lng: 77.2533, zone: 'NR' }
];

for (const m of modernOverrides) {
  stationsMap.set(m.code, m);
}

// Add passenger stations from IamYVJ
for (const s of (iamyvj.stations || [])) {
  const code = (s.stnCode || '').trim().toUpperCase();
  if (!stationsMap.has(code) && code.length >= 2) {
    addStation({
      code,
      name: formatName(s.stnName || code),
      state: 'Indian Railways',
      city: s.stnCity || formatName(s.stnName || code),
      zone: regionMap.get(code) || 'IR'
    });
  }
}

// Clean and sort by code
const finalStations = Array.from(stationsMap.values()).sort((a, b) => a.code.localeCompare(b.code));

console.log(`Generated ${finalStations.length} total stations.`);

// Write to railway service
const serverOutputPath = path.join(__dirname, 'stations.json');
fs.writeFileSync(serverOutputPath, JSON.stringify(finalStations));
console.log(`Wrote ${finalStations.length} stations to ${serverOutputPath}`);

// Write to client
const clientDataDir = path.join(__dirname, '../../client/src/data');
if (!fs.existsSync(clientDataDir)) {
  fs.mkdirSync(clientDataDir, { recursive: true });
}
const clientOutputPath = path.join(clientDataDir, 'stations.json');
fs.writeFileSync(clientOutputPath, JSON.stringify(finalStations));
console.log(`Wrote ${finalStations.length} stations to ${clientOutputPath}`);

// Also copy to client public/stations.json for fast lazy fetch
const clientPublicDir = path.join(__dirname, '../../client/public');
if (!fs.existsSync(clientPublicDir)) {
  fs.mkdirSync(clientPublicDir, { recursive: true });
}
const clientPublicOutputPath = path.join(clientPublicDir, 'stations.json');
fs.writeFileSync(clientPublicOutputPath, JSON.stringify(finalStations));
console.log(`Wrote ${finalStations.length} stations to ${clientPublicOutputPath}`);
