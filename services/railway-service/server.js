import express from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Initialize SQLite database for cached train routes and live schedules
const db = new DatabaseSync(path.join(__dirname, 'railway.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS stations (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zone TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS trains (
    number TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    from_code TEXT NOT NULL,
    to_code TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    duration TEXT NOT NULL,
    distance_km INTEGER NOT NULL,
    classes TEXT NOT NULL,
    pantry_available INTEGER DEFAULT 1
  );
`);

// Popular Indian Railway Stations dataset
const STATIONS = [
  { code: 'NDLS', name: 'New Delhi Railway Station', city: 'New Delhi', state: 'Delhi', zone: 'NR' },
  { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra', zone: 'WR' },
  { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', state: 'Maharashtra', zone: 'CR' },
  { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal', zone: 'ER' },
  { code: 'MAS', name: 'Chennai Central', city: 'Chennai', state: 'Tamil Nadu', zone: 'SR' },
  { code: 'SBC', name: 'KSR Bengaluru City', city: 'Bengaluru', state: 'Karnataka', zone: 'SWR' },
  { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi', state: 'Uttar Pradesh', zone: 'NER' },
  { code: 'KOTA', name: 'Kota Junction', city: 'Kota', state: 'Rajasthan', zone: 'WCR' },
  { code: 'BPL', name: 'Bhopal Junction', city: 'Bhopal', state: 'Madhya Pradesh', zone: 'WCR' },
  { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad', state: 'Gujarat', zone: 'WR' },
  { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', state: 'Uttar Pradesh', zone: 'NCR' },
  { code: 'PRYJ', name: 'Prayagraj Junction', city: 'Prayagraj', state: 'Uttar Pradesh', zone: 'NCR' },
  { code: 'PNBE', name: 'Patna Junction', city: 'Patna', state: 'Bihar', zone: 'ECR' },
  { code: 'HYB', name: 'Hyderabad Deccan', city: 'Hyderabad', state: 'Telangana', zone: 'SCR' },
  { code: 'TVC', name: 'Thiruvananthapuram Central', city: 'Trivandrum', state: 'Kerala', zone: 'SR' },
  { code: 'GOA', name: 'Madgaon Junction', city: 'Goa', state: 'Goa', zone: 'KR' },
  { code: 'JAT', name: 'Jammu Tawi', city: 'Jammu', state: 'Jammu & Kashmir', zone: 'NR' },
  { code: 'SVDK', name: 'Shri Mata Vaishno Devi Katra', city: 'Katra', state: 'Jammu & Kashmir', zone: 'NR' }
];

// Seed stations
const stationInsert = db.prepare(`
  INSERT OR IGNORE INTO stations (code, name, city, state, zone)
  VALUES (?, ?, ?, ?, ?)
`);
for (const s of STATIONS) {
  stationInsert.run(s.code, s.name, s.city, s.state, s.zone);
}

// Comprehensive train database
const TRAINS = [
  {
    number: '12952',
    name: 'New Delhi - Mumbai Central Tejas Rajdhani Express',
    type: 'Tejas Rajdhani',
    from_code: 'NDLS',
    to_code: 'MMCT',
    departure_time: '16:55',
    arrival_time: '08:35',
    duration: '15h 40m',
    distance_km: 1386,
    classes: '1A,2A,3A',
    pantry_available: 1,
    schedule: [
      { code: 'NDLS', name: 'New Delhi', day: 1, schArr: 'Source', schDep: '16:55', actArr: 'Source', actDep: '16:55', delayMin: 0, platform: '1', distance: 0, status: 'Departed' },
      { code: 'KOTA', name: 'Kota Junction', day: 1, schArr: '21:30', schDep: '21:40', actArr: '21:35', actDep: '21:45', delayMin: 5, platform: '1A', distance: 465, status: 'Departed' },
      { code: 'RTM', name: 'Ratlam Junction', day: 2, schArr: '00:55', schDep: '01:00', actArr: '01:02', actDep: '01:07', delayMin: 7, platform: '4', distance: 731, status: 'Departed' },
      { code: 'BRC', name: 'Vadodara Junction', day: 2, schArr: '04:05', schDep: '04:15', actArr: '04:10', actDep: '04:20', delayMin: 5, platform: '3', distance: 992, status: 'Approaching' },
      { code: 'ST', name: 'Surat', day: 2, schArr: '05:48', schDep: '05:53', actArr: '05:50', actDep: '05:55', delayMin: 2, platform: '2', distance: 1122, status: 'Upcoming' },
      { code: 'BVI', name: 'Borivali', day: 2, schArr: '07:40', schDep: '07:42', actArr: '07:40', actDep: '07:42', delayMin: 0, platform: '7', distance: 1356, status: 'Upcoming' },
      { code: 'MMCT', name: 'Mumbai Central', day: 2, schArr: '08:35', schDep: 'Destination', actArr: '08:35', actDep: 'Destination', delayMin: 0, platform: '1', distance: 1386, status: 'Upcoming' }
    ]
  },
  {
    number: '22436',
    name: 'New Delhi - Varanasi Vande Bharat Express',
    type: 'Vande Bharat',
    from_code: 'NDLS',
    to_code: 'BSB',
    departure_time: '06:00',
    arrival_time: '14:00',
    duration: '8h 00m',
    distance_km: 759,
    classes: 'CC,EC',
    pantry_available: 1,
    schedule: [
      { code: 'NDLS', name: 'New Delhi', day: 1, schArr: 'Source', schDep: '06:00', actArr: 'Source', actDep: '06:00', delayMin: 0, platform: '16', distance: 0, status: 'Departed' },
      { code: 'CNB', name: 'Kanpur Central', day: 1, schArr: '10:08', schDep: '10:10', actArr: '10:10', actDep: '10:12', delayMin: 2, platform: '1', distance: 441, status: 'Departed' },
      { code: 'PRYJ', name: 'Prayagraj Junction', day: 1, schArr: '12:08', schDep: '12:10', actArr: '12:09', actDep: '12:11', delayMin: 1, platform: '6', distance: 635, status: 'Approaching' },
      { code: 'BSB', name: 'Varanasi Junction', day: 1, schArr: '14:00', schDep: 'Destination', actArr: '14:00', actDep: 'Destination', delayMin: 0, platform: '1', distance: 759, status: 'Upcoming' }
    ]
  },
  {
    number: '12009',
    name: 'Mumbai Central - Ahmedabad Shatabdi Express',
    type: 'Shatabdi',
    from_code: 'MMCT',
    to_code: 'ADI',
    departure_time: '06:20',
    arrival_time: '12:45',
    duration: '6h 25m',
    distance_km: 493,
    classes: 'CC,EC',
    pantry_available: 1,
    schedule: [
      { code: 'MMCT', name: 'Mumbai Central', day: 1, schArr: 'Source', schDep: '06:20', actArr: 'Source', actDep: '06:20', delayMin: 0, platform: '1', distance: 0, status: 'Departed' },
      { code: 'BVI', name: 'Borivali', day: 1, schArr: '06:48', schDep: '06:50', actArr: '06:48', actDep: '06:50', delayMin: 0, platform: '6', distance: 30, status: 'Departed' },
      { code: 'ST', name: 'Surat', day: 1, schArr: '09:22', schDep: '09:25', actArr: '09:24', actDep: '09:27', delayMin: 2, platform: '1', distance: 263, status: 'Approaching' },
      { code: 'BRC', name: 'Vadodara Junction', day: 1, schArr: '10:48', schDep: '10:53', actArr: '10:50', actDep: '10:55', delayMin: 2, platform: '2', distance: 392, status: 'Upcoming' },
      { code: 'ADI', name: 'Ahmedabad Junction', day: 1, schArr: '12:45', schDep: 'Destination', actArr: '12:45', actDep: 'Destination', delayMin: 0, platform: '1', distance: 493, status: 'Upcoming' }
    ]
  },
  {
    number: '12301',
    name: 'Howrah - New Delhi Rajdhani Express',
    type: 'Rajdhani',
    from_code: 'HWH',
    to_code: 'NDLS',
    departure_time: '16:50',
    arrival_time: '10:05',
    duration: '17h 15m',
    distance_km: 1451,
    classes: '1A,2A,3A',
    pantry_available: 1,
    schedule: [
      { code: 'HWH', name: 'Howrah Junction', day: 1, schArr: 'Source', schDep: '16:50', actArr: 'Source', actDep: '16:50', delayMin: 0, platform: '9', distance: 0, status: 'Departed' },
      { code: 'ASN', name: 'Asansol Junction', day: 1, schArr: '18:57', schDep: '19:00', actArr: '19:05', actDep: '19:08', delayMin: 8, platform: '4', distance: 200, status: 'Departed' },
      { code: 'DHN', name: 'Dhanbad Junction', day: 1, schArr: '19:55', schDep: '20:00', actArr: '20:02', actDep: '20:07', delayMin: 7, platform: '3', distance: 259, status: 'Approaching' },
      { code: 'PRYJ', name: 'Prayagraj Junction', day: 2, schArr: '02:33', schDep: '02:35', actArr: '02:38', actDep: '02:40', delayMin: 5, platform: '1', distance: 820, status: 'Upcoming' },
      { code: 'CNB', name: 'Kanpur Central', day: 2, schArr: '04:40', schDep: '04:45', actArr: '04:42', actDep: '04:47', delayMin: 2, platform: '1', distance: 1014, status: 'Upcoming' },
      { code: 'NDLS', name: 'New Delhi', day: 2, schArr: '10:05', schDep: 'Destination', actArr: '10:05', actDep: 'Destination', delayMin: 0, platform: '13', distance: 1451, status: 'Upcoming' }
    ]
  },
  {
    number: '20607',
    name: 'MGR Chennai Central - Mysuru Vande Bharat Express',
    type: 'Vande Bharat',
    from_code: 'MAS',
    to_code: 'SBC',
    departure_time: '05:50',
    arrival_time: '10:20',
    duration: '4h 30m',
    distance_km: 359,
    classes: 'CC,EC',
    pantry_available: 1,
    schedule: [
      { code: 'MAS', name: 'MGR Chennai Central', day: 1, schArr: 'Source', schDep: '05:50', actArr: 'Source', actDep: '05:50', delayMin: 0, platform: '2', distance: 0, status: 'Departed' },
      { code: 'KPD', name: 'Katpadi Junction', day: 1, schArr: '07:13', schDep: '07:15', actArr: '07:13', actDep: '07:15', delayMin: 0, platform: '1', distance: 130, status: 'Departed' },
      { code: 'SBC', name: 'KSR Bengaluru City', day: 1, schArr: '10:20', schDep: 'Destination', actArr: '10:20', actDep: 'Destination', delayMin: 0, platform: '7', distance: 359, status: 'Approaching' }
    ]
  }
];

// Seed trains
const trainInsert = db.prepare(`
  INSERT OR IGNORE INTO trains (number, name, type, from_code, to_code, departure_time, arrival_time, duration, distance_km, classes, pantry_available)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const t of TRAINS) {
  trainInsert.run(t.number, t.name, t.type, t.from_code, t.to_code, t.departure_time, t.arrival_time, t.duration, t.distance_km, t.classes, t.pantry_available);
}

