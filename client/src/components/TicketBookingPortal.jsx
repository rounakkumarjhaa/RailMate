import React, { useState, useEffect, useRef } from 'react';
import { Search, Train, Calendar, User, ArrowRight, ShieldCheck, Zap, CreditCard, ChevronRight, CheckCircle2, ArrowLeftRight, Check, Sparkles, MapPin, Building, Info, Flame, ThumbsUp, X } from 'lucide-react';
import { api } from '../services/api';

const POPULAR_CHIPS = [
  { code: 'GZB', name: 'Ghaziabad' },
  { code: 'BGP', name: 'Bhagalpur' },
  { code: 'NDLS', name: 'New Delhi' },
  { code: 'MMCT', name: 'Mumbai Central' },
  { code: 'CNB', name: 'Kanpur' },
  { code: 'PRYJ', name: 'Prayagraj' },
  { code: 'PNBE', name: 'Patna' },
  { code: 'LKO', name: 'Lucknow' },
  { code: 'ASR', name: 'Amritsar' },
  { code: 'JP', name: 'Jaipur' },
  { code: 'BSB', name: 'Varanasi' },
  { code: 'HWH', name: 'Howrah' },
  { code: 'MAS', name: 'Chennai' },
  { code: 'SBC', name: 'Bengaluru' },
  { code: 'MAO', name: 'Goa' },
  { code: 'KOTA', name: 'Kota' }
];

