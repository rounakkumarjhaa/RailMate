import React, { useState, useEffect } from 'react';
import { 
  MapPin, CheckSquare, Square, Star, Camera, Compass, Sparkles, Building, 
  Info, CheckCircle2, Search, X, SlidersHorizontal, Train, ExternalLink, 
  Plus, Eye, Clock, Navigation, Check, Layers, Trash2, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';

// Popular Indian Railway Junctions for instant 1-tap filtering
const POPULAR_STATIONS = [
  { code: 'ALL', name: 'All Stations', icon: '🌐' },
  { code: 'NDLS', name: 'New Delhi (NDLS)', icon: '🏛️' },
  { code: 'BSB', name: 'Varanasi Jn (BSB)', icon: '🕉️' },
  { code: 'AGC', name: 'Agra Cantt (AGC)', icon: '🕌' },
  { code: 'JP', name: 'Jaipur Jn (JP)', icon: '🏰' },
  { code: 'MAO', name: 'Madgaon Goa (MAO)', icon: '🏖️' },
  { code: 'SVDK', name: 'Katra Vaishno Devi (SVDK)', icon: '⛰️' },
  { code: 'HW', name: 'Haridwar Jn (HW)', icon: '🌊' },
  { code: 'AY', name: 'Ayodhya Dham (AY)', icon: '🛕' },
  { code: 'CSMT', name: 'Mumbai CSMT (CSMT)', icon: '🏙️' },
  { code: 'HWH', name: 'Howrah Jn (HWH)', icon: '🌉' },
  { code: 'TPTY', name: 'Tirupati (TPTY)', icon: '🌸' },
  { code: 'UJN', name: 'Ujjain Jn (UJN)', icon: '🔱' },
  { code: 'ASR', name: 'Amritsar Jn (ASR)', icon: '✨' },
  { code: 'PURI', name: 'Puri (PURI)', icon: '🚩' },
  { code: 'SBC', name: 'Bengaluru City (SBC)', icon: '🌳' },
  { code: 'MAS', name: 'Chennai Central (MAS)', icon: '🏖️' },
  { code: 'LKO', name: 'Lucknow Charbagh (LKO)', icon: '👑' },
  { code: 'GAYA', name: 'Bodh Gaya (GAYA)', icon: '🪷' }
];

export default function DestinationChecklist() {
  // Navigation View: 'nearby' (Nearby Famous Places) | 'destinations' (Curated Itineraries) | 'checklist' (My Checklist)
  const [activeView, setActiveView] = useState('nearby');

  // Nearby Places State
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [maxDistance, setMaxDistance] = useState(null); // null = all, 5, 15, 30
  const [nearbyCategory, setNearbyCategory] = useState('all');
  const [sortBy, setSortBy] = useState('distance'); // 'distance' | 'rating'
  const [nearbySearch, setNearbySearch] = useState('');

  // Curated Destinations State
  const [destinations, setDestinations] = useState([]);
  const [selectedDest, setSelectedDest] = useState(null);
  const [destLoading, setDestLoading] = useState(false);
  const [destCategory, setDestCategory] = useState('all');
  const [destSearch, setDestSearch] = useState('');

  // Checklist & UI State
  const [checkedTasks, setCheckedTasks] = useState({});
  const [customTasks, setCustomTasks] = useState([]);
  const [newCustomTask, setNewCustomTask] = useState('');
  const [addedPlaces, setAddedPlaces] = useState({});
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // 1. Fetch Nearby Famous Places (Google Places API)
  const fetchNearbyPlaces = async () => {
    setNearbyLoading(true);
    try {
      const data = await api.getNearbyFamousPlaces(
        selectedStation === 'ALL' ? '' : selectedStation,
        maxDistance,
        nearbySearch,
        nearbyCategory,
        sortBy
      );
      if (data && data.places) {
        setNearbyPlaces(data.places);
      }
    } catch (err) {
      console.error('Failed to load nearby famous places:', err);
    } finally {
      setNearbyLoading(false);
    }
  };

  // 2. Fetch Curated Featured Destinations
  const fetchDestinations = async () => {
    setDestLoading(true);
    try {
      const data = await api.getFeaturedDestinations();
      if (data.destinations) {
        setDestinations(data.destinations);
        if (!selectedDest && data.destinations.length > 0) {
          setSelectedDest(data.destinations[0]);
          loadSavedChecklist(data.destinations[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load destinations:', e);
    } finally {
      setDestLoading(false);
    }
  };

  // 3. Load Saved Checklist from Offline Storage
  const loadSavedChecklist = async (destId) => {
    try {
      const saved = await offlineStorage.getChecklist(destId || 'master_checklist');
      if (saved && Array.isArray(saved)) {
        const stateObj = {};
        saved.forEach(id => { stateObj[id] = true; });
        setCheckedTasks(stateObj);
      }
      const savedCustom = await offlineStorage.getChecklist('custom_travel_tasks');
      if (savedCustom && Array.isArray(savedCustom)) {
        setCustomTasks(savedCustom);
      }
    } catch (e) {}
  };

  // Initial Load
  useEffect(() => {
    fetchNearbyPlaces();
    fetchDestinations();
    loadSavedChecklist('master_checklist');
  }, []);

  // Re-fetch nearby places when filters change
  useEffect(() => {
    fetchNearbyPlaces();
  }, [selectedStation, maxDistance, nearbyCategory, sortBy]);

  // Debounced search for nearby places
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNearbyPlaces();
    }, 250);
    return () => clearTimeout(timer);
  }, [nearbySearch]);

  // Toggle Checklist item
  const toggleTask = async (taskId) => {
    const updated = { ...checkedTasks, [taskId]: !checkedTasks[taskId] };
    setCheckedTasks(updated);

    const activeCheckedIds = Object.keys(updated).filter(id => updated[id]);
    await offlineStorage.saveChecklist(selectedDest?.id || 'master_checklist', activeCheckedIds);
  };

  // Add Famous Place to Travel Checklist
  const handleAddPlaceToChecklist = async (place) => {
    const taskId = `task_place_${place.id}`;
    const taskText = `Visit ${place.name} (${place.category}) - ${place.distanceText || place.vicinity}`;

    // Add to custom tasks
    const existing = customTasks.find(t => t.id === taskId || t.task.includes(place.name));
    let updatedTasks = customTasks;

    if (!existing) {
      const newTask = {
        id: taskId,
        task: taskText,
        category: 'Google Places Nearby',
        rating: place.rating,
        googleMapsUrl: place.googleMapsUrl,
        vicinity: place.vicinity
      };
      updatedTasks = [newTask, ...customTasks];
      setCustomTasks(updatedTasks);
      await offlineStorage.saveChecklist('custom_travel_tasks', updatedTasks);
    }

    // Mark as checked/active feedback
    setAddedPlaces(prev => ({ ...prev, [place.id]: true }));
    setTimeout(() => {
      setAddedPlaces(prev => ({ ...prev, [place.id]: false }));
    }, 2500);
  };

  // Add user-defined custom task
  const handleAddCustomTask = async (e) => {
    e.preventDefault();
    if (!newCustomTask.trim()) return;

    const newTask = {
      id: `task_user_${Date.now()}`,
      task: newCustomTask.trim(),
      category: 'My Travel Note'
    };

    const updated = [newTask, ...customTasks];
    setCustomTasks(updated);
    setNewCustomTask('');
    await offlineStorage.saveChecklist('custom_travel_tasks', updated);
  };

  // Delete custom task
  const handleDeleteCustomTask = async (taskId) => {
    const updated = customTasks.filter(t => t.id !== taskId);
    setCustomTasks(updated);
    await offlineStorage.saveChecklist('custom_travel_tasks', updated);
  };

  // Filter curated destinations
  const filteredDestinations = destinations.filter((dest) => {
    const matchesCat = destCategory === 'all' || (dest.category || '').toLowerCase() === destCategory.toLowerCase();
    const q = destSearch.toLowerCase().trim();
    if (!q) return matchesCat;

    return matchesCat && (
      dest.title.toLowerCase().includes(q) ||
      dest.state.toLowerCase().includes(q) ||
      dest.nearestStation.toLowerCase().includes(q) ||
      dest.featuredTrain.toLowerCase().includes(q) ||
      (dest.category && dest.category.toLowerCase().includes(q)) ||
      dest.overview.toLowerCase().includes(q)
    );
  });

  // Calculate master checklist progress
  const allChecklistItems = [
    ...(selectedDest?.checklist || []),
    ...customTasks
  ];
  const totalItemsCount = allChecklistItems.length || 1;
  const completedItemsCount = allChecklistItems.filter(item => checkedTasks[item.id]).length;
  const progressPercent = Math.round((completedItemsCount / totalItemsCount) * 100);

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              पर्यटन स्थल — Famous Places Nearby & Recommended Destinations
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Top attractions nearby major Indian railway stations with authentic high-resolution pictures, station proximity & offline checklist
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-orange-400 font-mono text-xs font-bold shadow-inner">
              📍 {nearbyPlaces.length} Nearby Places • 🚂 {destinations.length} Destinations
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveView('nearby')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'nearby'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 scale-[1.02]'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-700/60'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Famous Places Nearby Stations</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/25 text-white font-mono">
              {nearbyPlaces.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView('destinations')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'destinations'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 scale-[1.02]'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-700/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Curated Destinations & Rail Tours</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/25 text-white font-mono">
              {destinations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView('checklist')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'checklist'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 scale-[1.02]'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-700/60'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Dynamic Travel Checklist</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              {completedItemsCount}/{allChecklistItems.length}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: FAMOUS PLACES NEARBY STATIONS (GOOGLE PLACES API) */}
      {activeView === 'nearby' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Station Selector Bar & Quick Filter Controls */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
            
            {/* Top row: Search input & quick radius / sort */}
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-orange-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={nearbySearch}
                  onChange={(e) => setNearbySearch(e.target.value)}
                  placeholder="Search famous places by name, monument, station or city (e.g. Taj Mahal, India Gate, Kashi, Ghat, Amber Fort, Golden Temple)..."
                  className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500 placeholder-slate-500 shadow-inner"
                />
                {nearbySearch && (
                  <button
                    onClick={() => setNearbySearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Distance Radius Filter */}
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap mr-1 flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-orange-400" /> Radius:
                </span>
                {[
                  { label: 'All Distances', value: null },
                  { label: '< 5 km (Walking/Auto)', value: 5 },
                  { label: '< 15 km (Cab/Metro)', value: 15 },
                  { label: '< 30 km (Day Excursion)', value: 30 }
                ].map((rad) => (
                  <button
                    key={rad.label}
                    onClick={() => setMaxDistance(rad.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      maxDistance === rad.value
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                    }`}
                  >
                    {rad.label}
                  </button>
                ))}
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1.5 self-start md:self-auto">
                <button
                  onClick={() => setSortBy(sortBy === 'distance' ? 'rating' : 'distance')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 font-medium whitespace-nowrap"
                  title="Toggle sorting"
                >
                  <SlidersHorizontal className="w-3 h-3 text-orange-400" />
                  <span>Sort: {sortBy === 'distance' ? 'Nearest Distance' : 'Top Google Rating ★'}</span>
                </button>
              </div>
            </div>

            {/* Popular Railway Station Chips */}
            <div>
              <div className="text-[11px] text-slate-400 font-medium mb-2 flex items-center gap-1.5">
                <Train className="w-3.5 h-3.5 text-orange-400" />
                <span>Select Indian Railway Hub for Nearby Famous Places:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 max-h-28 overflow-y-auto pr-1">
                {POPULAR_STATIONS.map((stn) => (
                  <button
                    key={stn.code}
                    onClick={() => setSelectedStation(stn.code)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      selectedStation === stn.code
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 ring-1 ring-orange-400'
                        : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <span>{stn.icon}</span>
                    <span>{stn.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Summary & Station Badge */}
          <div className="flex items-center justify-between px-2">
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <span>Showing</span>
              <strong className="text-orange-400 font-bold">{nearbyPlaces.length}</strong>
              <span>famous places nearby</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-orange-300 font-mono text-[11px] border border-slate-700">
                {selectedStation === 'ALL' ? 'All Major Railway Hubs' : selectedStation}
              </span>
              {maxDistance && (
                <span className="text-[11px] text-slate-400">within {maxDistance} km</span>
              )}
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Camera className="w-3 h-3 text-emerald-400" />
              <span>High-resolution Google Places API Photos & Reviews</span>
            </div>
          </div>

          {/* Nearby Places Grid */}
          {nearbyLoading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span>Fetching famous places & images from Google Places API...</span>
            </div>
          ) : nearbyPlaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {nearbyPlaces.map((place) => {
                const isAdded = addedPlaces[place.id];

                return (
                  <div
                    key={place.id}
                    className="rounded-3xl overflow-hidden bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col group shadow-xl hover:shadow-orange-500/5 duration-300"
                  >
                    {/* Authentic Google Place Image */}
                    <div 
                      className="h-52 relative overflow-hidden cursor-pointer"
                      onClick={() => setSelectedPhoto(place)}
                    >
                      <img
                        src={place.photo}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />

                      {/* Google Star Rating & Reviews Badge */}
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-slate-950/90 backdrop-blur-md text-amber-400 text-xs font-bold flex items-center gap-1 border border-amber-500/30 shadow-lg">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{place.rating}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({place.userRatingsTotal ? place.userRatingsTotal.toLocaleString() : '5,000+'} reviews)
                        </span>
                      </div>

                      {/* Category Tag */}
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md text-slate-200 text-[10px] font-semibold border border-slate-700/60">
                        {place.category}
                      </div>

                      {/* Station Distance Badge */}
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-orange-600/90 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1 shadow-md">
                        <MapPin className="w-3 h-3 text-orange-200" />
                        <span>{place.distanceText || `${place.distanceKm} km from Station`}</span>
                      </div>

                      {/* Zoom hint */}
                      <div className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Place Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors leading-tight">
                          {place.name}
                        </h4>
                        
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                          <span>{place.vicinity}</span>
                        </p>

                        <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                          {place.description}
                        </p>
                      </div>

                      {/* Extra info: Best Time & Recommended Duration */}
                      {(place.bestTime || place.recommendedDuration) && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                          {place.recommendedDuration && (
                            <div className="text-slate-400 flex items-center gap-1 truncate">
                              <Clock className="w-3 h-3 text-orange-400 shrink-0" />
                              <span className="truncate">{place.recommendedDuration}</span>
                            </div>
                          )}
                          {place.bestTime && (
                            <div className="text-slate-400 flex items-center gap-1 truncate">
                              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">{place.bestTime}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions: Add to Checklist & View on Google Maps */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleAddPlaceToChecklist(place)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Added to Checklist!
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" /> + Add to Checklist
                            </>
                          )}
                        </button>

                        <a
                          href={place.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700"
                          title="Open in Google Maps"
                        >
                          <span>Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">No famous places found matching criteria</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Try clearing the search query or selecting "All Stations" or increasing the radius filter.
              </p>
              <button
                onClick={() => {
                  setNearbySearch('');
                  setSelectedStation('ALL');
                  setMaxDistance(null);
                  setNearbyCategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: CURATED DESTINATIONS & SCENIC RAIL TOURS */}
      {activeView === 'destinations' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Destination Search & Categories */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-orange-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={destSearch}
                onChange={(e) => setDestSearch(e.target.value)}
                placeholder="Search curated destinations (e.g. Kashmir, Varanasi, Goa, Kerala, Rajasthan, Darjeeling, Hampi)..."
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500 placeholder-slate-500 shadow-inner"
              />
              {destSearch && (
                <button
                  onClick={() => setDestSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-orange-400" /> Categories:
              </span>
              {[
                { id: 'all', label: 'All Destinations' },
                { id: 'Mountains & Snow', label: '🏔️ Mountains & Snow' },
                { id: 'Spiritual & Heritage', label: '🕉️ Spiritual & Heritage' },
                { id: 'Coastal & Beaches', label: '🏖️ Coastal & Beaches' },
                { id: 'Backwaters & Nature', label: '🌿 Backwaters & Nature' },
                { id: 'Royal & Desert', label: '👑 Royal & Desert' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setDestCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    destCategory === cat.id
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Destinations Carousel Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDestinations.map((dest) => {
              const isSelected = selectedDest?.id === dest.id;

              return (
                <div
                  key={dest.id}
                  onClick={() => {
                    setSelectedDest(dest);
                    loadSavedChecklist(dest.id);
                  }}
                  className={`rounded-3xl overflow-hidden cursor-pointer border transition-all duration-300 relative group ${
                    isSelected
                      ? 'border-orange-500 shadow-xl shadow-orange-500/20 ring-1 ring-orange-500 scale-[1.02]'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="h-40 relative overflow-hidden">
                    <img
                      src={dest.thumbnail}
                      alt={dest.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-400 text-[10px] font-bold flex items-center gap-1 border border-amber-500/30">
                      <Star className="w-3 h-3 fill-amber-400" /> {dest.rating}
                    </div>
                    {dest.category && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-slate-300 text-[9px] font-medium border border-slate-700/60">
                        {dest.category}
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 bg-slate-900/90">
                    <h4 className="text-xs font-bold text-white truncate">{dest.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-orange-400 flex-shrink-0" /> {dest.state} • {dest.nearestStation.split(' ')[0]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Destination Deep-Dive */}
          {selectedDest && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
              
              {/* Banner & Information */}
              <div className="lg:col-span-7 space-y-6">
                <div className="glass-card rounded-3xl overflow-hidden border border-slate-800">
                  <div className="h-64 relative">
                    <img
                      src={selectedDest.bannerImage}
                      alt={selectedDest.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                    
                    <div className="absolute bottom-5 left-6 right-6">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-orange-500 text-white font-bold uppercase tracking-wider">
                        {selectedDest.state}
                      </span>
                      <h3 className="text-2xl font-black text-white mt-1">{selectedDest.title}</h3>
                      <p className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                        <span>Train: <strong className="text-orange-400">{selectedDest.featuredTrain}</strong></span>
                        <span>•</span>
                        <span>Nearest Station: <strong className="text-slate-100">{selectedDest.nearestStation}</strong></span>
                      </p>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {selectedDest.overview}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400 text-[10px] uppercase font-medium">Best Travel Season</span>
                        <div className="font-bold text-white mt-0.5">{selectedDest.bestSeason}</div>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400 text-[10px] uppercase font-medium">Recommended Duration</span>
                        <div className="font-bold text-white mt-0.5">{selectedDest.recommendedDays}</div>
                      </div>
                    </div>

                    {/* Station Amenities (Google Places) */}
                    <div className="pt-3 border-t border-slate-800">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-orange-400" /> Station Amenities & Lounges (Google Places)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedDest.stationAmenities?.map((amenity, i) => (
                          <span key={i} className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
                            ✓ {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Destination Checklist Card */}
              <div className="lg:col-span-5 space-y-4">
                <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-orange-400" /> Destination Bucket List
                    </h3>
                    <span className="text-xs font-mono font-bold text-orange-400">
                      {selectedDest.checklist?.filter(c => checkedTasks[c.id]).length || 0} / {selectedDest.checklist?.length || 0}
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {selectedDest.checklist?.map((task) => {
                      const isDone = Boolean(checkedTasks[task.id]);

                      return (
                        <div
                          key={task.id}
                          onClick={() => toggleTask(task.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                            isDone
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-200'
                          }`}
                        >
                          <button className="mt-0.5 text-orange-400 flex-shrink-0">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                          </button>

                          <div className="flex-1">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                              {task.category}
                            </span>
                            <p className={`text-xs mt-1 font-medium ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                              {task.task}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setActiveView('checklist')}
                    className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700"
                  >
                    <span>View All Checklist Items & Notes</span>
                    <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* VIEW 3: DYNAMIC TRAVEL CHECKLIST & NOTES */}
      {activeView === 'checklist' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
            
            {/* Header & Overall Progress */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-orange-400" />
                  Dynamic Travel Bucket List & Checklist
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Synced across offline SQLite database. Access anytime during transit without internet connectivity.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-lg font-black text-orange-400 font-mono">{progressPercent}%</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    {completedItemsCount} of {allChecklistItems.length} Completed
                  </div>
                </div>

                <div className="w-24 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Add Custom Travel Task Input */}
            <form onSubmit={handleAddCustomTask} className="flex gap-2">
              <input
                type="text"
                value={newCustomTask}
                onChange={(e) => setNewCustomTask(e.target.value)}
                placeholder="Add custom packing item or travel note (e.g. Carry Power Bank, Download offline IRCTC e-Ticket, Buy Banarasi Paan)..."
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500 placeholder-slate-500"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-lg shadow-orange-500/20"
              >
                <Plus className="w-4 h-4" /> Add Note
              </button>
            </form>

            {/* Checklist Items List */}
            <div className="space-y-3">
              {allChecklistItems.map((item) => {
                const isDone = Boolean(checkedTasks[item.id]);
                const isCustom = item.id.startsWith('task_user_') || item.id.startsWith('task_place_');

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      isDone
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <div
                      onClick={() => toggleTask(item.id)}
                      className="flex items-start gap-3 flex-1 cursor-pointer"
                    >
                      <button className="mt-0.5 text-orange-400 shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-500" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                            {item.category || 'Travel Item'}
                          </span>
                          {item.rating && (
                            <span className="text-[10px] text-amber-400 flex items-center gap-0.5 font-bold">
                              <Star className="w-3 h-3 fill-amber-400" /> {item.rating}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs sm:text-sm mt-1 font-medium ${isDone ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                          {item.task}
                        </p>
                      </div>
                    </div>

                    {/* Actions if place or custom note */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.googleMapsUrl && (
                        <a
                          href={item.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                          title="View on Google Maps"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {isCustom && (
                        <button
                          onClick={() => handleDeleteCustomTask(item.id)}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Offline notification banner */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                All travel notes & checklist items persist automatically in your device’s local SQLite cache, ensuring full access even in train tunnels or deep valleys.
              </span>
            </div>

          </div>
        </div>
      )}

      {/* High-Resolution Photo Enlarge Modal (Google Places API) */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-96">
              <img
                src={selectedPhoto.photo}
                alt={selectedPhoto.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />

              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-orange-500 text-white font-bold uppercase tracking-wider">
                  {selectedPhoto.category}
                </span>
                <h3 className="text-2xl font-black text-white mt-1">{selectedPhoto.name}</h3>
                <p className="text-xs text-orange-300 font-medium mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{selectedPhoto.distanceText || selectedPhoto.vicinity}</span>
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-sm">
                    <Star className="w-4 h-4 fill-amber-400" /> {selectedPhoto.rating}
                  </div>
                  <span className="text-xs text-slate-400">
                    ({selectedPhoto.userRatingsTotal ? selectedPhoto.userRatingsTotal.toLocaleString() : '5,000+'} reviews on Google Places)
                  </span>
                </div>

                {selectedPhoto.recommendedDuration && (
                  <span className="text-xs text-slate-300 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
                    ⏱️ {selectedPhoto.recommendedDuration}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedPhoto.description}
              </p>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    handleAddPlaceToChecklist(selectedPhoto);
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add to Travel Checklist
                </button>

                <a
                  href={selectedPhoto.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/20"
                >
                  Open in Google Maps <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
