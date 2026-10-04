# RailMate: Microservices Architecture Blueprint

```
                                 ┌──────────────────────────────────────────────┐
                                 │          RailMate Web & PWA Client           │
                                 │     (React 18, Tailwind CSS, Lucide Icons)   │
                                 │     Port: 3000 | Offline SQLite Cache        │
                                 └──────────────────────┬───────────────────────┘
                                                        │
                                            HTTP Proxy to /api/*
                                                        │
                                                        ▼
                                 ┌──────────────────────────────────────────────┐
                                 │          RailMate API Gateway                │
                                 │     Port: 5050 (Express Reverse Proxy)       │
                                 │     - Route Dispatch & Rate Limiting         │
                                 │     - Central Health Heartbeat Monitor       │
                                 │     - Resilient Fallback Handling            │
                                 └───────┬──────┬──────┬──────┬──────┬───┬───┬───┘
                                         │      │      │      │      │   │   │
        ┌────────────────────────────────┘      │      │      │      │   │   └────────────────────────────────┐
        ▼                                       ▼      ▼      ▼      ▼   ▼                                    ▼
┌──────────────────┐                  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ ┌──────────────────┐
│   Auth Service   │                  │ Railway  │ │ Booking  │ │   Food   │ │ Destina- │ │ Journey Sharing  │ │ Voice & Sarvam   │
│   (Port 5001)    │                  │ Service  │ │ Service  │ │ Service  │ │  tions   │ │   (Port 5006)    │ │ AI Indic NLP     │
│ - User Auth      │                  │ (Port    │ │ (Port    │ │ (Port    │ │ (Port    │ │ - Live GPS &     │ │   (Port 5007)    │
│ - Mobile OTP     │                  │  5002)   │ │  5003)   │ │  5004)   │ │  5005)   │ │   Speed Telemetry│ │ - Sarvam Saaras   │
│ - Saved Co-Pass. │                  │ - Where- │ │ - Seat   │ │ - Zomato │ │ - Google │ │ - WhatsApp Link  │ │   STT & Bulbul   │
│ - RailCoins Club │                  │   IsMy-  │ │   Lock   │ │   e-Cater│ │   Places │ │ - Phone Battery % │ │   Regional TTS   │
│ [auth.sqlite]    │                  │   Train  │ │ - Direct │ │ - Seat   │ │ - Photo  │ │ - RPF 139 SOS    │ │ - 9 Indic Langs  │
└──────────────────┘                  │ - PNR    │ │   UPI QR │ │   Delivery││   Guides │ └──────────────────┘ └──────────────────┘
                                      │   Confirm│ │ - ML WL  │ │ - Status │ │ - Check- │
                                      │   Tkt    │ │   Prob.  │ │   Tracker│ │   lists  │
                                      │[railway. │ │[booking. │ │[food.    │ └──────────┘
                                      │ sqlite]  │ │ sqlite]  │ │ sqlite]  │
                                      └──────────┘ └──────────┘ └──────────┘
```

---

## Service Registry & Ports

| Service Name | Port | Database | Primary External Integrations / APIs |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `5050` | In-memory route table | Reverse proxy routing, rate-limit, health aggregation |
| **Auth Service** | `5001` | `auth.sqlite` | SMS OTP simulation, JWT authentication, user profiles |
| **Railway Service** | `5002` | `railway.sqlite` | Where Is My Train API, ConfirmTkt API, IRCTC timetable |
| **Booking Service** | `5003` | `booking.sqlite` | NPCI UPI Deep Links (`upi://pay`), QR Code, ML probability |
| **Food Service** | `5004` | `food.sqlite` | Zomato API, Swiggy, IRCTC e-Catering station catalog |
| **Destination Service** | `5005` | Static / JSON | Google Places API, high-res photography CDN |
| **Journey Service** | `5006` | In-memory + SSE | Live GPS telemetry broadcaster, WhatsApp API, RPF 139 |
| **Voice AI Service** | `5007` | Sarvam AI REST | Sarvam Saaras STT, Bulbul TTS, Indic NLU intent engine |
| **Client Frontend** | `3000` | SQLite / IndexedDB | WebAssembly SQLite, React 18, Tailwind CSS, Lucide |

---

## Offline SQLite & Room DB Synchronization

Rail journeys often pass through mountain gorges, remote plains, and tunnels where cellular coverage drops. RailMate implements a dual-layer local caching engine:

1. **Client-Side SQLite / IndexedDB Store**:
   - `pnr_cache`: Stores the latest passenger list, coach assignment, and charting status.
   - `tickets_cache`: Stores full confirmed boarding passes with printable barcodes.
   - `schedules_cache`: Stores complete station-by-station timetables and platform numbers.
   - `checklist_cache`: Keeps travelers' interactive packing lists and sightseeing checklists.
2. **Auto-Fallback Engine**:
   - When network calls fail or when `navigator.onLine` is false, `api.js` transparently queries the local database without throwing errors or breaking UI state.
   - An amber notification bar appears indicating *"Offline Mode Active: Utilizing local SQLite & IndexedDB cache"*.
