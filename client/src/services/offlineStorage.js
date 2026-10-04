// Offline Data Caching Engine (Room / SQLite equivalent schema for browser & hybrid app)
const DB_NAME = 'RailMate_Offline_SQLite_DB';
const DB_VERSION = 1;

class OfflineStorageEngine {
  constructor() {
    this.db = null;
    this.isReady = false;
    this.init();
  }

  init() {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        this.fallbackMemory = {};
        resolve();
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // SQLite-like tables
        if (!db.objectStoreNames.contains('pnr_cache')) {
          db.createObjectStore('pnr_cache', { keyPath: 'pnr' });
        }
        if (!db.objectStoreNames.contains('tickets_cache')) {
          db.createObjectStore('tickets_cache', { keyPath: 'pnr' });
        }
        if (!db.objectStoreNames.contains('schedules_cache')) {
          db.createObjectStore('schedules_cache', { keyPath: 'trainNumber' });
        }
        if (!db.objectStoreNames.contains('checklist_cache')) {
          db.createObjectStore('checklist_cache', { keyPath: 'destinationId' });
        }
        if (!db.objectStoreNames.contains('settings_cache')) {
          db.createObjectStore('settings_cache', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isReady = true;
        this.seedInitialOfflineDefaults();
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.warn('IndexedDB unavailable, falling back to localStorage');
        resolve(null);
      };
    });
  }

  // Seed default data so user has immediate offline access even on first launch without internet
  seedInitialOfflineDefaults() {
    this.setCachedPnr('2849102941', {
      pnr: '2849102941',
      trainNumber: '12952',
      trainName: 'New Delhi - Mumbai Central Tejas Rajdhani Express',
      fromStation: { code: 'NDLS', name: 'New Delhi' },
      toStation: { code: 'MMCT', name: 'Mumbai Central' },
      dateOfJourney: '06 Oct 2026',
      journeyClass: '3A',
      quota: 'GN',
      chartingStatus: 'CHART PREPARED',
      platformNumber: '1',
      confirmationProbability: 100,
      cachedAt: new Date().toISOString(),
      passengers: [
        { number: 1, name: 'Rajesh Kumar Sharma', bookingStatus: 'CNF/B4/21', currentStatus: 'CNF/B4/21', coach: 'B4', berthNumber: 21, berthType: 'Lower' },
        { number: 2, name: 'Pooja Sharma', bookingStatus: 'CNF/B4/22', currentStatus: 'CNF/B4/22', coach: 'B4', berthNumber: 22, berthType: 'Middle' }
      ]
    });
  }

  async set(storeName, data) {
    if (!this.db) {
      try {
        localStorage.setItem(`${storeName}_${data.pnr || data.trainNumber || data.id || 'item'}`, JSON.stringify(data));
      } catch (e) {}
      return;
    }
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(data);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }

  async get(storeName, key) {
    if (!this.db) {
      try {
        const val = localStorage.getItem(`${storeName}_${key}`);
        return val ? JSON.parse(val) : null;
      } catch (e) {
        return null;
      }
    }
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async getAll(storeName) {
    if (!this.db) return [];
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  // High-level helpers
  async setCachedPnr(pnr, data) {
    return this.set('pnr_cache', { ...data, pnr, cachedAt: new Date().toISOString() });
  }

  async getCachedPnr(pnr) {
    return this.get('pnr_cache', pnr);
  }

  async saveOfflineTicket(ticket) {
    return this.set('tickets_cache', { ...ticket, savedAt: new Date().toISOString() });
  }

  async getOfflineTickets() {
    return this.getAll('tickets_cache');
  }

  async cacheTrainSchedule(trainNumber, scheduleData) {
    return this.set('schedules_cache', { trainNumber, ...scheduleData, cachedAt: new Date().toISOString() });
  }

  async getCachedTrainSchedule(trainNumber) {
    return this.get('schedules_cache', trainNumber);
  }

  async saveChecklist(destinationId, checkedItems) {
    return this.set('checklist_cache', { destinationId, checkedItems, updatedAt: new Date().toISOString() });
  }

  async getChecklist(destinationId) {
    const res = await this.get('checklist_cache', destinationId);
    return res ? res.checkedItems : [];
  }
}

export const offlineStorage = new OfflineStorageEngine();
