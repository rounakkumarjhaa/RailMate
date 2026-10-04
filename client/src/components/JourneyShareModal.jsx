import React, { useState, useEffect } from 'react';
import { Share2, Battery, Gauge, MapPin, ShieldAlert, CheckCircle2, MessageCircle, Copy, Check, X, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export default function JourneyShareModal({ isOpen, onClose, trainInfo, user }) {
  const [shareData, setShareData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      initiateShare();
    }
  }, [isOpen]);

  const initiateShare = async () => {
    setLoading(true);
    try {
      const payload = {
        passengerName: user?.name || 'Rajesh Kumar Sharma',
        phone: user?.phone || '+91 98765 43210',
        trainNumber: trainInfo?.trainNumber || '12952',
        trainName: trainInfo?.trainName || 'Tejas Rajdhani Express',
        pnr: '2849102941',
        coach: 'B4',
        berth: '21',
        source: 'NDLS',
        destination: 'MMCT',
        batteryLevel: 82
      };

      const res = await api.shareJourney(payload);
      if (res.success) {
        setShareData(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareData?.shareUrl) return;
    navigator.clipboard.writeText(shareData.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerSos = async () => {
    const confirm = window.confirm('Trigger emergency alert to Railway Protection Force (RPF 139) & family contacts with live train coordinates?');
    if (!confirm) return;

    try {
      const res = await api.triggerEmergencySos(shareData?.shareToken, 'Between Kota and Ratlam');
      if (res.success) {
        setSosTriggered(true);
      }
    } catch (e) {
      alert('SOS dispatch failed. Dial 139 directly.');
    }
  };

  if (!isOpen) return null;

  const journey = shareData?.journey;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Real-Time Journey Sharing
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase font-semibold">
                Live GPS Active
              </span>
            </h3>
            <p className="text-xs text-slate-400">Share live speed, next stoppage ETA and safety telemetry with family</p>
          </div>
        </div>

        {/* Live Telemetry Card */}
        {journey && (
          <div className="my-5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700/60">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Traveling Passenger</span>
                <div className="text-sm font-bold text-white">{journey.passengerName}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Coach <strong className="text-orange-400">{journey.coach}</strong>, Berth <strong className="text-orange-400">{journey.berth}</strong> • PNR {journey.pnr}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Safety Status</span>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Safe & On Schedule
                </div>
              </div>
            </div>

            {/* Gauges */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <Gauge className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <div className="text-[10px] text-slate-400">Live Speed</div>
                <div className="text-xs font-bold font-mono text-white mt-0.5">{journey.currentSpeedKmh} km/h</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <Battery className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <div className="text-[10px] text-slate-400">Phone Battery</div>
                <div className="text-xs font-bold font-mono text-white mt-0.5">{journey.batteryLevel}%</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <MapPin className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <div className="text-[10px] text-slate-400">Next Stop ETA</div>
                <div className="text-xs font-bold font-mono text-white mt-0.5">18 mins</div>
              </div>
            </div>

            <div className="text-xs text-slate-300">
              📍 Current Location: <strong>{journey.currentLocationName}</strong>
            </div>
          </div>
        )}

        {/* Share buttons */}
        <div className="space-y-3 mb-5">
          {shareData?.whatsappUrl && (
            <a
              href={shareData.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" /> Share Live Location via WhatsApp
            </a>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareData?.shareUrl || 'https://railmate.in/track?token=...'}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Emergency SOS Section */}
        <div className="pt-4 border-t border-slate-800">
          {!sosTriggered ? (
            <button
              onClick={handleTriggerSos}
              className="w-full py-3 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-400 hover:text-rose-300 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" /> Trigger Emergency SOS (RPF 139 & Family)
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs text-center font-bold">
              🚨 SOS Alert Dispatched! Security helpline 139 notified with live train coordinates and Coach {journey?.coach} Berth {journey?.berth}.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