// Routes

app.get('/health', (req, res) => {
  res.json({ service: 'railway-service', status: 'healthy', port: PORT, activeTrains: TRAINS.length, timestamp: new Date().toISOString() });
});

// Station search
app.get('/stations', (req, res) => {
  const query = (req.query.q || '').toLowerCase();
  if (!query) {
    return res.json({ stations: STATIONS.slice(0, 10) });
  }
  const filtered = STATIONS.filter(s => 
    s.code.toLowerCase().includes(query) ||
    s.name.toLowerCase().includes(query) ||
    s.city.toLowerCase().includes(query)
  );
  res.json({ stations: filtered });
});

// Train search between stations
app.get('/search-trains', (req, res) => {
  const { from = 'NDLS', to = 'MMCT', date } = req.query;
  const matches = TRAINS.filter(t => 
    (t.from_code === from.toUpperCase() && t.to_code === to.toUpperCase()) ||
    t.schedule.some(s => s.code === from.toUpperCase()) && t.schedule.some(s => s.code === to.toUpperCase())
  );

  // If no direct predefined match, return realistic train connections
  const result = matches.length > 0 ? matches : [
    {
      number: '12952',
      name: `${from.toUpperCase()} - ${to.toUpperCase()} Superfast Express`,
      type: 'Superfast',
      from_code: from.toUpperCase(),
      to_code: to.toUpperCase(),
      departure_time: '17:15',
      arrival_time: '08:45',
      duration: '15h 30m',
      distance_km: 1240,
      classes: '1A,2A,3A,SL',
      pantry_available: 1,
      fares: { '1A': 4150, '2A': 2490, '3A': 1750, 'SL': 650 },
      availability: {
        '1A': { status: 'AVAILABLE 12', color: 'green', prob: 100 },
        '2A': { status: 'AVAILABLE 4', color: 'green', prob: 100 },
        '3A': { status: 'RAC 14', color: 'amber', prob: 88 },
        'SL': { status: 'GNWL 38', color: 'red', prob: 64 }
      }
    },
    {
      number: '22436',
      name: `${from.toUpperCase()} - ${to.toUpperCase()} Vande Bharat Express`,
      type: 'Vande Bharat',
      from_code: from.toUpperCase(),
      to_code: to.toUpperCase(),
      departure_time: '06:00',
      arrival_time: '14:15',
      duration: '8h 15m',
      distance_km: 760,
      classes: 'CC,EC',
      pantry_available: 1,
      fares: { 'EC': 3120, 'CC': 1750 },
      availability: {
        'EC': { status: 'AVAILABLE 18', color: 'green', prob: 100 },
        'CC': { status: 'AVAILABLE 42', color: 'green', prob: 100 }
      }
    }
  ];

  res.json({
    success: true,
    from: from.toUpperCase(),
    to: to.toUpperCase(),
    date: date || new Date().toISOString().split('T')[0],
    totalTrains: result.length,
    trains: result.map(t => ({
      ...t,
      fares: t.fares || { '1A': 4200, '2A': 2550, '3A': 1800, 'CC': 1650, 'EC': 2950, 'SL': 680 },
      availability: t.availability || {
        '1A': { status: 'AVAILABLE 6', color: 'green', prob: 100 },
        '2A': { status: 'AVAILABLE 14', color: 'green', prob: 100 },
        '3A': { status: 'WL 12', color: 'amber', prob: 84 },
        'CC': { status: 'AVAILABLE 28', color: 'green', prob: 100 },
        'EC': { status: 'AVAILABLE 8', color: 'green', prob: 100 }
      }
    }))
  });
});

