import React, { useState, useEffect, useRef } from 'react';
import { Train, Mic, Server, Globe, User, ShieldCheck, Wifi, WifiOff, Coins, Sun, Moon, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';
import { soundService } from '../services/soundService';

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onOpenVoice,
  onOpenHealth,
  selectedLang,
  setSelectedLang,
  isOnline,
  theme = 'dark',
  onToggleTheme
}) {
  const t = TRANSLATIONS[selectedLang] || TRANSLATIONS['hi-IN'];
  const [isTrainSoundPlaying, setIsTrainSoundPlaying] = useState(soundService.isTrainSoundPlaying);
  const [isClickSoundEnabled, setIsClickSoundEnabled] = useState(soundService.isClickSoundEnabled);
  const [soundVolume, setSoundVolume] = useState(soundService.volume);
  const [isSoundMenuOpen, setIsSoundMenuOpen] = useState(false);
  const soundMenuRef = useRef(null);

  useEffect(() => {
    const unsubscribe = soundService.subscribe(({ isPlaying, isClickEnabled, volume }) => {
      setIsTrainSoundPlaying(isPlaying);
      setIsClickSoundEnabled(isClickEnabled);
      setSoundVolume(volume);
    });
    return unsubscribe;
  }, []);

  // Close sound dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (soundMenuRef.current && !soundMenuRef.current.contains(e.target)) {
        setIsSoundMenuOpen(false);
      }
    };
    if (isSoundMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isSoundMenuOpen]);

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
              🟢 12952 Tejas Rajdhani running on time • 🍛 Seat delivery live at Kota Jnr • ⚡ Direct UPI Zero Fee • 🎙️ AI Voice Assistant active
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
            
            {/* AI Voice Assistant Button */}
            <button
              onClick={onOpenVoice}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/30 text-orange-400 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Open AI Voice Assistant"
            >
              <Mic className="w-4 h-4 text-orange-400 animate-pulse" />
              <span className="hidden sm:inline">AI Voice Assistant</span>
            </button>

            {/* Microservices Status Indicator */}
            <button
              onClick={onOpenHealth}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Microservices Cluster Health"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Server className="w-4 h-4 text-slate-400" />
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

            {/* Train Sound Ambient & Click Controls */}
            <div className="relative" ref={soundMenuRef}>
              <div className="flex items-center rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 p-0.5 shadow-sm">
                <button
                  onClick={() => soundService.toggleTrainSound()}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isTrainSoundPlaying
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 ring-1 ring-orange-400'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title={isTrainSoundPlaying ? 'Mute Train Running Sound' : 'Play Train Running Sound'}
                  aria-label="Toggle train running track sound"
                >
                  {isTrainSoundPlaying ? (
                    <>
                      <div className="flex items-center gap-0.5 h-3">
                        <span className="w-0.5 h-2 bg-white animate-pulse rounded-full" />
                        <span className="w-0.5 h-3.5 bg-white animate-pulse rounded-full" />
                        <span className="w-0.5 h-1.5 bg-white animate-pulse rounded-full" />
                      </div>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline font-bold">Train Sound</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                      <span className="hidden sm:inline text-slate-400">Train Sound</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsSoundMenuOpen(!isSoundMenuOpen)}
                  className="px-1.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Audio Settings & Train Horn"
                  aria-label="Open audio settings"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSoundMenuOpen ? 'rotate-180 text-orange-400' : ''}`} />
                </button>
              </div>

              {/* Sound Controls Popover Dropdown */}
              {isSoundMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 space-y-4 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                      <Train className="w-4 h-4 text-orange-400" />
                      <span>RailMate Audio Experience</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-mono font-semibold">
                      Web Audio
                    </span>
                  </div>

                  {/* 1. Train Running Track Sound */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-white">Train Running Track Sound</div>
                      <div className="text-[10px] text-slate-400">Rhythmic rail clatter & engine rumble</div>
                    </div>
                    <button
                      onClick={() => soundService.toggleTrainSound()}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                        isTrainSoundPlaying ? 'bg-orange-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          isTrainSoundPlaying ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 2. UI Click Sound */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-white">Interactive Click Sounds</div>
                      <div className="text-[10px] text-slate-400">Tactile audio feedback on clicking</div>
                    </div>
                    <button
                      onClick={() => soundService.toggleClickSound()}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                        isClickSoundEnabled ? 'bg-orange-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          isClickSoundEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 3. Master Volume Slider */}
                  {isTrainSoundPlaying && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Ambience Volume</span>
                        <span className="text-orange-400 font-mono font-bold">{Math.round(soundVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="1.0"
                        step="0.05"
                        value={soundVolume}
                        onChange={(e) => soundService.setVolume(parseFloat(e.target.value))}
                        className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>
                  )}

                  {/* 4. Locomotive Horn */}
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => soundService.playTrainHorn()}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700/80 group"
                    >
                      <span>📢</span>
                      <span>Honk Train Horn (WAP-7)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Light / Dark Theme Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm group"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle light or dark theme mode"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                  <span className="hidden md:inline text-amber-300 font-medium">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-500 group-hover:-rotate-12 transition-transform duration-300" />
                  <span className="hidden md:inline text-slate-700 font-bold">Dark</span>
                </>
              )}
            </button>

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
