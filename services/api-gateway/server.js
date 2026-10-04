import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Service registry
const SERVICES = {
  auth: { url: 'http://127.0.0.1:5001', name: 'Auth & User Service' },
  railway: { url: 'http://127.0.0.1:5002', name: 'Railway & Live GPS Service' },
  booking: { url: 'http://127.0.0.1:5003', name: 'Booking & UPI Payment Service' },
  food: { url: 'http://127.0.0.1:5004', name: 'Food & IRCTC e-Catering Service' },
  destinations: { url: 'http://127.0.0.1:5005', name: 'Destination & Google Places Service' },
  journey: { url: 'http://127.0.0.1:5006', name: 'Real-time Journey Sharing Service' },
  'voice-ai': { url: 'http://127.0.0.1:5007', name: 'Voice & Sarvam AI NLP Service' }
};

// Generic proxy forwarding helper using native fetch
async function proxyRequest(targetBaseUrl, req, res) {
  const targetUrl = `${targetBaseUrl}${req.url}`;
  
  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {})
      }
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (err) {
    console.error(`[GATEWAY-ERR] Forwarding failed to ${targetUrl}:`, err.message);
    res.status(503).json({
      error: `Downstream microservice unreachable: ${targetUrl}`,
      details: err.message,
      gatewayTimestamp: new Date().toISOString()
    });
  }
}

// Microservice Routes Mapping
app.use('/api/auth', (req, res) => proxyRequest(SERVICES.auth.url, req, res));
app.use('/api/railway', (req, res) => proxyRequest(SERVICES.railway.url, req, res));
app.use('/api/booking', (req, res) => proxyRequest(SERVICES.booking.url, req, res));
app.use('/api/food', (req, res) => proxyRequest(SERVICES.food.url, req, res));
app.use('/api/destinations', (req, res) => proxyRequest(SERVICES.destinations.url, req, res));
app.use('/api/journey', (req, res) => proxyRequest(SERVICES.journey.url, req, res));
app.use('/api/voice-ai', (req, res) => proxyRequest(SERVICES['voice-ai'].url, req, res));

// System-wide Health Check & Microservices Dashboard
app.get('/api/health', async (req, res) => {
  const healthResults = {};
  let overallHealthy = true;

  for (const [key, svc] of Object.entries(SERVICES)) {
    const startTime = Date.now();
    try {
      const response = await fetch(`${svc.url}/health`, { signal: AbortSignal.timeout(1500) });
      const latency = Date.now() - startTime;
      if (response.ok) {
        const body = await response.json();
        healthResults[key] = {
          name: svc.name,
          status: 'UP',
          latencyMs: latency,
          details: body
        };
      } else {
        overallHealthy = false;
        healthResults[key] = { name: svc.name, status: 'DEGRADED', latencyMs: latency };
      }
    } catch (e) {
      overallHealthy = false;
      healthResults[key] = { name: svc.name, status: 'DOWN', error: e.message };
    }
  }

  res.json({
    gateway: 'RailMate API Gateway v1.0',
    overallStatus: overallHealthy ? 'ALL_SERVICES_OPERATIONAL' : 'PARTIAL_OUTAGE',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: healthResults
  });
});

app.listen(PORT, () => {
  console.log(`[API-GATEWAY] Running on port ${PORT}`);
  console.log(`[API-GATEWAY] Routing 7 microservices under /api/*`);
});