// Where Is My Train API: Live train running status
app.get('/live-status/:trainNumber', (req, res) => {
  const { trainNumber } = req.params;
  const train = TRAINS.find(t => t.number === trainNumber) || TRAINS[0];

  // Dynamic simulation of current station and progress
  const currentStoppage = train.schedule.find(s => s.status === 'Approaching') || train.schedule[1];
  const lastDeparted = train.schedule.find(s => s.status === 'Departed') || train.schedule[0];

  res.json({
    success: true,
    trainNumber: train.number,
    trainName: train.name,
    type: train.type,
    runningStatus: currentStoppage.delayMin === 0 ? 'On Time' : `Delayed by ${currentStoppage.delayMin} mins`,
    delayMinutes: currentStoppage.delayMin,
    currentSpeedKmh: 114,
    lastStation: {
      code: lastDeparted.code,
      name: lastDeparted.name,
      departedAt: lastDeparted.actDep,
      distanceFromSource: lastDeparted.distance
    },
    upcomingStation: {
      code: currentStoppage.code,
      name: currentStoppage.name,
      platform: currentStoppage.platform,
      scheduledArrival: currentStoppage.schArr,
      estimatedArrival: currentStoppage.actArr,
      distanceRemainingKm: 42,
      etaMinutes: 24
    },
    nextStoppages: train.schedule.filter(s => s.status === 'Upcoming' || s.status === 'Approaching'),
    fullSchedule: train.schedule,
    gpsCoordinates: {
      latitude: 24.5854,
      longitude: 75.8342,
      heading: 198,
      altitudeMeters: 271,
      lastUpdated: new Date().toLocaleTimeString('en-IN')
    },
    coachComposition: [
      { code: 'ENG', type: 'WAP-7 Locomotive' },
      { code: 'EOG', type: 'End on Generation Car' },
      { code: 'H1', type: 'First AC (1A)' },
      { code: 'A1', type: 'AC 2-Tier (2A)' },
      { code: 'A2', type: 'AC 2-Tier (2A)' },
      { code: 'B1', type: 'AC 3-Tier (3A)' },
      { code: 'B2', type: 'AC 3-Tier (3A)' },
      { code: 'B3', type: 'AC 3-Tier (3A)' },
      { code: 'B4', type: 'AC 3-Tier (3A)' },
      { code: 'PC', type: 'Pantry Car' },
      { code: 'B5', type: 'AC 3-Tier (3A)' },
      { code: 'B6', type: 'AC 3-Tier (3A)' },
      { code: 'SLR', type: 'Seating cum Luggage' }
    ]
  });
});

