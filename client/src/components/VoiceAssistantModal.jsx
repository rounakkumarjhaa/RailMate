import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Globe, Sparkles, X, ArrowUpRight, Check, Bot, BrainCircuit, Send, Heart, MapPin, TrainTrack, Route, Zap, Clock } from 'lucide-react';
import { api } from '../services/api';
import { humanVoice } from '../services/humanVoice';

export default function VoiceAssistantModal({ isOpen, onClose, onNavigateTab }) {
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [isListening, setIsListening] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [responseResult, setResponseResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeVoiceName, setActiveVoiceName] = useState('ChatGPT / Gemini Pure Human Voice');
  const [loading, setLoading] = useState(false);
  const [assistantMode, setAssistantMode] = useState('VOICE_NAV'); // 'VOICE_NAV' | 'CHATGPT_CHAT'
  const [preferredModel, setPreferredModel] = useState('chatgpt'); // 'chatgpt' | 'gemini'
  const [geminiPersona, setGeminiPersona] = useState('aoede');
  const [waveHeight, setWaveHeight] = useState([20, 45, 60, 30]);

  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'ट्रेन नंबर, रूट (जैसे गाजियाबाद से भागलपुर), स्टेशन या PNR पूछें — तुरंत प्रत्यक्ष मानवीय आवाज़ में उत्तर मिलेगा।'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const recognitionRef = useRef(null);

  const personas = [
    { id: 'aoede', name: 'Gemini Aoede', desc: 'Warm Conversational (Google App Live)' },
    { id: 'puck', name: 'ChatGPT Natural', desc: 'Expressive & Informative' },
    { id: 'kore', name: 'Gemini Kore', desc: 'Calm & Gentle Cadence' }
  ];

  const samplePrompts = {
    'hi-IN': [
      'गाजियाबाद से भागलपुर: सबसे तेज़ ट्रेन, टाइमिंग और रूट',
      'दिल्ली से मुंबई: सबसे तेज़ ट्रेन और टाइमिंग',
      'मुंबई से गोवा: सबसे तेज़ ट्रेन और रूट',
      '12952 तेजस राजधानी कहां पहुंची है?',
      'PNR 2849102941 का स्टेटस'
    ],
    'en-IN': [
      'Fastest train, timing & route from Ghaziabad to Bhagalpur',
      'Fastest train & timings from Delhi to Mumbai',
      'Fastest train & timing from Mumbai to Goa',
      'Where is train 12952 right now?',
      'Check PNR 2849102941 status'
    ],
    'ta-IN': [
      'தில்லி முதல் மும்பை ரயில் வழித்தடம் என்ன?',
      'ரயில் 12952 முக்கிய நிறுத்தங்கள் எவை?',
      'கோவா செல்லும் ரயிலின் அழகிய வழித்தடம்'
    ],
    'te-IN': [
      'ఢిల్లీ నుండి ముంబై రైలు రూట్ మరియు స్టేషన్లు ఏమిటి?',
      'రైలు 12952 రూట్ వివరాలు చెప్పండి'
    ],
    'bn-IN': [
      'দিল্লি থেকে মুম্বাই ট্রেনের সম্পূর্ণ রুট কি?',
      'ট্রেন ১২৯৫২ এর প্রধান স্টপগুলি কি?'
    ],
    'mr-IN': [
      'दिल्ली ते मुंबई चा संपूर्ण रेल्वे मार्ग आणि थांबे कोणते?',
      'ट्रेन १२९५२ चे मुख्य थांबे सांगा'
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

  // Speech Recognition initialization
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

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, [selectedLang]);

  useEffect(() => {
    if (!isOpen) {
      humanVoice.stop();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  // Audio wave animation
  useEffect(() => {
    let waveInterval;
    if (isSpeaking) {
      waveInterval = setInterval(() => {
        setWaveHeight([
          Math.floor(20 + Math.random() * 55),
          Math.floor(35 + Math.random() * 60),
          Math.floor(40 + Math.random() * 55),
          Math.floor(25 + Math.random() * 50)
        ]);
      }, 100);
    } else {
      setWaveHeight([16, 24, 28, 18]);
    }
    return () => clearInterval(waveInterval);
  }, [isSpeaking]);

  if (!isOpen) return null;

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      humanVoice.stop();
      setIsSpeaking(false);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = selectedLang;
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          setIsListening(true);
          setTimeout(() => {
            const prompt = samplePrompts[selectedLang][0];
            setQueryText(prompt);
            setIsListening(false);
            handleProcessVoiceQuery(prompt);
          }, 1500);
        }
      } else {
        setIsListening(true);
        setTimeout(() => {
          const prompt = samplePrompts[selectedLang][0];
          setQueryText(prompt);
          setIsListening(false);
          handleProcessVoiceQuery(prompt);
        }, 1200);
      }
    }
  };

  const triggerHumanSpeech = (text) => {
    humanVoice.speak(text, {
      languageCode: selectedLang,
      rate: geminiPersona === 'puck' ? 1.03 : (geminiPersona === 'kore' ? 0.97 : 1.01),
      pitch: 1.0,
      onStart: ({ voiceName }) => {
        setIsSpeaking(true);
        setActiveVoiceName(voiceName);
      },
      onEnd: () => {
        setIsSpeaking(false);
      }
    });
  };

  const handleProcessVoiceQuery = async (textToProcess) => {
    const text = textToProcess || queryText;
    if (!text.trim()) return;

    setLoading(true);
    try {
      const result = await api.processVoiceQuery(text, selectedLang, preferredModel);
      setResponseResult(result);

      if (result.spokenResponse) {
        triggerHumanSpeech(result.spokenResponse);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAiChatSend = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setChatInput('');
    setLoading(true);

    try {
      const result = await api.askAiChat(userMessage, selectedLang);
      if (result.success && result.reply) {
        setChatMessages((prev) => [
          ...prev,
          { sender: 'ai', text: result.reply, model: result.model || 'ChatGPT (GPT-4o)' }
        ]);

        triggerHumanSpeech(result.reply);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'AI Route Assistant encountered a temporary issue. Please retry.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (prompt) => {
    if (assistantMode === 'CHATGPT_CHAT') {
      setChatInput(prompt);
      handleAiChatSend();
    } else {
      setQueryText(prompt);
      handleProcessVoiceQuery(prompt);
    }
  };

  const handleNavigate = () => {
    humanVoice.stop();
    if (!responseResult) return;
    if (responseResult.action === 'NAVIGATE_TO_TRACKER') onNavigateTab('tracker');
    else if (responseResult.action === 'NAVIGATE_TO_PNR') onNavigateTab('pnr');
    else if (responseResult.action === 'NAVIGATE_TO_FOOD') onNavigateTab('food');
    else if (responseResult.action === 'NAVIGATE_TO_BOOKING') onNavigateTab('booking');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 via-blue-500 to-purple-500 text-white shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                ChatGPT & Gemini Voice Travel Assistant
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider font-semibold">
                  ChatGPT (GPT-4o)
                </span>
              </h2>
              <p className="text-xs text-slate-400">Ask anything about routes, stations, timings & travel in pure human voice</p>
            </div>
          </div>
          <button
            onClick={() => {
              humanVoice.stop();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex p-1 my-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 relative z-10">
          <button
            onClick={() => setAssistantMode('VOICE_NAV')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              assistantMode === 'VOICE_NAV'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" /> Voice Navigation & Routes
          </button>
          <button
            onClick={() => setAssistantMode('CHATGPT_CHAT')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              assistantMode === 'CHATGPT_CHAT'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> ChatGPT Travel Assistant
          </button>
        </div>

        {/* AI Model & Voice Persona Switcher */}
        <div className="mb-3 p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">AI Intelligence:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPreferredModel('chatgpt')}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                  preferredModel === 'chatgpt'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ChatGPT (GPT-4o)
              </button>
              <button
                onClick={() => setPreferredModel('gemini')}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                  preferredModel === 'gemini'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Google Gemini
              </button>
            </div>
          </div>

          <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <Heart className="w-3 h-3 text-rose-400" /> Pure Human Speech
          </div>
        </div>

        {/* Language selector */}
        <div className="mb-3 relative z-10">
          <div className="flex items-center justify-between mb-1 px-1">
            <label className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
              <Globe className="w-3 h-3 text-orange-400" /> Language
            </label>
            <span className="text-[10px] text-slate-400 font-mono">Any Indian Regional Language</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setSelectedLang(l.code)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                  selectedLang === l.code
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {assistantMode === 'VOICE_NAV' ? (
          /* Voice Navigation Mode with Gemini Live Wave Visualizer */
          <div>
            
            {/* Undulating 4-Pill Audio Waveform */}
            <div className="my-3 flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-950/80 border border-slate-800/80 relative z-10">
              
              <div className="flex items-center justify-center gap-2 h-14 mb-2">
                <div
                  className="w-2.5 rounded-full bg-gradient-to-t from-emerald-500 to-teal-300 transition-all duration-150 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                  style={{ height: `${waveHeight[0]}px` }}
                />
                <div
                  className="w-2.5 rounded-full bg-gradient-to-t from-blue-500 to-cyan-300 transition-all duration-150 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                  style={{ height: `${waveHeight[1]}px` }}
                />
                <div
                  className="w-2.5 rounded-full bg-gradient-to-t from-purple-500 to-pink-300 transition-all duration-150 shadow-[0_0_12px_rgba(168,85,247,0.6)]"
                  style={{ height: `${waveHeight[2]}px` }}
                />
                <div
                  className="w-2.5 rounded-full bg-gradient-to-t from-amber-500 to-orange-400 transition-all duration-150 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                  style={{ height: `${waveHeight[3]}px` }}
                />
              </div>

              {/* Microphone & Voice Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleListening}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                    isListening
                      ? 'bg-rose-500 text-white shadow-rose-500/40 scale-105'
                      : 'bg-gradient-to-tr from-emerald-500 via-blue-500 to-purple-600 hover:scale-105 text-white shadow-emerald-500/30'
                  }`}
                >
                  {isListening ? <MicOff className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6" />}
                </button>

                {isSpeaking && (
                  <button
                    onClick={() => {
                      humanVoice.stop();
                      setIsSpeaking(false);
                    }}
                    className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30 transition-all"
                    title="Stop Voice Output"
                  >
                    <VolumeX className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="mt-2 text-center">
                <p className="text-xs font-semibold text-white">
                  {isListening
                    ? 'Listening... Ask anything about routes, stations, or trains'
                    : (isSpeaking ? 'Speaking in Pure Human Conversational Voice...' : 'Tap mic or enter any question below')}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Powered by <strong className="text-emerald-400">ChatGPT (OpenAI)</strong> & <strong className="text-blue-400">Google Gemini</strong>
                </p>
              </div>
            </div>

            {/* Input box */}
            <div className="relative z-10 mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Ask anything about train route, stations, halts, food..."
                  onKeyDown={(e) => e.key === 'Enter' && handleProcessVoiceQuery()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleProcessVoiceQuery()}
                  disabled={loading || !queryText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Bot className="w-3.5 h-3.5" /> Ask
                </button>
              </div>
            </div>

            {/* Quick Prompts (Route focused) */}
            <div className="mb-3 relative z-10">
              <div className="flex flex-wrap gap-1.5">
                {(samplePrompts[selectedLang] || samplePrompts['hi-IN']).slice(0, 3).map((prompt, i) => (
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

            {/* Result Card with Route Breakdown */}
            {responseResult && (
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-emerald-500/30 relative z-10 animate-in fade-in duration-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-400 animate-pulse' : ''}`} />
                    {responseResult.intent} (Confidence: {Math.round(responseResult.confidence * 100)}%)
                  </span>
                  <div className="flex items-center gap-2">
                    {isSpeaking && (
                      <button
                        onClick={() => {
                          humanVoice.stop();
                          setIsSpeaking(false);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      >
                        Stop Audio
                      </button>
                    )}
                    <button
                      onClick={() => triggerHumanSpeech(responseResult.spokenResponse)}
                      className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" /> Replay Voice
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-100 leading-relaxed font-medium">
                  {responseResult.spokenResponse}
                </p>

                {/* Detailed Route Card with Fastest Train and Timings */}
                {responseResult.routeDetails && (
                  <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-emerald-500/30 space-y-2.5 text-xs text-slate-300 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                        <Route className="w-4 h-4 text-emerald-400" /> {responseResult.routeDetails.name}
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 uppercase tracking-wide">
                        Fastest Route
                      </span>
                    </div>

                    {/* Fastest Train Highlight Box */}
                    {responseResult.routeDetails.fastestTrain && (
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Fastest Train: {responseResult.routeDetails.fastestTrain.name || responseResult.routeDetails.fastestTrain.trainName}
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono font-semibold">
                            {responseResult.routeDetails.fastestTrain.number || responseResult.routeDetails.fastestTrain.trainNumber}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[9px] text-slate-400 block font-medium">Departure</span>
                            <span className="font-bold text-emerald-400">
                              {responseResult.routeDetails.fastestTrain.departure}
                            </span>
                          </div>
                          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[9px] text-slate-400 block font-medium">Arrival</span>
                            <span className="font-bold text-blue-400">
                              {responseResult.routeDetails.fastestTrain.arrival}
                            </span>
                          </div>
                          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[9px] text-slate-400 block font-medium">Travel Time</span>
                            <span className="font-bold text-amber-300 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" /> {responseResult.routeDetails.fastestTrain.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-300 px-0.5">
                      <span><strong>Total Distance:</strong> {responseResult.routeDetails.distance}</span>
                      <span><strong>Corridor Duration:</strong> {responseResult.routeDetails.duration}</span>
                    </div>

                    {responseResult.routeDetails.majorHalts && (
                      <div className="text-[11px] text-slate-300 pt-1.5 border-t border-slate-800/80">
                        <strong className="text-slate-400 block mb-0.5">Major Halts:</strong>
                        <span className="text-slate-200 leading-relaxed">{responseResult.routeDetails.majorHalts}</span>
                      </div>
                    )}

                    {responseResult.routeDetails.scenicTip && (
                      <div className="text-[11px] text-emerald-400 font-medium pt-1">
                        🌲 <em>{responseResult.routeDetails.scenicTip}</em>
                      </div>
                    )}
                  </div>
                )}

                {responseResult.action && responseResult.action !== 'SHOW_HELP' && (
                  <button
                    onClick={handleNavigate}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:opacity-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    Open Live Details in Dashboard <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ChatGPT Conversational Assistant */
          <div className="space-y-3 relative z-10">
            <div className="h-64 overflow-y-auto space-y-2.5 pr-1 p-2 rounded-2xl bg-slate-950/60 border border-slate-800">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-6 h-6 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-slate-800 border border-slate-700/60 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <div>{msg.text}</div>
                    {msg.sender === 'ai' && (
                      <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-700/60">
                        <button
                          onClick={() => triggerHumanSpeech(msg.text)}
                          className="text-[10px] text-emerald-300 hover:text-white flex items-center gap-1"
                        >
                          <Volume2 className="w-3 h-3" /> Speak in Pure Human Voice
                        </button>
                        {msg.model && (
                          <span className="text-[9px] text-slate-500 font-mono">{msg.model}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-xs text-slate-400 italic flex items-center gap-1.5 p-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" /> ChatGPT is thinking...
                </div>
              )}
            </div>

            <form onSubmit={handleAiChatSend} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask ChatGPT anything about train routes, halts, timings, luggage, food..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={loading || !chatInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
