import { offlineStorage } from './offlineStorage';

const API_BASE = '/api';

export const api = {
  // System Health
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch (e) {
      return { overallStatus: 'OFFLINE_MODE', error: e.message };
    }
  },

  // Auth
  async login(emailOrPhone, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, password })
    });
    return await res.json();
  },

  async sendOtp(phone) {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    return await res.json();
  },

  async verifyOtp(phone, otp) {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    return await res.json();
  },

  async register(name, email, phone, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });
    return await res.json();
  },

  // Railway & Where Is My Train
  async getStations(query = '') {
    try {
      const res = await fetch(`${API_BASE}/railway/stations?q=${encodeURIComponent(query)}`);
      return await res.json();
    } catch (e) {
      return { stations: [] };
    }
  },

  async searchTrains(from, to, date) {
    try {
      const res = await fetch(`${API_BASE}/railway/search-trains?from=${from}&to=${to}&date=${date || ''}`);
      return await res.json();
    } catch (e) {
      return { success: false, trains: [] };
    }
  },

  async getLiveTrainStatus(trainNumber) {
    try {
      const res = await fetch(`${API_BASE}/railway/live-status/${trainNumber}`);
      const data = await res.json();
      if (data.success) {
        await offlineStorage.cacheTrainSchedule(trainNumber, data);
      }
      return data;
    } catch (e) {
      // Offline fallback
      const cached = await offlineStorage.getCachedTrainSchedule(trainNumber);
      if (cached) return { ...cached, isOfflineData: true };
      throw e;
    }
  },

  async getPnrStatus(pnrNumber) {
    try {
      const res = await fetch(`${API_BASE}/railway/pnr/${pnrNumber}`);
      const data = await res.json();
      if (data.success) {
        await offlineStorage.setCachedPnr(pnrNumber, data);
      }
      return data;
    } catch (e) {
      // Offline fallback from local SQLite cache
      const cached = await offlineStorage.getCachedPnr(pnrNumber);
      if (cached) return { ...cached, isOfflineData: true };
      throw e;
    }
  },

  // Booking & Probability
  async predictProbability(wlNumber, bookingClass, daysUntilJourney, quota) {
    const res = await fetch(`${API_BASE}/booking/predict-probability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wlNumber, bookingClass, daysUntilJourney, quota })
    });
    return await res.json();
  },

  async createBooking(bookingData) {
    const res = await fetch(`${API_BASE}/booking/create-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    return await res.json();
  },

  async verifyUpiPayment(bookingId, upiRefNo, paymentMethod) {
    const res = await fetch(`${API_BASE}/booking/upi/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, upiRefNo, paymentMethod })
    });
    const data = await res.json();
    if (data.success && data.ticket) {
      await offlineStorage.saveOfflineTicket(data.ticket);
    }
    return data;
  },

  // Food Ordering
  async getStationRestaurants(stationCode) {
    const res = await fetch(`${API_BASE}/food/restaurants?stationCode=${stationCode || 'KOTA'}`);
    return await res.json();
  },

  async placeFoodOrder(orderData) {
    const res = await fetch(`${API_BASE}/food/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return await res.json();
  },

  async trackFoodOrder(orderId) {
    const res = await fetch(`${API_BASE}/food/order/${orderId}`);
    return await res.json();
  },

  // Destinations & Google Places
  async getFeaturedDestinations(query = '', category = '') {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (category && category !== 'all') params.append('category', category);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/destinations/featured-destinations${queryString}`);
    return await res.json();
  },

  async getDestination(id) {
    const res = await fetch(`${API_BASE}/destinations/destination/${id}`);
    return await res.json();
  },

  async searchGooglePlaces(query, stationCode) {
    const res = await fetch(`${API_BASE}/destinations/google-places-search?query=${encodeURIComponent(query)}&stationCode=${stationCode || 'NDLS'}`);
    return await res.json();
  },

  // Journey Sharing & Safety SOS
  async shareJourney(journeyData) {
    const res = await fetch(`${API_BASE}/journey/share-journey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(journeyData)
    });
    return await res.json();
  },

  async getLiveJourney(token) {
    const res = await fetch(`${API_BASE}/journey/live/${token}`);
    return await res.json();
  },

  async triggerEmergencySos(shareToken, locationDesc) {
    const res = await fetch(`${API_BASE}/journey/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareToken, locationDesc })
    });
    return await res.json();
  },

  // Voice AI, ChatGPT & Google Gemini API
  async processVoiceQuery(query, languageCode, preferredModel = 'chatgpt') {
    const res = await fetch(`${API_BASE}/voice-ai/process-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, languageCode, preferredModel })
    });
    return await res.json();
  },

  async askAiChat(prompt, languageCode) {
    const res = await fetch(`${API_BASE}/voice-ai/chat-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, languageCode })
    });
    return await res.json();
  },

  async askGeminiChat(prompt, languageCode) {
    return this.askAiChat(prompt, languageCode);
  },

  async getSupportedLanguages() {
    const res = await fetch(`${API_BASE}/voice-ai/supported-languages`);
    return await res.json();
  }
};
