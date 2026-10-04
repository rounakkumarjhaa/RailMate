# 🚆 RailMate — AI-Powered Microservices Travel Assistant

**RailMate** is a microservices-based Indian Railways smart travel assistant featuring a distinctive, visually appealing user interface with Indian flag tricolor accents, dark mode glassmorphism, offline SQLite caching, direct UPI payments, real-time train tracking, in-seat food ordering, and comprehensive regional language NLP powered by **Sarvam AI**.

---

## 🌟 Key Features

### 1. ⚡ Microservices Architecture (7 Independent Services + Gateway)
- **API Gateway (`Port 5050`)**: Central entry point with routing, proxying, and a live health monitor.
- **Auth Service (`Port 5001`)**: Mobile OTP verification, email/password login, user profile, RailCoins loyalty points, and saved co-passengers for 1-click Tatkal booking.
- **Railway Service (`Port 5002`)**: Real-time **ConfirmTkt** PNR status & **Where Is My Train** live GPS telemetry, speed gauges, delay calculation, and platform numbers.
- **Booking & Probability Service (`Port 5003`)**: Train seat reservation engine and ML/heuristic **Waiting List Confirmation Probability Engine** with direct **NPCI UPI** deep linking and dynamic QR codes.
- **Food Delivery Service (`Port 5004`)**: **Zomato & IRCTC e-Catering** in-seat delivery system synchronized with live train arrival ETA at upcoming stations.
- **Destination Guide Service (`Port 5005`)**: Curated Indian scenic rail routes, high-resolution photo galleries, interactive travel checklists, and **Google Places API** station amenities explorer.
- **Real-Time Journey Sharing Service (`Port 5006`)**: Share live tracking links with family via 1-click WhatsApp with live speed, battery level, next station ETA, and emergency RPF 139 SOS dispatch.
- **Voice AI & Regional NLP Service (`Port 5007`)**: Native Indic language assistant powered by **Sarvam AI** (Saaras STT, Bulbul TTS, Mayura Translation) supporting Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, and English.

### 2. 💳 Direct UPI Payment Engine
- Dynamic NPCI-compliant UPI URI generation (`upi://pay?pa=railmate.irctc@icici&pn=...&am=...&tr=...`).
- Crisp SVG QR code display for instant scanning.
- 1-click deep link intents for **Google Pay, PhonePe, Paytm, BHIM, and CRED**.
- Instant test verification simulation that verifies the transaction and generates a confirmed e-ticket with barcode and coach/berth assignment.

### 3. 💾 Offline Data Caching (Local SQLite / Room Engine)
- Zero-connectivity resilience inside train tunnels and remote sections.
- Caches PNR lookups, confirmed digital boarding passes, full station schedules, and interactive checklists into a local persistent database.
- Automatic offline detection and recovery without interrupting the traveler experience.

### 4. 🎙️ Sarvam AI Indic Regional Voice Assistant
- Speaks and understands natural language queries across major Indian languages:
  - **Hindi (हिन्दी)**: *"मेरी ट्रेन 12952 कहां तक पहुंची?"*
  - **Tamil (தமிழ்)**: *"ரயில் 12952 எங்குள்ளது?"*
  - **English**: *"Check PNR 2849102941 status"*
- Intent classifier automatically navigates to the requested feature in the application.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (Verified with Node.js v24)
- **npm** v9+

### 2. Install Dependencies
```bash
# In the root directory:
npm install

# In the client directory:
cd client && npm install && cd ..
```

### 3. Start the Application

You can start the entire microservices cluster and the frontend with one command:

```bash
# Terminal 1: Launch all 8 backend microservices
node orchestrator.js

# Terminal 2: Launch the React Vite frontend
npm run dev:client
```

- **Frontend App**: Open [http://localhost:3000](http://localhost:3000)
- **API Gateway**: Running on [http://localhost:5050](http://localhost:5050)
- **Cluster Health Monitor**: Open [http://localhost:5050/api/health](http://localhost:5050/api/health)

---

## 🧪 Verification & Testing

To test all 11 microservice endpoints and end-to-end integration:

```bash
# Run the integration test suite
node test-e2e.js
```

---

## 📂 Project Structure

```
RailMate/
├── architecture.md                    # Microservices blueprint & network diagram
├── orchestrator.js                    # Unified microservices launcher & logger
├── test-e2e.js                        # End-to-end API gateway test suite
├── test-services.js                   # Healthcheck test script
├── package.json                       # Root scripts and dependencies
├── services/
│   ├── api-gateway/                   # Port 5050: Central Reverse Proxy
│   ├── auth-service/                  # Port 5001: User Auth & Passengers (SQLite)
│   ├── railway-service/               # Port 5002: WhereIsMyTrain & ConfirmTkt (SQLite)
│   ├── booking-service/               # Port 5003: Seat Lock, ML Probability & UPI (SQLite)
│   ├── food-service/                  # Port 5004: Station Menus & Seat Delivery (SQLite)
│   ├── destination-service/           # Port 5005: Google Places & Photo Checklists
│   ├── journey-service/               # Port 5006: Real-time Telemetry & SOS
│   └── voice-ai-service/              # Port 5007: Sarvam AI Indic Regional NLP
└── client/                            # Port 3000: Vite + React 18 + Tailwind CSS
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── components/
        │   ├── Navbar.jsx
        │   ├── LiveTrainTracker.jsx
        │   ├── PnrStatusChecker.jsx
        │   ├── TicketBookingPortal.jsx
        │   ├── ConfirmationPredictor.jsx
        │   ├── UpiPaymentModal.jsx
        │   ├── FoodOrderingSystem.jsx
        │   ├── DestinationChecklist.jsx
        │   ├── JourneyShareModal.jsx
        │   ├── VoiceAssistantModal.jsx
        │   ├── AuthModal.jsx
        │   └── MicroservicesStatusModal.jsx
        ├── services/
        │   ├── api.js
        │   └── offlineStorage.js      # Room / SQLite persistent caching engine
        └── data/
            └── translations.js        # Indic regional language dictionary
```

---

## 🛡️ License
MIT License. Built for modern Indian Railway travelers.
