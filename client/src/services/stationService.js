import STATIONS from '../data/stations.json' with { type: 'json' };

// Popular major junctions for empty state & ranking boost
export const POPULAR_STATION_CODES = [
  'NDLS', 'DLI', 'ANVT', 'MMCT', 'CSMT', 'GZB', 'BGP', 'HWH',
  'MAS', 'SBC', 'CNB', 'PRYJ', 'PNBE', 'LKO', 'ASR', 'JP',
  'BSB', 'KOTA', 'PUNE', 'HYB', 'SC', 'ADI', 'BPL', 'SVDK'
];

// O(1) Station Code Map
const stationsByCode = new Map();
for (const s of STATIONS) {
  if (s.code) {
    stationsByCode.set(s.code.toUpperCase(), s);
  }
}

/**
 * Get station by code
 * @param {string} code 
 * @returns {object|null}
 */
export function getStationByCode(code) {
  if (!code) return null;
  return stationsByCode.get(code.trim().toUpperCase()) || null;
}

/**
 * Return all stations
 * @returns {Array}
 */
export function getAllStations() {
  return STATIONS;
}

/**
 * Search stations with intelligent multi-tiered ranking:
 * 1. Exact Station Code Match (e.g. "GZB" -> GZB)
 * 2. Station Code Starts With (e.g. "NDL" -> NDLS)
 * 3. Exact Station Name Match (e.g. "new delhi" -> New Delhi)
 * 4. Exact Word Match in Station Name (e.g. query "delhi" in "New Delhi Railway Station")
 * 5. Station Name Starts With Query (e.g. "Delhi" -> Delhi Cantt)
 * 6. Word in Station Name Starts With Query
 * 7. Exact City or Word Match in City
 * 8. City Starts With Query
 * 9. Station Name Contains Query
 * 10. Station Code Contains Query
 * 11. State Contains Query
 *
 * @param {string} query Search input
 * @param {number} limit Maximum number of results
 * @returns {Array} List of matching station objects
 */
export function searchStations(query, limit = 15) {
  const q = (query || '').trim().toLowerCase();

  // If query is empty, return top prominent railway junctions
  if (!q) {
    return POPULAR_STATION_CODES
      .map(code => stationsByCode.get(code))
      .filter(Boolean)
      .slice(0, limit);
  }

  const scored = [];

  for (const s of STATIONS) {
    const code = s.code.toLowerCase();
    const name = s.name.toLowerCase();
    const city = (s.city || '').toLowerCase();
    const state = (s.state || '').toLowerCase();

    let score = -1;

    // 1. Exact station code match (highest priority)
    if (code === q) {
      score = 2500;
    }
    // 2. Station code starts with query
    else if (code.startsWith(q)) {
      score = 1500 + (10 - code.length) * 10;
    }
    // 3. Exact full station name match
    else if (name === q) {
      score = 1300;
    }
    // 4. Exact word match in station name (e.g. query "delhi" in "New Delhi Railway Station")
    else if (name.split(/[\s,.-]+/).some(w => w === q)) {
      score = 1100;
    }
    // 5. Station name starts with query
    else if (name.startsWith(q)) {
      score = 1000;
    }
    // 6. Word in station name starts with query
    else if (name.split(/[\s,.-]+/).some(w => w.startsWith(q))) {
      score = 900;
    }
    // 7. Exact city match or word in city match
    else if (city === q || city.split(/[\s,.-]+/).some(w => w === q)) {
      score = 800;
    }
    // 8. City starts with query
    else if (city.startsWith(q)) {
      score = 700;
    }
    // 9. Station name contains query
    else if (name.includes(q)) {
      score = 500;
    }
    // 10. Station code contains query
    else if (code.includes(q)) {
      score = 400;
    }
    // 11. State contains query
    else if (state.includes(q)) {
      score = 200;
    }

    if (score > 0) {
      // Bonus boost for prominent junctions
      if (POPULAR_STATION_CODES.includes(s.code)) {
        score += 80;
      }
      scored.push({ station: s, score });
    }
  }

  // Sort by score descending, then by name length ascending (shorter names first)
  scored.sort((a, b) => b.score - a.score || a.station.name.length - b.station.name.length);

  const results = scored.slice(0, limit).map(item => item.station);

  // Dynamic fallback for custom 2-5 letter code entered by user
  if (results.length === 0 && q.length >= 2 && q.length <= 5) {
    const customCode = q.toUpperCase();
    results.push({
      code: customCode,
      name: `${customCode} Station`,
      city: customCode,
      state: 'Indian Railways',
      zone: 'IR'
    });
  }

  return results;
}

export function initStationData() {
  return Promise.resolve(STATIONS);
}

export default {
  getAllStations,
  getStationByCode,
  searchStations,
  initStationData,
  POPULAR_STATION_CODES
};
