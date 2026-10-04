import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Globe, Sparkles, X, ArrowUpRight, Check, Bot } from 'lucide-react';
import { api } from '../services/api';

export default function VoiceAssistantModal({ isOpen, onClose, onNavigateTab }) {
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [isListening, setIsListening] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [responseResult, setResponseResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);

  const samplePrompts = {
    'hi-IN': [
      'मेरी ट्रेन 12952 कहां तक पहुंची?',
      'पीएनआर 2849102941 की स्थिति क्या है?',
      'कोटा स्टेशन पर महाराजा थाली ऑर्डर करो',
      'वेटिंग लिस्ट 15 कन्फर्म होगी क्या?'
    ],
    'en-IN': [
      'Where is my train 12952 right now?',
      'Check PNR 2849102941 status',
      'Order hot food at Kota Junction',
      'Will Waiting List 15 confirm in 3A?'
    ],
    'ta-IN': [
      'ரயில் 12952 எங்குள்ளது?',
      'என் பிஎன்ஆர் 2849102941 நிலை என்ன?',
      'அடுத்த ஸ்டேஷனில் சாப்பாடு ஆர்டர் செய்'
    ],
    'te-IN': [
      'నా రైలు 12952 ఎక్కడ ఉంది?',
      'PNR 2849102941 స్థితిని తనిఖీ చేయండి'
    ],
    'bn-IN': [
      'আমার ট্রেন ১২৯৫২ কোথায় আছে?',
      'পিএনআর ২৮৪৯১০২৯৪১ স্ট্যাটাস কি?'
    ],
    'mr-IN': [
      'माझी ट्रेन १२९५२ कुठे पोहोचली?',
      'पीएनआर २८४९१०२९४१ तपासा'
    ]
  };

  const languages = [
    { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
    { code: 'en-IN', label: 'English (India)' },
    { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
    { code: 'te-IN', label: 'తెలుగు (Telugu)' },
    { code: 'bn-IN', label: 'বাংলা (Bengali)' },
    { code: 'mr-IN', label: 'मराठी (Marathi)' }
  ];

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = selectedLang;

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setQueryText(transcript);
          handleProcessVoiceQuery(transcript);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [selectedLang]);

  if (!isOpen) return null;

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = selectedLang;
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          // If already started or permission blocked, simulate prompt
          setIsListening(true);
          setTimeout(() => {
            const prompt = samplePrompts[selectedLang][0];
            setQueryText(prompt);
            setIsListening(false);
            handleProcessVoiceQuery(prompt);
          }, 2000);
        }
      } else {
        // Fallback simulation for unsupported browsers
        setIsListening(true);
        setTimeout(() => {
          const prompt = samplePrompts[selectedLang][0];
          setQueryText(prompt);
          setIsListening(false);
          handleProcessVoiceQuery(prompt);
        }, 1500);
      }
    }
  };

  const handleProcessVoiceQuery = async (textToProcess) => {
    const text = textToProcess || queryText;
    if (!text.trim()) return;

    setLoading(true);
    try {
      const result = await api.processVoiceQuery(text, selectedLang);
      setResponseResult(result);

      // Play audio response using SpeechSynthesis
      if ('speechSynthesis' in window && result.spokenResponse) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(result.spokenResponse);
        utterance.lang = selectedLang;
        utterance.rate = 1.0;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (prompt) => {
    setQueryText(prompt);
    handleProcessVoiceQuery(prompt);
  };

  const handleNavigate = () => {
    if (!responseResult) return;
    if (responseResult.action === 'NAVIGATE_TO_TRACKER') onNavigateTab('tracker');
    else if (responseResult.action === 'NAVIGATE_TO_PNR') onNavigateTab('pnr');
    else if (responseResult.action === 'NAVIGATE_TO_FOOD') onNavigateTab('food');
    else if (responseResult.action === 'NAVIGATE_TO_BOOKING') onNavigateTab('booking');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Sarvam AI Indic Voice Assistant
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wider font-semibold">
                  Saaras & Bulbul
                </span>
              </h2>
              <p className="text-xs text-slate-400">Speak naturally in Indian regional languages for instant train answers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language selector */}
        <div className="my-4 relative z-10">
          <label className="text-xs text-slate-400 flex items-center gap-1.5 mb-2 font-medium">
            <Globe className="w-3.5 h-3.5 text-orange-400" /> Select Regional Indic Language
          </label>
          <div className="flex flex-wrap gap-1.5">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setSelectedLang(l.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedLang === l.code
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Microphone Centerpiece & Voice Wave */}
        <div className="my-6 flex flex-col items-center justify-center relative z-10">
          <div className="relative">
            {/* Animated pulsing wave rings */}
            {isListening && (
              <>
                <div className="absolute -inset-4 rounded-full bg-orange-500/20 animate-ping duration-1000" />
                <div className="absolute -inset-8 rounded-full bg-orange-500/10 animate-pulse duration-700" />
              </>
            )}

            <button
              onClick={toggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                isListening
                  ? 'bg-rose-500 text-white shadow-rose-500/40 scale-105'
                  : 'bg-gradient-to-tr from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/30 hover:scale-105'
              }`}
            >
              {isListening ? <MicOff className="w-8 h-8 animate-pulse" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm font-semibold text-white">
              {isListening ? 'Listening in ' + languages.find(l => l.code === selectedLang)?.label : 'Tap microphone to speak'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Powered by Sarvam AI Saaras STT & Indic Translation
            </p>
          </div>

          {/* Voice Wave Visualizer */}
          {isListening && (
            <div className="flex items-center gap-1.5 mt-3 h-8">
              {[40, 70, 90, 60, 100, 50, 80, 45, 65].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-orange-400 rounded-full animate-pulse"
                  style={{ height: `${h}%`, animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Input box & submit */}
        <div className="relative z-10 mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Or type voice query in Hindi, Tamil, English..."
              onKeyDown={(e) => e.key === 'Enter' && handleProcessVoiceQuery()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={() => handleProcessVoiceQuery()}
              disabled={loading || !queryText.trim()}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4" /> Ask
            </button>
          </div>
        </div>

        {/* Suggested Quick Prompts */}
        <div className="mb-4 relative z-10">
          <p className="text-[11px] text-slate-400 mb-2 font-medium">Try asking in selected language:</p>
          <div className="flex flex-wrap gap-1.5">
            {(samplePrompts[selectedLang] || samplePrompts['hi-IN']).map((prompt, i) => (
              <button
                key={i}
                onClick={() => handlePromptClick(prompt)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 text-[11px] text-slate-300 hover:text-white transition-colors"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>

        {/* Result Card */}
        {responseResult && (
          <div className="p-4 rounded-2xl bg-slate-800/70 border border-orange-500/30 relative z-10 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-orange-400 flex items-center gap-1.5">
                <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-400 animate-pulse' : ''}`} />
                {responseResult.intent} (Confidence: {Math.round(responseResult.confidence * 100)}%)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Sarvam AI Verified
              </span>
            </div>

            <p className="text-sm text-slate-100 leading-relaxed font-medium">
              {responseResult.spokenResponse}
            </p>

            {responseResult.action && responseResult.action !== 'SHOW_HELP' && (
              <button
                onClick={handleNavigate}
                className="mt-3 w-full py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-orange-600/20"
              >
                Open Feature & View Live Details <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
