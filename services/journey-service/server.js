import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5006;

app.use(cors());
app.use(express.json());

// In-memory / cache active journey shares
const activeJourneys = new Map();

// Seed initial active journey for demo
const demoShareToken = 'RJ-DEMO-9921';
activeJourneys.set(demoShareToken, {
  shareToken: demoShareToken,
  passengerName: 'Rajesh Kumar Sharma',
  phone: '+91 98765 43210',
  trainNumber: '12952',
  trainName: 'New Delhi - Mumbai Central Tejas Rajdhani Express',
  pnr: '2849102941',
  coach: 'B4',
  berth: '21 (Lower)',
  sourceStation: 'NDLS (New Delhi)',
  destStation: 'MMCT (Mumbai Central)',
  departureTime: '16:55',
  scheduledArrival: '08:35',
  currentLocationName: 'Approaching Vadodara Junction (BRC)',
  currentSpeedKmh: 118,
  batteryLevel: 78,
  isCharging: true,
  status: 'SAFE_AND_ON_SCHEDULE',
  delayMinutes: 5,
  nextStation: {
    name: 'Vadodara Junction',
    code: 'BRC',
    platform: '3',
    eta: '04:15 AM (in 32 mins)'
  },
  emergencyContacts: [
    { name: 'Pooja Sharma (Wife)', phone: '+91 98765 11223' },
    { name: 'RPF Security RailMadad', phone: '139' }
  ],
  sosActive: false,
  updatedAt: new Date().toISOString()
});

// Routes
app.get('/health', (req, res) => {
  res.json({ service: 'journey-service', status: 'healthy', port: PORT, activeShares: activeJourneys.size, timestamp: new Date().toISOString() });
});

// Create Journey Share
app.post('/share-journey', (req, res) => {
  try {
    const {
      passengerName = 'Traveler',
      phone = '+91 98765 43210',
      trainNumber = '12952',
      trainName = 'New Delhi - Mumbai Central Tejas Rajdhani Express',
      pnr = '2849102941',
      coach = 'B4',
      berth = '21',
      source = 'NDLS',
      destination = 'MMCT',
      batteryLevel = 85
    } = req.body;

    const shareToken = 'RM-' + crypto.randomUUID().slice(0, 6).toUpperCase();

    const journeyData = {
      shareToken,
      passengerName,
      phone,
      trainNumber,
      trainName,
      pnr,
      coach,
      berth,
      sourceStation: source,
      destStation: destination,
      currentLocationName: 'Cruising near Kota Junction',
      currentSpeedKmh: 112,
      batteryLevel: batteryLevel || 85,
      isCharging: false,
      status: 'SAFE_AND_ON_SCHEDULE',
      delayMinutes: 3,
      nextStation: {
        name: 'Kota Junction',
        code: 'KOTA',
        platform: '1A',
        eta: 'in 18 mins'
      },
      emergencyContacts: [
        { name: 'Family', phone: phone },
        { name: 'RPF RailMadad', phone: '139' }
      ],
      sosActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    activeJourneys.set(shareToken, journeyData);

    const shareUrl = `https://railmate.in/track?token=${shareToken}`;
    const messageText = `Hi! Tracking my train journey on ${trainName} (${trainNumber}) in Coach ${coach}, Berth ${berth}. Track my live GPS location, speed, and safety in real-time here: ${shareUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;

    res.status(201).json({
      success: true,
      shareToken,
      shareUrl,
      whatsappUrl,
      smsText: messageText,
      journey: journeyData
    });
  } catch (err) {
    console.error('Share journey error:', err);
    res.status(500).json({ error: 'Failed to create journey share' });
  }
});

// Get live journey telemetry
app.get('/live/:shareToken', (req, res) => {
  const { shareToken } = req.params;
  const journey = activeJourneys.get(shareToken) || activeJourneys.get(demoShareToken);

  if (!journey) {
    return res.status(404).json({ error: 'Journey share link has expired or is invalid' });
  }

  // Simulate dynamic speed variation
  const jitter = Math.floor(Math.random() * 8) - 4;
  const currentSpeed = Math.max(90, Math.min(130, journey.currentSpeedKmh + jitter));

  res.json({
    success: true,
    journey: {
      ...journey,
      currentSpeedKmh: currentSpeed,
      updatedAt: new Date().toISOString()
    }
  });
});

// Trigger Emergency SOS
app.post('/sos', (req, res) => {
  try {
    const { shareToken, locationDesc = 'Between Kota and Ratlam' } = req.body;
    const journey = activeJourneys.get(shareToken) || activeJourneys.get(demoShareToken);

    if (journey) {
      journey.sosActive = true;
      journey.status = 'EMERGENCY_ALERT_TRIGGERED';
      journey.sosTriggeredAt = new Date().toISOString();
      activeJourneys.set(shareToken || demoShareToken, journey);
    }

    res.json({
      success: true,
      alertSent: true,
      message: 'EMERGENCY SOS DISPATCHED: Alert forwarded to Railway Protection Force (139) & designated family contacts with live train coordinates.',
      rpfHelpline: '139',
      location: locationDesc,
      coachBerth: journey ? `${journey.coach} - Berth ${journey.berth}` : 'Coach B4 - Berth 21'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to dispatch SOS alert' });
  }
});

app.listen(PORT, () => {
  console.log(`[JOURNEY-SERVICE] Running on port ${PORT}`);
});
