import React, { useState, useEffect } from 'react';
import { MapPin, CheckSquare, Square, Star, Camera, Compass, Sparkles, Building, Info, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';

export default function DestinationChecklist() {
  const [destinations, setDestinations] = useState([]);
  const [selectedDest, setSelectedDest] = useState(null);
  const [checkedTasks, setCheckedTasks] = useState({});
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const data = await api.getFeaturedDestinations();
      if (data.destinations) {
        setDestinations(data.destinations);
        const first = data.destinations[0];
        setSelectedDest(first);
        loadSavedChecklist(first.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedChecklist = async (destId) => {
    try {
      const saved = await offlineStorage.getChecklist(destId);
      if (saved && Array.isArray(saved)) {
        const stateObj = {};
        saved.forEach(id => { stateObj[id] = true; });
        setCheckedTasks(stateObj);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const handleSelectDest = (dest) => {
    setSelectedDest(dest);
    loadSavedChecklist(dest.id);
  };

  const toggleTask = async (taskId) => {
    const updated = { ...checkedTasks, [taskId]: !checkedTasks[taskId] };
    setCheckedTasks(updated);

    if (selectedDest) {
      const activeCheckedIds = Object.keys(updated).filter(id => updated[id]);
      await offlineStorage.saveChecklist(selectedDest.id, activeCheckedIds);
    }
  };

  const searchStationAmenities = async () => {
    if (!selectedDest) return;
    try {
      const data = await api.searchGooglePlaces('station amenities lounge', selectedDest.nearestStation.split(' ')[0]);
      if (data.results) {
        setNearbyPlaces(data.results);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (selectedDest) {
      searchStationAmenities();
    }
  }, [selectedDest]);

  const completedCount = selectedDest ? selectedDest.checklist?.filter(c => checkedTasks[c.id]).length || 0 : 0;
  const totalCount = selectedDest?.checklist?.length || 1;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border border-slate-800">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-2">
          <Compass className="w-3.5 h-3.5" /> Curated Rail Journeys & Google Places API
        </div>
        <h2 className="text-2xl font-bold text-white">Recommended Destinations & Dynamic Travel Checklist</h2>
        <p className="text-xs text-slate-400">
          Scenic train routes, high-res photo guides, interactive bucket lists & station amenities
        </p>
      </div>

      {/* Destination Cards Carousel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {destinations.map((dest) => {
          const isSelected = selectedDest?.id === dest.id;

          return (
            <div
              key={dest.id}
              onClick={() => handleSelectDest(dest)}
              className={`rounded-3xl overflow-hidden cursor-pointer border transition-all duration-300 relative group ${
                isSelected
                  ? 'border-orange-500 shadow-xl shadow-orange-500/20 ring-1 ring-orange-500'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="h-36 relative overflow-hidden">
                <img
                  src={dest.thumbnail}
                  alt={dest.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-400 text-[10px] font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400" /> {dest.rating}
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/90">
                <h4 className="text-xs font-bold text-white truncate">{dest.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-orange-400" /> {dest.state}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Destination View with Dynamic Checklist */}
      {selectedDest && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          
          {/* Left: High-Res Hero Banner & Guide */}
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
                    <Building className="w-3.5 h-3.5 text-orange-400" /> Station Amenities & Services
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

          {/* Right: Dynamic Interactive Checklist */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-5">
              
              {/* Progress Header */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-orange-400" /> Travel Checklist ({completedCount}/{totalCount})
                  </h3>
                  <span className="text-xs font-mono font-bold text-orange-400">{progressPercent}% Done</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Saved automatically in your offline database
                </p>
              </div>

              {/* Checklist items */}
              <div className="space-y-2.5">
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

              {/* Offline note */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span>Checklist items remain accessible offline in mountain passes or tunnels without mobile network.</span>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
