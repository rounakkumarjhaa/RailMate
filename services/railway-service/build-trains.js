import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawTrainsPath = path.join(__dirname, 'raw_trains_dict.json');
const rawSchedulesPath = path.join(__dirname, 'raw_schedules_dict.json');
const stationsPath = path.join(__dirname, 'stations.json');

if (!fs.existsSync(rawTrainsPath) || !fs.existsSync(rawSchedulesPath)) {
  console.log('Raw trains or schedules not found.');
  process.exit(0);
}

const rawTrains = JSON.parse(fs.readFileSync(rawTrainsPath, 'utf8'));
const rawSchedules = JSON.parse(fs.readFileSync(rawSchedulesPath, 'utf8'));
const stationsList = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
const stationsMap = new Map(stationsList.map(s => [s.code.toUpperCase(), s]));

function formatTrainName(raw) {
  if (!raw) return '';
  let s = raw.trim()
    .replace(/\bEXP\b|\bEXPR\b/gi, 'Express')
    .replace(/\bSHTBD\b|\bSHTB\b/gi, 'Shatabdi')
    .replace(/\bRAJ\b/gi, 'Rajdhani')
    .replace(/\bSF\b/gi, 'Superfast')
    .replace(/\bDRNT\b|\bDRNTO\b/gi, 'Duronto')
    .replace(/\bJN\b|\bJNC\b/gi, 'Junction')
    .replace(/\bTRM\b/gi, 'Terminal')
    .replace(/\bNDLS\b/gi, 'New Delhi')
    .replace(/\bLJN\b/gi, 'Lucknow')
    .replace(/\bHWH\b/gi, 'Howrah')
    .replace(/\bC SHIVAJI MAH T\b/gi, 'CSMT Mumbai')
    .replace(/\bSWRAN\b/gi, 'Swarna')
    .replace(/\bSPL\b/gi, 'Special');

  return s.split(/\s+/).map(w => {
    if (['CSMT', 'NZM', 'DLI', 'ANVT', 'AC', 'EC', 'CC', '2S'].includes(w.toUpperCase())) return w.toUpperCase();
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
}

const cleanedTrains = [];

for (const [number, t] of Object.entries(rawTrains)) {
  const stationCodes = t.Stations || [];
  const fromCode = stationCodes[0] || '';
  const toCode = stationCodes[stationCodes.length - 1] || '';

  const fromStn = stationsMap.get(fromCode);
  const toStn = stationsMap.get(toCode);

  const formattedName = formatTrainName(t.Train_name || `Express ${number}`);

  cleanedTrains.push({
    number,
    name: formattedName,
    fromCode,
    fromName: fromStn?.name || t.From_station || fromCode,
    toCode,
    toName: toStn?.name || t.To_station || toCode,
    duration: t.Duration ? `${t.Duration.replace(':', 'h ')}m` : '12h 00m',
    distanceKm: t.Distance || 0,
    stopsCount: stationCodes.length,
    stations: stationCodes
  });
}

// Sort by train number
cleanedTrains.sort((a, b) => a.number.localeCompare(b.number));
console.log(`Normalized ${cleanedTrains.length} trains.`);

// Save trains.json in services/railway-service
const serverTrainsPath = path.join(__dirname, 'trains.json');
fs.writeFileSync(serverTrainsPath, JSON.stringify(cleanedTrains));
console.log(`Saved ${cleanedTrains.length} trains to ${serverTrainsPath}`);

// Save trains.json in client/src/data
const clientDataDir = path.join(__dirname, '../../client/src/data');
if (!fs.existsSync(clientDataDir)) {
  fs.mkdirSync(clientDataDir, { recursive: true });
}
const clientTrainsPath = path.join(clientDataDir, 'trains.json');
fs.writeFileSync(clientTrainsPath, JSON.stringify(cleanedTrains));
console.log(`Saved ${cleanedTrains.length} trains to ${clientTrainsPath}`);

// Also copy to client public/trains.json
const clientPublicPath = path.join(__dirname, '../../client/public/trains.json');
fs.writeFileSync(clientPublicPath, JSON.stringify(cleanedTrains));
console.log(`Saved ${cleanedTrains.length} trains to ${clientPublicPath}`);

// Seed into SQLite database
const db = new DatabaseSync(path.join(__dirname, 'railway.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS train_schedules (
    train_number TEXT,
    station_code TEXT,
    serial_no INTEGER,
    station_name TEXT,
    sch_arr TEXT,
    sch_dep TEXT,
    halt_time TEXT,
    distance_km INTEGER,
    day INTEGER,
    PRIMARY KEY (train_number, station_code)
  );

  CREATE INDEX IF NOT EXISTS idx_train_sched_num ON train_schedules(train_number);
`);

console.log('Seeding train schedules into SQLite...');
const insertSched = db.prepare(`
  INSERT OR REPLACE INTO train_schedules (train_number, station_code, serial_no, station_name, sch_arr, sch_dep, halt_time, distance_km, day)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

db.exec('BEGIN TRANSACTION');
let totalStoppagesSeeded = 0;

for (const [tNum, stnMap] of Object.entries(rawSchedules)) {
  for (const [stnCode, details] of Object.entries(stnMap)) {
    const stn = stationsMap.get(stnCode.toUpperCase());
    insertSched.run(
      tNum,
      stnCode.toUpperCase(),
      details.Serial_No || 0,
      stn?.name || details['Station Name'] || stnCode,
      details['Arrival Time'] || '--',
      details['Departure Time'] || '--',
      details['Halt Time'] || '--',
      details.Distance || 0,
      details.Day || 1
    );
    totalStoppagesSeeded++;
  }
}

db.exec('COMMIT');
console.log(`Successfully seeded ${totalStoppagesSeeded} stoppages across ${Object.keys(rawSchedules).length} trains into SQLite!`);
