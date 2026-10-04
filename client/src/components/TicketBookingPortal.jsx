import React, { useState, useEffect } from 'react';
import { Search, Train, Calendar, User, ArrowRight, ShieldCheck, Zap, CreditCard, ChevronRight, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function TicketBookingPortal({ user, onOpenUpiModal }) {
  const [fromStation, setFromStation] = useState('NDLS');
  const [toStation, setToStation] = useState('MMCT');
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

  const stations = [
    { code: 'NDLS', name: 'New Delhi' },
    { code: 'MMCT', name: 'Mumbai Central' },
    { code: 'HWH', name: 'Howrah Junction' },
    { code: 'MAS', name: 'Chennai Central' },
    { code: 'SBC', name: 'Bengaluru City' },
    { code: 'BSB', name: 'Varanasi Junction' }
  ];

  const searchTrains = async () => {
    setLoading(true);
    try {
      const data = await api.searchTrains(fromStation, toStation, journeyDate);
      if (data.trains) {
        setTrains(data.trains);
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
              <Zap className="w-3.5 h-3.5" /> High-Speed Ticket Booking & Instant Seat Lock
            </div>
            <h2 className="text-2xl font-bold text-white">Search & Reserve Train Seats</h2>
            <p className="text-xs text-slate-400">Direct integration with IRCTC partner gateway & instant UPI checkout</p>
          </div>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">From Station</label>
            <select
              value={fromStation}
              onChange={(e) => setFromStation(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500 font-medium"
            >
              {stations.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">To Station</label>
            <select
              value={toStation}
              onChange={(e) => setToStation(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500 font-medium"
            >
              {stations.filter(s => s.code !== fromStation).map(s => (
                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Journey Date</label>
            <input
              type="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Quota</label>
            <select
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="General">GN - General Quota</option>
              <option value="Tatkal">TQ - Tatkal Quota</option>
              <option value="Ladies">LD - Ladies Quota</option>
              <option value="Senior Citizen">SS - Senior Citizen / Lower Berth</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={searchTrains}
            disabled={loading}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
          >
            {loading ? 'Searching Trains...' : 'Find Trains & Availability'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Train Cards List */}
      <div className="space-y-4">
        {trains.map((t) => (
          <div key={t.number} className="glass-card rounded-3xl p-6 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-orange-500/20 text-orange-400 font-mono font-bold text-xs">
                    {t.number}
                  </span>
                  <h3 className="text-lg font-bold text-white">{t.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                    {t.type}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Runs Daily • Pantry Car Available • High On-Time Record (98%)
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

            {/* Class Cards */}
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
                    <div className="text-[10px] text-slate-500 mt-1">
                      {info.prob}% Confirm Chance
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action Bar */}
            {selectedTrain?.number === t.number && (
              <div className="mt-5 pt-4 border-t border-slate-800/80 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-orange-500/30">
                  <div>
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                      Selected Class: {selectedClass} on Train {t.number}
                    </span>
                    <div className="text-sm text-slate-200 mt-0.5">
                      Base Fare: <strong>₹{(t.fares?.[selectedClass] || 1750) * bookingPassengers.length}</strong> for {bookingPassengers.length} Passenger(s)
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToUpi}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/30 flex items-center gap-2 transition-all"
                  >
                    <CreditCard className="w-4 h-4" /> Book & Pay via Direct UPI
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
