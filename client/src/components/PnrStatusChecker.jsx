import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, AlertTriangle, Clock, QrCode, Train, User, ShieldCheck, Database, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function PnrStatusChecker({ onNavigateTab }) {
  const [pnrInput, setPnrInput] = useState('2849102941');
  const [pnrData, setPnrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const samplePnrs = [
    { pnr: '2849102941', label: 'Confirmed (Tejas Rajdhani)' },
    { pnr: '6482019384', label: 'RAC (Vande Bharat)' },
    { pnr: '4192837465', label: 'Waitlist GNWL 14' }
  ];

  const fetchPnr = async (number = pnrInput) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPnrStatus(number);
      if (data.success) {
        setPnrData(data);
      } else {
        setError(data.error || 'Invalid PNR Number');
      }
    } catch (err) {
      setError('Unable to load PNR. Offline cache will be checked.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPnr('2849102941');
  }, []);

  const handleSelectSample = (sample) => {
    setPnrInput(sample.pnr);
    fetchPnr(sample.pnr);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> ConfirmTkt & Indian Railways Direct PNR Engine
            </div>
            <h2 className="text-2xl font-bold text-white">PNR Status & Confirmation Probability</h2>
            <p className="text-xs text-slate-400">Live coach allotment, berth type, charting updates & offline caching</p>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              maxLength="10"
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 10-Digit PNR Number..."
              onKeyDown={(e) => e.key === 'Enter' && fetchPnr()}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 font-mono tracking-wider"
            />
          </div>
          <button
            onClick={() => fetchPnr()}
            disabled={loading || pnrInput.length !== 10}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Check Status'}
          </button>
        </div>

        {/* Quick sample chips */}
        <div className="flex flex-wrap gap-2 mt-4 items-center">
          <span className="text-xs text-slate-400 font-medium">Try Test PNRs:</span>
          {samplePnrs.map((s) => (
            <button
              key={s.pnr}
              onClick={() => handleSelectSample(s)}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-all ${
                pnrInput === s.pnr
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/40'
              }`}
            >
              {s.pnr} ({s.label})
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* PNR Digital Boarding Pass */}
      {pnrData && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Main Boarding Pass Ticket */}
          <div className="glass-card rounded-3xl overflow-hidden border border-slate-800 relative shadow-2xl">
            
            {/* Top Orange Header Strip */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-3">
                <Train className="w-6 h-6" />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-orange-200">Indian Railways E-Ticket</div>
                  <div className="font-bold text-lg font-mono">{pnrData.trainNumber} - {pnrData.trainName}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase text-orange-200">PNR NUMBER</div>
                  <div className="text-xl font-mono font-black tracking-widest">{pnrData.pnr}</div>
                </div>
              </div>
            </div>

            {/* Ticket Journey Details */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 border-b border-slate-800/80">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">From Station</div>
                <div className="text-xl font-bold text-white">{pnrData.fromStation?.name}</div>
                <div className="text-xs font-mono text-orange-400 font-bold mt-0.5">Code: {pnrData.fromStation?.code}</div>
              </div>

              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">To Station</div>
                <div className="text-xl font-bold text-white">{pnrData.toStation?.name}</div>
                <div className="text-xs font-mono text-orange-400 font-bold mt-0.5">Code: {pnrData.toStation?.code}</div>
              </div>

              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Journey Date</div>
                <div className="text-base font-bold text-white">{pnrData.dateOfJourney}</div>
                <div className="text-xs text-slate-400 mt-0.5">Class: {pnrData.journeyClass} • Quota: {pnrData.quota}</div>
              </div>

              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Chart & Platform</div>
                <div className="inline-block px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold text-xs border border-emerald-500/30">
                  {pnrData.chartingStatus}
                </div>
                <div className="text-xs text-slate-300 mt-1">Platform {pnrData.platformNumber} (Assigned)</div>
              </div>
            </div>

            {/* Confirmation Probability Banner */}
            <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">ConfirmTkt ML Confirmation Probability</div>
                  <div className="text-lg font-bold text-white flex items-center gap-2">
                    {pnrData.confirmationProbability}% Probability of Final Clearance
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      pnrData.confirmationProbability >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {pnrData.confirmationProbability >= 80 ? 'HIGH CHANCE' : 'MEDIUM'}
                    </span>
                  </div>
                </div>
              </div>

              {pnrData.isOfflineData && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs">
                  <Database className="w-3.5 h-3.5" /> Loaded from Offline SQLite Cache
                </div>
              )}
            </div>

            {/* Passenger List */}
            <div className="p-6">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-orange-400" /> Passenger Details & Seat Allotment
              </h4>

              <div className="space-y-3">
                {pnrData.passengers?.map((pass) => (
                  <div
                    key={pass.number}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-white text-base">Passenger {pass.number}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Booking Status: {pass.bookingStatus}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Current Status</div>
                        <div className="text-base font-bold font-mono text-emerald-400">{pass.currentStatus}</div>
                      </div>

                      {pass.coach !== 'N/A' && (
                        <div className="px-3.5 py-1.5 rounded-xl bg-orange-600/20 border border-orange-500/30 text-orange-300 font-mono font-bold text-sm text-center">
                          Coach {pass.coach} <br />
                          <span className="text-[11px] font-normal text-slate-300">Seat {pass.berthNumber} ({pass.berthType})</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Perforated ticket footer with Barcode & Order food shortcut */}
            <div className="px-6 py-4 bg-slate-900/90 border-t border-dashed border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <QrCode className="w-8 h-8 text-slate-400" />
                <div className="font-mono text-xs text-slate-400 tracking-widest">
                  ||| | ||||| || |||||| | ||||| ||| 2849102941
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('food')}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-md shadow-orange-600/20"
              >
                Order Hot Food to Coach {pnrData.passengers?.[0]?.coach || 'B4'} Berth {pnrData.passengers?.[0]?.berthNumber || '21'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Alternate Options Card if Waiting List */}
          {pnrData.alternateOptions?.length > 0 && (
            <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-3">
              <div className="font-bold text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> ConfirmTkt Smart Alternative Suggestions
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pnrData.alternateOptions.map((opt, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-900/80 border border-amber-500/30">
                    <div className="text-xs font-bold text-orange-400">{opt.type} (Chance: {opt.successChance})</div>
                    <div className="text-xs text-slate-200 mt-1">{opt.recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
