import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LiveTrainTracker from './components/LiveTrainTracker';
import PnrStatusChecker from './components/PnrStatusChecker';
import TicketBookingPortal from './components/TicketBookingPortal';
import ConfirmationPredictor from './components/ConfirmationPredictor';
import FoodOrderingSystem from './components/FoodOrderingSystem';
import DestinationChecklist from './components/DestinationChecklist';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import MicroservicesStatusModal from './components/MicroservicesStatusModal';
import AuthModal from './components/AuthModal';
import UpiPaymentModal from './components/UpiPaymentModal';
import JourneyShareModal from './components/JourneyShareModal';
import { Mic, Share2, ShieldCheck, Database, WifiOff, PhoneCall, Train, Sparkles } from 'lucide-react';
import { TRANSLATIONS } from './data/translations';

export default function App() {
  const [activeTab, setActiveTab] = useState('tracker');
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [isOnline, setIsOnline] = useState(true);

  // User state (demo user preset for frictionless immediate review)
  const [user, setUser] = useState({
    id: 'usr_demo_101',
    name: 'Rajesh Kumar Sharma',
    email: 'rajesh.sharma@railmate.in',
    phone: '+91 98765 43210',
    railCoins: 450,
    passengers: [
      { id: 'p1', name: 'Rajesh Kumar Sharma', age: 34, gender: 'Male', berth_preference: 'Lower' },
      { id: 'p2', name: 'Pooja Sharma', age: 31, gender: 'Female', berth_preference: 'Lower' }
    ]
  });

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isUpiOpen, setIsUpiOpen] = useState(false);
  const [bookingForUpi, setBookingForUpi] = useState(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareTrainInfo, setShareTrainInfo] = useState(null);

  // Online / Offline state tracking
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const t = TRANSLATIONS[selectedLang] || TRANSLATIONS['hi-IN'];

  const handleOpenUpiModal = (bookingResult) => {
    setBookingForUpi(bookingResult);
    setIsUpiOpen(true);
  };

  const handleOpenShareModal = (trainData) => {
    setShareTrainInfo(trainData);
    setIsShareOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenHealth={() => setIsHealthOpen(true)}
        selectedLang={selectedLang}
        setSelectedLang={setSelectedLang}
        isOnline={isOnline}
      />

      {/* Offline sync notification banner */}
      {!isOnline && (
        <div className="bg-amber-600/90 text-slate-950 font-semibold px-4 py-2 text-xs text-center flex items-center justify-center gap-2 shadow-lg">
          <Database className="w-4 h-4" />
          <span>
            Offline Mode Active: Utilizing local SQLite & IndexedDB cache. Your tickets, PNR status, and schedules remain fully accessible.
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-8">
        
        {/* Tab router */}
        {activeTab === 'tracker' && (
          <LiveTrainTracker onOpenShareModal={handleOpenShareModal} />
        )}

        {activeTab === 'pnr' && (
          <PnrStatusChecker onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'booking' && (
          <TicketBookingPortal user={user} onOpenUpiModal={handleOpenUpiModal} />
        )}

        {activeTab === 'predictor' && (
          <ConfirmationPredictor onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'food' && (
          <FoodOrderingSystem user={user} />
        )}

        {activeTab === 'destinations' && (
          <DestinationChecklist />
        )}

      </main>

      {/* Floating Sarvam AI Voice Trigger Button */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2">
        <button
          onClick={() => setIsVoiceOpen(true)}
          className="group px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-2xl shadow-orange-500/40 flex items-center gap-2.5 transition-all duration-300 hover:scale-105"
        >
          <div className="relative">
            <Mic className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <span className="font-semibold tracking-wide">
            Gemini & Sarvam AI Voice Assistant
          </span>
          <span className="text-[10px] bg-black/25 px-1.5 py-0.5 rounded text-orange-200 uppercase font-mono">
            {selectedLang.split('-')[0]}
          </span>
        </button>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Train className="w-4 h-4" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">RailMate Microservices Travel Suite</div>
              <div className="text-slate-500 text-[11px]">
                Powered by ConfirmTkt API, Where Is My Train API, Zomato API, Google Places & Sarvam AI
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <button onClick={() => setIsHealthOpen(true)} className="hover:text-orange-400 transition-colors flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Microservices Monitor
            </button>
            <button onClick={() => setIsShareOpen(true)} className="hover:text-orange-400 transition-colors flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-blue-400" /> Live Journey Sharing
            </button>
            <div className="flex items-center gap-1 text-slate-400">
              <PhoneCall className="w-3.5 h-3.5 text-orange-400" />
              <span>RPF RailMadad: <strong>139</strong></span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals Container */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onAuthSuccess={(u) => setUser(u)}
        onLogout={() => setUser(null)}
      />

      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onNavigateTab={setActiveTab}
      />

      <MicroservicesStatusModal
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
      />

      <UpiPaymentModal
        isOpen={isUpiOpen}
        onClose={() => setIsUpiOpen(false)}
        bookingDetails={bookingForUpi}
        onPaymentSuccess={() => {}}
      />

      <JourneyShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        trainInfo={shareTrainInfo}
        user={user}
      />

    </div>
  );
}
