import React, { useState, useEffect } from 'react';
import { Train, Mic, Server, Globe, User, ShieldCheck, Wifi, WifiOff, Coins } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onOpenVoice,
  onOpenHealth,
  selectedLang,
  setSelectedLang,
  isOnline
}) {
  const t = TRANSLATIONS[selectedLang] || TRANSLATIONS['hi-IN'];

  const navItems = [
    { id: 'tracker', label: t.nav.tracking, icon: '🚆' },
    { id: 'pnr', label: t.nav.pnr, icon: '🎫' },
    { id: 'booking', label: t.nav.booking, icon: '⚡' },
    { id: 'predictor', label: t.nav.predictor, icon: '📈' },
    { id: 'food', label: t.nav.food, icon: '🍱' },
    { id: 'destinations', label: t.nav.destinations, icon: '🗺️' }
  ];

  const languages = [
    { code: 'hi-IN', label: 'हिन्दी' },
    { code: 'en-IN', label: 'English' },
    { code: 'ta-IN', label: 'தமிழ்' },
    { code: 'te-IN', label: 'తెలుగు' },
    { code: 'bn-IN', label: 'বাংলা' },
    { code: 'mr-IN', label: 'मराठी' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
      
      {/* Top Banner Ticker */}
      <div className="bg-gradient-to-r from-orange-600/90 via-amber-600/90 to-orange-700/90 text-white text-[11px] py-1 px-4 overflow-hidden font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="truncate">
              🟢 12952 Tejas Rajdhani running on time • 🍛 Seat delivery live at Kota Jnr • ⚡ Direct UPI Zero Fee • 🎙️ Sarvam AI Indic Voice active
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            {isOnline ? (
              <span className="flex items-center gap-1 text-[10px] bg-black/20 px-2 py-0.5 rounded-full">
                <Wifi className="w-3 h-3 text-emerald-300" /> Gateway Synced
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] bg-rose-900/60 text-rose-200 px-2 py-0.5 rounded-full">
                <WifiOff className="w-3 h-3 text-rose-300" /> Offline SQLite Cache
              </span>
            )}
            <span>RPF Helpline: 139</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('tracker')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-lg shadow-orange-500/20 relative">
              <Train className="w-6 h-6 text-white" />
              {/* Indian flag tricolor dot badge */}
              <div className="absolute -top-1 -right-1 flex gap-0.5 p-0.5 rounded-full bg-slate-900 border border-slate-700">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">
                  Rail<span className="text-orange-500">Mate</span>
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20 font-mono">
                  v2.0 AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5">{t.tagline}</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Controls: Voice, Health, Language, User */}
          <div className="flex items-center gap-2">
            
            {/* Sarvam Voice Button */}
            <button
              onClick={onOpenVoice}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/30 text-orange-400 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Open Voice Assistant"
            >
              <Mic className="w-4 h-4 text-orange-400 animate-pulse" />
              <span className="hidden sm:inline">Gemini + Sarvam AI</span>
            </button>

            {/* Microservices Status Indicator */}
            <button
              onClick={onOpenHealth}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Microservices Cluster Health"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Server className="w-4 h-4 text-slate-400" />
              <span className="hidden xl:inline">8 Services UP</span>
            </button>

            {/* Language Selector */}
            <div className="relative">
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="appearance-none bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold py-2 pl-7 pr-3 rounded-xl cursor-pointer focus:outline-none"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                    {l.label}
                  </option>
                ))}
              </select>
              <Globe className="w-3.5 h-3.5 text-orange-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* User Profile / Auth */}
            <button
              onClick={onOpenAuth}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                {user ? user.name[0] : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-[11px] leading-tight font-bold">{user ? user.name.split(' ')[0] : 'Sign In'}</div>
                <div className="text-[9px] text-amber-400 leading-tight flex items-center gap-0.5">
                  <Coins className="w-2.5 h-2.5" /> {user?.railCoins || 450}
                </div>
              </div>
            </button>

          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden overflow-x-auto gap-1 mt-2.5 pt-2 border-t border-slate-800/60 pb-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
