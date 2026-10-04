import React, { useState, useEffect } from 'react';
import { TrendingUp, HelpCircle, AlertCircle, CheckCircle, ArrowRight, Sparkles, ShieldAlert, BarChart3 } from 'lucide-react';
import { api } from '../services/api';

export default function ConfirmationPredictor({ onNavigateTab }) {
  const [wlNumber, setWlNumber] = useState('18');
  const [bookingClass, setBookingClass] = useState('3A');
  const [daysUntilJourney, setDaysUntilJourney] = useState('7');
  const [quota, setQuota] = useState('GN');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const data = await api.predictProbability(wlNumber, bookingClass, daysUntilJourney, quota);
      if (data.success) {
        setPrediction(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculate();
  }, [wlNumber, bookingClass, daysUntilJourney, quota]);

  const presetWLs = ['5', '18', '42', '85'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border border-slate-800">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" /> AI / Heuristic Prediction Engine
        </div>
        <h2 className="text-2xl font-bold text-white">Ticket Confirmation Probability Predictor</h2>
        <p className="text-xs text-slate-400">
          Evaluates waiting list churn rate, coach cancellation patterns, chart timelines & seasonal historical datasets
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Parameters Controls */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 border border-slate-800 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-400" /> Enter Ticket Parameters
          </h3>

          {/* Waiting List Number */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-300">Current Waiting List Number (WL)</label>
              <span className="text-xs font-mono font-bold text-orange-400">WL {wlNumber}</span>
            </div>
            <input
              type="range"
              min="1"
              max="120"
              value={wlNumber}
              onChange={(e) => setWlNumber(e.target.value)}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <div className="flex gap-2 mt-2">
              {presetWLs.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setWlNumber(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                    wlNumber === preset
                      ? 'bg-orange-500 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  WL {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Coach Class */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Travel Class</label>
            <div className="grid grid-cols-4 gap-2">
              {['1A', '2A', '3A', 'SL', 'CC', 'EC'].map((c) => (
                <button
                  key={c}
                  onClick={() => setBookingClass(c)}
                  className={`py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                    bookingClass === c
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Days until journey */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-300">Days Remaining Until Departure</label>
              <span className="text-xs font-mono font-bold text-orange-400">{daysUntilJourney} Days</span>
            </div>
            <input
              type="range"
              min="1"
              max="60"
              value={daysUntilJourney}
              onChange={(e) => setDaysUntilJourney(e.target.value)}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Today (1d)</span>
              <span>15 Days</span>
              <span>60 Days</span>
            </div>
          </div>

          {/* Quota */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Reservation Quota</label>
            <select
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-500"
            >
              <option value="GN">GN - General Quota (Highest Confirm Chance)</option>
              <option value="TQ">TQ - Tatkal Quota (Low Confirmation Churn)</option>
              <option value="LD">LD - Ladies Quota</option>
            </select>
          </div>
        </div>

        {/* Prediction Results Gauge & Analysis */}
        <div className="lg:col-span-7 space-y-6">
          {prediction && (
            <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-6">
              
              {/* Score Gauge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-5">
                  {/* Circular visual progress badge */}
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={prediction.probability >= 75 ? 'text-emerald-500' : (prediction.probability >= 45 ? 'text-amber-500' : 'text-rose-500')}
                        strokeDasharray={`${prediction.probability}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-xl font-black font-mono text-white">{prediction.probability}%</span>
                    </div>
                  </div>

                  <div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      prediction.badge === 'HIGH'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : (prediction.badge === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30')
                    }`}>
                      {prediction.badge} CHANCE OF CONFIRMATION
                    </span>
                    <h4 className="text-lg font-bold text-white mt-1">
                      {prediction.probability >= 75 ? 'Confirmed Berth Highly Likely' : (prediction.probability >= 45 ? 'RAC Expected on Charting' : 'High Risk of Non-Confirmation')}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{prediction.historicalTrend}</p>
                  </div>
                </div>
              </div>

              {/* Deep Analysis */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-orange-400" /> Statistical Breakdown
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {prediction.analysis}
                </p>
              </div>

              {/* Action recommendations */}
              <div className="space-y-3">
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Recommended Strategy
                </h5>

                {prediction.probability < 60 ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between gap-4">
                    <div>
                      <strong>Opt for Alternate Tatkal or Vande Bharat:</strong> With low probability in General quota, book tomorrow’s Tatkal quota at 10:00 AM (AC) or 11:00 AM (Non-AC).
                    </div>
                    <button
                      onClick={() => onNavigateTab('booking')}
                      className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-colors flex-shrink-0"
                    >
                      Book Alternatives
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-center justify-between gap-4">
                    <div>
                      <strong>Safe to Retain Ticket:</strong> Expected to clear either directly to confirmed berth or RAC lower berth upon final chart preparation 4 hours before departure.
                    </div>
                    <button
                      onClick={() => onNavigateTab('pnr')}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors flex-shrink-0"
                    >
                      Monitor PNR
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
