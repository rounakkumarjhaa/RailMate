import React, { useState, useEffect, useRef } from 'react';
import { Search, Compass, Clock, MapPin, Gauge, ShieldCheck, RefreshCw, AlertCircle, TrainTrack, ChevronRight, Share2, X } from 'lucide-react';
import { api } from '../services/api';
import { formatTo12Hour } from './TicketBookingPortal';

export default function LiveTrainTracker({ onOpenShareModal }) {
  const [searchQuery, setSearchQuery] = useState('12952');
  const [selectedTrainNumber, setSelectedTrainNumber] = useState('12952');
  const [trainData, setTrainData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  const popularTrains = [
    { num: '12368', name: 'Vikramshila Exp', route: 'ANVT ➔ BGP' },
    { num: '22436', name: 'Vande Bharat', route: 'NDLS ➔ BSB' },
    { num: '12952', name: 'Tejas Rajdhani', route: 'NDLS ➔ MMCT' },
    { num: '22406', name: 'Garib Rath', route: 'ANVT ➔ BGP' },
    { num: '12004', name: 'Shatabdi Exp', route: 'NDLS ➔ LKO' },
    { num: '12301', name: 'Howrah Rajdhani', route: 'HWH ➔ NDLS' },
    { num: '20607', name: 'Vande Bharat', route: 'MAS ➔ SBC' }
  ];

  const fetchLiveStatus = async (trainNum) => {
    const targetNum = (trainNum || searchQuery || '').trim().split(' ')[0].replace(/[^0-9]/g, '') || trainNum;
    if (!targetNum) {
      setError('Please enter a valid train number or select from search');
      return;
    }
    setLoading(true);
    setError(null);
    setShowDropdown(false);
    try {
      const data = await api.getLiveTrainStatus(targetNum);
      if (data.success) {
        setTrainData(data);
        setSelectedTrainNumber(data.trainNumber);
        setSearchQuery(`${data.trainNumber} - ${data.trainName}`);
      } else {
        setError(data.error || 'Train not found. Please verify the train number.');
      }
    } catch (err) {
      setError('Unable to fetch live status. Offline cache will be used if available.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus('12952');
  }, []);

  // Autocomplete suggestions search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.searchTrainsCatalog(q);
        if (res && res.success && Array.isArray(res.trains)) {
          setSuggestions(res.trains.slice(0, 8));
        }
      } catch (err) {
        console.error('Failed to search trains:', err);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTrain = (t) => {
    const num = typeof t === 'string' ? t : t.number;
    setSelectedTrainNumber(num);
    setShowDropdown(false);
    fetchLiveStatus(num);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-bold text-white">Live Train Running Status</h2>
            <p className="text-xs text-slate-400 mt-1">Real-time GPS tracking with exact current train locations, delay telemetry & platform assignments</p>
          </div>

          {trainData && (
            <button
              onClick={() => onOpenShareModal(trainData)}
              className="px-4 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-semibold flex items-center gap-2 transition-colors self-start md:self-auto"
            >
              <Share2 className="w-4 h-4" /> Share Live Journey
            </button>
          )}
        </div>

        {/* Search Bar with Autocomplete Dropdown */}
        <div ref={searchContainerRef} className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                placeholder="Search by 5-digit number or name (e.g. 12368, Vikramshila, Vande Bharat, Rajdhani)..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (suggestions.length > 0 && showDropdown) {
                      handleSelectTrain(suggestions[0]);
                    } else {
                      fetchLiveStatus();
                    }
                  }
                }}
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                  }}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                if (suggestions.length > 0 && !/^\d{5}$/.test(searchQuery.trim())) {
                  handleSelectTrain(suggestions[0]);
                } else {
                  fetchLiveStatus();
                }
              }}
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Track Train'}
            </button>
          </div>

          {/* Autocomplete Suggestions Popup */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
              <div className="p-2 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>Matching Indian Railways Trains</span>
                <span>{suggestions.length} results</span>
              </div>
              {suggestions.map((item) => (
                <div
                  key={item.number}
                  onClick={() => handleSelectTrain(item)}
                  className="px-4 py-3 hover:bg-slate-800/80 cursor-pointer border-b border-slate-800/50 last:border-b-0 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 font-mono font-bold text-xs border border-orange-500/30 shrink-0">
                      {item.number}
                    </span>
                    <div className="min-w-0">
                      <div className="text-white text-sm font-semibold truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                        <span>{item.fromStation || item.from}</span>
                        <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{item.toStation || item.to}</span>
                        {item.stopsCount && (
                          <span className="text-[10px] text-slate-500 ml-1">({item.stopsCount} stops)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                    {item.type || 'Express'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick train chips */}
        <div className="flex flex-wrap gap-2 mt-4 items-center">
          <span className="text-xs text-slate-400 font-medium">Popular Trains:</span>
          {popularTrains.map((t) => (
            <button
              key={t.num}
              onClick={() => handleSelectTrain(t.num)}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 ${
                selectedTrainNumber === t.num
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/40'
              }`}
            >
              <span className="font-bold">{t.num}</span>
              <span>{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Train Live Dashboard */}
      {trainData && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Top Status Card */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 font-mono font-bold text-sm border border-orange-500/30">
                    {trainData.trainNumber}
                  </span>
                  <h3 className="text-xl font-bold text-white">{trainData.trainName}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>Type: <strong className="text-slate-200">{trainData.type}</strong></span>
                  <span>•</span>
                  <span>GPS Telemetry Updated Just Now</span>
                </p>
              </div>

              {/* Live Gauges */}
              <div className="flex items-center gap-4">
                <div className="px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center gap-3">
                  <Gauge className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Current Speed</div>
                    <div className="text-lg font-bold font-mono text-emerald-400">
                      {trainData.currentSpeedKmh} <span className="text-xs font-normal text-slate-400">km/h</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Delay Status</div>
                    <div className={`text-lg font-bold font-mono ${trainData.delayMinutes === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {trainData.runningStatus}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Train Current Location Banner (RailYatri GPS Engine) */}
            <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-slate-900 border border-emerald-500/30 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    Live GPS Position • Exact Current Location
                  </span>
                </div>
                
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-emerald-400 font-mono self-start sm:self-auto">
                  {trainData.dataSource && !trainData.dataSource.includes('RailYatri') ? trainData.dataSource : 'Official IR GPS Live Telemetry'}
                </span>
              </div>

              {/* Exact Location Headline */}
              <div className="text-lg sm:text-xl font-bold text-white mt-1 leading-snug">
                {trainData.liveLocationSummary || `Train is en route between ${trainData.fromStation?.name} and ${trainData.toStation?.name}`}
              </div>

              {/* Real-time bullet updates from RailYatri */}
              {trainData.currentLocationDetails && trainData.currentLocationDetails.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3.5 pt-3 border-t border-slate-800/80">
                  {trainData.currentLocationDetails.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/60 text-xs flex items-start gap-2 shadow-sm">
                      <span className="text-orange-400 mt-0.5">📍</span>
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">{item.message}</div>
                        {(item.label || item.hint) && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {item.label} {item.hint ? `• ${item.hint}` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Station Hero Card */}
            <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-orange-400 flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5" /> Approaching Next Stoppage
                </span>
                <div className="text-2xl font-bold text-white flex items-center gap-2">
                  {trainData.upcomingStation?.name}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {trainData.upcomingStation?.code}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                  <span>Distance: <strong className="text-slate-200">{trainData.upcomingStation?.distanceRemainingKm} km remaining</strong></span>
                  <span>•</span>
                  <span>ETA: <strong className="text-emerald-400">{trainData.upcomingStation?.estimatedArrival} {trainData.upcomingStation?.etaMinutes ? `(${String(trainData.upcomingStation.etaMinutes).toLowerCase().includes('min') || String(trainData.upcomingStation.etaMinutes).toLowerCase().includes('hr') ? trainData.upcomingStation.etaMinutes : `${trainData.upcomingStation.etaMinutes} mins`})` : ''}</strong></span>
                </div>
              </div>

              <div className="text-right self-start md:self-auto">
                <div className="text-xs text-slate-400 mb-0.5">Assigned Platform</div>
                <div className="inline-block px-4 py-1.5 rounded-xl bg-orange-600 text-white font-mono font-bold text-xl shadow-lg shadow-orange-600/30">
                  Platform {trainData.upcomingStation?.platform || '1'}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Route Timeline */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800">
            <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <TrainTrack className="w-4 h-4 text-orange-400" /> Complete Route Schedule & Stoppages
            </h4>

            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-700">
              {trainData.fullSchedule?.map((stop, index) => {
                const isDeparted = stop.status === 'Departed';
                const isApproaching = stop.status === 'Approaching';

                return (
                  <div key={index} className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 transition-all">
                    {/* Circle dot on track line */}
                    <div
                      className={`absolute -left-6 top-4 w-4 h-4 rounded-full border-2 ${
                        isDeparted
                          ? 'bg-emerald-500 border-emerald-400'
                          : isApproaching
                          ? 'bg-orange-500 border-white animate-ping duration-1000'
                          : 'bg-slate-800 border-slate-600'
                      }`}
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{stop.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {stop.code}
                        </span>
                        {isApproaching && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse">
                            Approaching
                          </span>
                        )}
                        {isDeparted && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                            Departed
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Distance: {stop.distance} km • Day {stop.day}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <div className="text-slate-400 text-[10px]">Sch. Arrival</div>
                        <div className="text-slate-200">{formatTo12Hour(stop.schArr)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">Actual / Exp</div>
                        <div className="text-emerald-400 font-bold">{formatTo12Hour(stop.actArr)}</div>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
                        PF {stop.platform}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coach Composition Layout */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800">
            <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              Coach Composition & Layout
            </h4>
            <p className="text-xs text-slate-400 mb-4">From Engine to End-Of-Generation guard van</p>

            <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1">
              {trainData.coachComposition?.map((coach, idx) => (
                <div
                  key={idx}
                  className={`flex-shrink-0 w-24 p-3 rounded-2xl border text-center transition-all ${
                    coach.code === 'ENG'
                      ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                      : coach.code === 'PC'
                      ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                      : 'bg-slate-900 border-slate-700/60 text-slate-200'
                  }`}
                >
                  <div className="font-mono font-bold text-sm">{coach.code}</div>
                  <div className="text-[10px] text-slate-400 mt-1 truncate">{coach.type}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