// ConfirmTkt & IRCTC PNR Status lookup
app.get('/pnr/:pnrNumber', (req, res) => {
  const { pnrNumber } = req.params;
  const cleanPnr = pnrNumber.replace(/\D/g, '');

  if (cleanPnr.length !== 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit Indian Railways PNR number' });
  }

  // Deterministic realistic generator for any 10-digit PNR
  const seed = parseInt(cleanPnr.slice(-4), 10) || 1234;
  const isConfirmed = seed % 3 !== 0; // 66% confirmed
  const isRac = !isConfirmed && (seed % 2 === 0);

  const selectedTrain = TRAINS[seed % TRAINS.length];
  const coachTypes = ['B1', 'B2', 'B3', 'B4', 'A1', 'A2', 'C1', 'C2', 'H1'];
  const coach = coachTypes[seed % coachTypes.length];
  const berth = (seed % 72) + 1;
  const berthType = berth % 8 === 1 || berth % 8 === 4 ? 'Lower' : 
                    berth % 8 === 2 || berth % 8 === 5 ? 'Middle' : 
                    berth % 8 === 3 || berth % 8 === 6 ? 'Upper' : 
                    berth % 8 === 7 ? 'Side Lower' : 'Side Upper';

  const bookingStatus = isConfirmed ? `CNF/${coach}/${berth}` : (isRac ? `RAC ${seed % 15 + 1}` : `GNWL ${seed % 25 + 1}`);
  const currentStatus = isConfirmed ? `CNF/${coach}/${berth}` : (isRac ? `RAC ${seed % 10 + 1}` : `WL ${seed % 12 + 1}`);
  const confirmProbability = isConfirmed ? 100 : (isRac ? 92 : 68);

  res.json({
    success: true,
    pnr: cleanPnr,
    trainNumber: selectedTrain.number,
    trainName: selectedTrain.name,
    fromStation: { code: selectedTrain.from_code, name: selectedTrain.schedule[0].name },
    toStation: { code: selectedTrain.to_code, name: selectedTrain.schedule[selectedTrain.schedule.length - 1].name },
    dateOfJourney: new Date(Date.now() + 86400000 * 2).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    boardingStation: selectedTrain.from_code,
    reservationUpto: selectedTrain.to_code,
    journeyClass: coach.startsWith('C') ? 'CC' : (coach.startsWith('A') ? '2A' : (coach.startsWith('H') ? '1A' : '3A')),
    quota: 'GN (General)',
    chartingStatus: isConfirmed ? 'CHART NOT PREPARED (Coach Assigned)' : 'CHART NOT PREPARED',
    platformNumber: selectedTrain.schedule[0].platform || '1',
    confirmationProbability: confirmProbability,
    passengers: [
      {
        number: 1,
        name: 'Passenger 1',
        bookingStatus: bookingStatus,
        currentStatus: currentStatus,
        coach: isConfirmed ? coach : 'N/A',
        berthNumber: isConfirmed ? berth : 'N/A',
        berthType: isConfirmed ? berthType : 'N/A',
        statusDesc: isConfirmed ? 'Confirmed' : (isRac ? 'Reservation Against Cancellation' : 'Waitlisted')
      },
      {
        number: 2,
        name: 'Passenger 2',
        bookingStatus: bookingStatus,
        currentStatus: currentStatus,
        coach: isConfirmed ? coach : 'N/A',
        berthNumber: isConfirmed ? (berth + 1) : 'N/A',
        berthType: isConfirmed ? 'Middle' : 'N/A',
        statusDesc: isConfirmed ? 'Confirmed' : (isRac ? 'Reservation Against Cancellation' : 'Waitlisted')
      }
    ],
    alternateOptions: confirmProbability < 80 ? [
      {
        type: 'ConfirmTkt Same Route',
        recommendation: `Try booking in Tatkal Quota for ${selectedTrain.name} at 10:00 AM tomorrow`,
        successChance: '95%'
      },
      {
        type: 'Alternative Train',
        recommendation: `Train 22436 Vande Bharat has 18 seats available in CC`,
        successChance: '100%'
      }
    ] : []
  });
});

app.listen(PORT, () => {
  console.log(`[RAILWAY-SERVICE] Running on port ${PORT}`);
});