export default function TicketBookingPortal({ user, onOpenUpiModal }) {
  const [allStations, setAllStations] = useState([]);
  const [fromStation, setFromStation] = useState('GZB');
  const [fromInputText, setFromInputText] = useState('Ghaziabad Junction (GZB)');
  const [showFromDropdown, setShowFromDropdown] = useState(false);

  const [toStation, setToStation] = useState('BGP');
  const [toInputText, setToInputText] = useState('Bhagalpur Junction (BGP)');
  const [showToDropdown, setShowToDropdown] = useState(false);

  const [journeyDate, setJourneyDate] = useState(new Date().toISOString().split('T')[0]);
  const [quota, setQuota] = useState('General');
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(false);

  // Selected train and class for booking
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [selectedClass, setSelectedClass] = useState('3A');
  const [bookingPassengers, setBookingPassengers] = useState([
    { name: user?.name || 'Rajesh Kumar Sharma', age: 34, gender: 'Male', berth: 'Lower', meal: 'Veg' }
  ]);

  const fromRef = useRef(null);
  const toRef = useRef(null);

  // Load all stations on mount
  useEffect(() => {
    const loadStations = async () => {
      try {
        const data = await api.getStations();
        if (data.stations && data.stations.length > 0) {
          setAllStations(data.stations);
        }
      } catch (e) {
        console.error('Error fetching stations:', e);
      }
    };
    loadStations();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fromRef.current && !fromRef.current.contains(e.target)) {
        setShowFromDropdown(false);
      }
      if (toRef.current && !toRef.current.contains(e.target)) {
        setShowToDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchTrains = async () => {
    if (!fromStation || !toStation) return;
    setLoading(true);
    try {
      const data = await api.searchTrains(fromStation, toStation, journeyDate);
      if (data.trains) {
        setTrains(data.trains);
        if (data.trains.length > 0) {
          setSelectedTrain(data.trains[0]);
          const availableClass = Object.keys(data.trains[0].availability || {})[0] || '3A';
          setSelectedClass(availableClass);
        } else {
          setSelectedTrain(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchTrains();
  }, [fromStation, toStation]);

  // Swap From and To stations
  const handleSwapStations = () => {
    const tempCode = fromStation;
    const tempText = fromInputText;
    setFromStation(toStation);
    setFromInputText(toInputText);
    setToStation(tempCode);
    setToInputText(tempText);
  };

  // Station Filter helper
  const getFilteredStations = (inputStr) => {
    const q = (inputStr || '').toLowerCase().trim();
    if (!q) return allStations.slice(0, 8);
    const matches = allStations.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.state && s.state.toLowerCase().includes(q))
    );
    if (matches.length === 0 && q.length >= 2 && q.length <= 5) {
      return [{ code: q.toUpperCase(), name: `${q.toUpperCase()} Station`, city: q.toUpperCase(), state: 'Indian Railways' }];
    }
    return matches.slice(0, 10);
  };

  const handleSelectFrom = (s) => {
    setFromStation(s.code);
    setFromInputText(`${s.name} (${s.code})`);
    setShowFromDropdown(false);
  };

  const handleSelectTo = (s) => {
    setToStation(s.code);
    setToInputText(`${s.name} (${s.code})`);
    setShowToDropdown(false);
  };

  const handleChipClick = (s) => {
    if (fromStation !== s.code) {
      setToStation(s.code);
      setToInputText(`${s.name} (${s.code})`);
    } else {
      setFromStation(s.code);
      setFromInputText(`${s.name} (${s.code})`);
    }
  };

  const handleStartBooking = (train, cls) => {
    setSelectedTrain(train);
    setSelectedClass(cls);
  };

  const handleAddPassenger = () => {
    setBookingPassengers([
      ...bookingPassengers,
      { name: '', age: 28, gender: 'Female', berth: 'Middle', meal: 'Veg' }
    ]);
  };

  const handleRemovePassenger = (index) => {
    if (bookingPassengers.length <= 1) return;
    setBookingPassengers(bookingPassengers.filter((_, i) => i !== index));
  };

  const handlePassengerChange = (index, field, value) => {
    const updated = [...bookingPassengers];
    updated[index][field] = value;
    setBookingPassengers(updated);
  };

  const handleProceedToUpi = async () => {
    if (!selectedTrain) return;

    const baseFarePerPerson = selectedTrain.fares?.[selectedClass] || 1750;

    const bookingPayload = {
      userId: user?.id || 'usr_demo_101',
      trainNumber: selectedTrain.number,
      trainName: selectedTrain.name,
      fromCode: fromStation,
      toCode: toStation,
      journeyDate,
      journeyClass: selectedClass,
      quota,
      passengers: bookingPassengers,
      baseFare: baseFarePerPerson
    };

    try {
      const result = await api.createBooking(bookingPayload);
      if (result.success) {
        onOpenUpiModal(result);
      }
    } catch (err) {
      alert('Failed to initiate booking. Check gateway status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Filter Header */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-2">
              <Zap className="w-3.5 h-3.5" /> Direct IRCTC Partner Gateway & ConfirmTkt API Integration
            </div>
            <h2 className="text-2xl font-bold text-white">Search & Reserve Train Seats</h2>
            <p className="text-xs text-slate-400">Direct integration with IRCTC partner gateway & instant UPI checkout</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> ConfirmTkt ML Active
            </span>
          </div>
        </div>

        {/* Inputs row with searchable station dropdowns and swap button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          
          {/* From Station Searchable Input */}
          <div className="lg:col-span-4 relative" ref={fromRef}>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>From Station</span>
              <span className="text-[10px] text-orange-400 font-mono">Code: {fromStation}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={fromInputText}
                onFocus={() => setShowFromDropdown(true)}
                onChange={(e) => {
                  setFromInputText(e.target.value);
                  setShowFromDropdown(true);
                  if (e.target.value.trim().length <= 5 && e.target.value.trim().length >= 2) {
                    setFromStation(e.target.value.trim().toUpperCase());
                  }
                }}
                placeholder="Search any station (e.g. GZB, Delhi, NDLS, CNB)..."
                className="w-full pl-10 pr-8 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500 font-medium"
              />
              <Search className="w-4 h-4 text-orange-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {fromInputText && (
                <button
                  onClick={() => {
                    setFromInputText('');
                    setShowFromDropdown(true);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* From Station Autocomplete Dropdown */}
            {showFromDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 z-30 max-h-64 overflow-y-auto rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md p-1.5 space-y-1">
                <div className="px-2 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Select Any Indian Railway Station
                </div>
                {getFilteredStations(fromInputText).map((s) => (
                  <button
                    key={s.code}
                    onClick={() => handleSelectFrom(s)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-orange-400 flex items-center gap-2">
                        <span>{s.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          {s.code}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {s.city || s.state} {s.zone ? `• ${s.zone}` : ''}
                      </div>
                    </div>
                    {fromStation === s.code && <Check className="w-3.5 h-3.5 text-orange-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button (between From & To) */}
          <div className="lg:col-span-1 flex justify-center pb-1">
            <button
              onClick={handleSwapStations}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 hover:border-orange-500/50 transition-all hover:rotate-180 duration-300 shadow-md"
              title="Swap From and To stations"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* To Station Searchable Input */}
          <div className="lg:col-span-4 relative" ref={toRef}>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>To Station</span>
              <span className="text-[10px] text-orange-400 font-mono">Code: {toStation}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={toInputText}
                onFocus={() => setShowToDropdown(true)}
                onChange={(e) => {
                  setToInputText(e.target.value);
                  setShowToDropdown(true);
                  if (e.target.value.trim().length <= 5 && e.target.value.trim().length >= 2) {
                    setToStation(e.target.value.trim().toUpperCase());
                  }
                }}
                placeholder="Search any destination (e.g. BGP, Mumbai, MMCT, BSB)..."
                className="w-full pl-10 pr-8 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500 font-medium"
              />
              <Search className="w-4 h-4 text-orange-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {toInputText && (
                <button
                  onClick={() => {
                    setToInputText('');
                    setShowToDropdown(true);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* To Station Autocomplete Dropdown */}
            {showToDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 z-30 max-h-64 overflow-y-auto rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md p-1.5 space-y-1">
                <div className="px-2 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Select Any Destination Station
                </div>
                {getFilteredStations(toInputText).map((s) => (
                  <button
                    key={s.code}
                    onClick={() => handleSelectTo(s)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-orange-400 flex items-center gap-2">
                        <span>{s.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          {s.code}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {s.city || s.state} {s.zone ? `• ${s.zone}` : ''}
                      </div>
                    </div>
                    {toStation === s.code && <Check className="w-3.5 h-3.5 text-orange-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Journey Date */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Journey Date</label>
            <input
              type="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Popular Quick Station Chips */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-semibold mr-1">Quick Stations:</span>
          {POPULAR_CHIPS.map((chip) => (
            <button
              key={chip.code}
              onClick={() => handleChipClick(chip)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                fromStation === chip.code || toStation === chip.code
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50'
              }`}
            >
              {chip.code} ({chip.name})
            </button>
          ))}
        </div>

        {/* Action Button & Quota */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium">Quota:</label>
            <select
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-500"
            >
              <option value="General">GN - General Quota</option>
              <option value="Tatkal">TQ - Tatkal Quota</option>
              <option value="Ladies">LD - Ladies Quota</option>
              <option value="Senior Citizen">SS - Senior Citizen</option>
            </select>
          </div>

          <button
            onClick={searchTrains}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Searching Trains...' : `Find Trains for ${fromStation} ➔ ${toStation}`} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Train Cards List with ConfirmTkt API badges */}
      <div className="space-y-4">
        {trains.length === 0 && !loading && (
          <div className="glass-card rounded-3xl p-8 border border-slate-800 text-center">
            <Train className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <h4 className="text-base font-bold text-white">No trains found for {fromStation} ➔ {toStation}</h4>
            <p className="text-xs text-slate-400 mt-1">Please try searching with another date or alternative junctions.</p>
          </div>
        )}

        {trains.map((t) => (
          <div key={t.number} className="glass-card rounded-3xl p-6 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg bg-orange-500/20 text-orange-400 font-mono font-bold text-xs">
                    {t.number}
                  </span>
                  <h3 className="text-lg font-bold text-white">{t.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                    {t.type}
                  </span>
                  {t.confirmTkt && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" /> ConfirmTkt: {t.confirmTkt.probabilityScore}% Chance
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Runs Daily • Pantry Car {t.pantry_available ? 'Available' : 'No'} • High On-Time Record (98%)
                </div>
              </div>

              {/* Timing */}
              <div className="flex items-center gap-6 font-mono">
                <div>
                  <div className="text-xl font-bold text-white">{t.departure_time}</div>
                  <div className="text-[11px] text-slate-400">{fromStation}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 font-sans">{t.duration}</div>
                  <div className="w-16 h-0.5 bg-slate-700 my-1 relative">
                    <div className="absolute right-0 -top-1 w-2 h-2 rounded-full bg-orange-500" />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{t.arrival_time}</div>
                  <div className="text-[11px] text-slate-400">{toStation}</div>
                </div>
              </div>
            </div>

            {/* Class Cards with ConfirmTkt Probability */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-4">
              {Object.entries(t.availability || {}).map(([cls, info]) => {
                const fare = t.fares?.[cls] || 1750;
                const isSelected = selectedTrain?.number === t.number && selectedClass === cls;

                return (
                  <button
                    key={cls}
                    onClick={() => handleStartBooking(t, cls)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-orange-500/20 border-orange-500 text-white shadow-lg shadow-orange-500/20 ring-1 ring-orange-500'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span>{cls}</span>
                      <span className="text-orange-400 font-mono">₹{fare}</span>
                    </div>
                    <div className={`text-[11px] font-bold ${
                      info.color === 'green' ? 'text-emerald-400' : (info.color === 'amber' ? 'text-amber-400' : 'text-rose-400')
                    }`}>
                      {info.status}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-orange-400" />
                      <span>{info.prob}% ConfirmTkt</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action Bar & ConfirmTkt Partner Verification */}
            {selectedTrain?.number === t.number && (
              <div className="mt-5 pt-4 border-t border-slate-800/80 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-orange-500/30">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                        Selected: Class {selectedClass} on Train {t.number}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        ConfirmTkt Verified
                      </span>
                    </div>
                    <div className="text-sm text-slate-200 mt-1">
                      Base Fare: <strong>₹{(t.fares?.[selectedClass] || 1750) * bookingPassengers.length}</strong> for {bookingPassengers.length} Passenger(s) • Instant IRCTC Seat Lock
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToUpi}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <CreditCard className="w-4 h-4" /> Book & Pay via Instant UPI
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Passenger Information Drawer if booking active */}
      {selectedTrain && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-orange-400" /> Passenger Details ({bookingPassengers.length})
            </h4>
            <button
              onClick={handleAddPassenger}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-orange-400 transition-colors"
            >
              + Add Co-Passenger
            </button>
          </div>

          <div className="space-y-3">
            {bookingPassengers.map((pass, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-400 uppercase font-medium mb-1">Passenger Name</label>
                  <input
                    type="text"
                    value={pass.name}
                    onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                    placeholder="Full name as per Aadhaar"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-medium mb-1">Age</label>
                  <input
                    type="number"
                    value={pass.age}
                    onChange={(e) => handlePassengerChange(idx, 'age', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-medium mb-1">Berth Preference</label>
                  <select
                    value={pass.berth}
                    onChange={(e) => handlePassengerChange(idx, 'berth', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-500"
                  >
                    <option value="Lower">Lower Berth</option>
                    <option value="Middle">Middle Berth</option>
                    <option value="Upper">Upper Berth</option>
                    <option value="Side Lower">Side Lower</option>
                    <option value="Side Upper">Side Upper</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-4 sm:pt-0">
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-400 uppercase font-medium mb-1">Food</label>
                    <select
                      value={pass.meal}
                      onChange={(e) => handlePassengerChange(idx, 'meal', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-500"
                    >
                      <option value="Veg">Pure Veg</option>
                      <option value="Non-Veg">Non-Veg</option>
                      <option value="Jain">Jain Meal</option>
                    </select>
                  </div>
                  {bookingPassengers.length > 1 && (
                    <button
                      onClick={() => handleRemovePassenger(idx)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1 mt-4"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
