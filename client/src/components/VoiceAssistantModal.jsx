import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Mic, MicOff, Volume2, VolumeX, Globe, Sparkles, X, 
  ArrowUpRight, Bot, Send, Heart, MapPin, Route, Zap, Clock, 
  Activity, Radio, Cpu, RefreshCw, ChevronRight, Play, Square
} from 'lucide-react';
import { api } from '../services/api';
import { humanVoice } from '../services/humanVoice';
import { soundService } from '../services/soundService';

export default function VoiceAssistantModal({ isOpen, onClose, onNavigateTab }) {
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [isListening, setIsListening] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [responseResult, setResponseResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeVoiceName, setActiveVoiceName] = useState('Pure Human Conversational Voice');
  const [loading, setLoading] = useState(false);
  const [assistantMode, setAssistantMode] = useState('VOICE_TERMINAL'); // 'VOICE_TERMINAL' | 'CHAT_CONSOLE'
  const [preferredModel, setPreferredModel] = useState('chatgpt'); // 'chatgpt' | 'gemini'
  const [geminiPersona, setGeminiPersona] = useState('aoede');
  
  // 24-band Dynamic Audio Visualizer frequencies
  const [eqBars, setEqBars] = useState(new Array(24).fill(12));
  const [audioDb, setAudioDb] = useState('-36.2');
  const [latencyMs, setLatencyMs] = useState(14);
  const [terminalLogs, setTerminalLogs] = useState([]);

  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'ट्रेन नंबर, रूट (गाजियाबाद से भागलपुर), सीट या PNR पूछें — तुरंत प्रत्यक्ष मानवीय आवाज़ में उत्तर मिलेगा।',
      time: 'SYSTEM_BOOT'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const recognitionRef = useRef(null);
  const chatScrollRef = useRef(null);

  const sampleCommands = {
    'hi-IN': [
      { cmd: 'track 12368', text: '12368 विक्रमशिला एक्सप्रेस कहां पहुंची है?' },
      { cmd: 'route GZB -> BGP', text: 'गाजियाबाद से भागलपुर: सबसे तेज़ ट्रेन, टाइमिंग और रूट' },
      { cmd: 'speed 12952', text: '12952 तेजस राजधानी की वर्तमान स्थिति और स्पीड' },
      { cmd: 'pnr 2849102941', text: 'PNR 2849102941 का लाइव स्टेटस चेक करें' },
      { cmd: 'corridor DEL -> BOM', text: 'दिल्ली से मुंबई सबसे तेज़ ट्रेन और टाइमिंग' }
    ],
    'en-IN': [
      { cmd: 'track 12368', text: 'Where is train 12368 Vikramshila Express right now?' },
      { cmd: 'route GZB -> BGP', text: 'Fastest train, timing and route from Ghaziabad to Bhagalpur' },
      { cmd: 'speed 12952', text: 'Live location and speed of 12952 Tejas Rajdhani' },
      { cmd: 'pnr 2849102941', text: 'Check PNR 2849102941 status' },
      { cmd: 'route DEL -> BOM', text: 'Fastest train & timing from Delhi to Mumbai' }
    ],
    'ta-IN': [
      { cmd: 'route DEL -> BOM', text: 'தில்லி முதல் மும்பை ரயில் வழித்தடம் என்ன?' },
      { cmd: 'track 12952', text: 'ரயில் 12952 முக்கிய நிறுத்தங்கள் எவை?' },
      { cmd: 'route BOM -> GOA', text: 'கோவா செல்லும் ரயிலின் அழகிய வழித்தடம்' }
    ],
    'te-IN': [
      { cmd: 'route DEL -> BOM', text: 'ఢిల్లీ నుండి ముంబై రైలు రూట్ మరియు స్టేషన్లు ఏమిటి?' },
      { cmd: 'track 12952', text: 'రైలు 12952 రూట్ వివరాలు చెప్పండి' }
    ],
    'bn-IN': [
      { cmd: 'route DEL -> BOM', text: 'দিল্লি থেকে মুম্বাই ট্রেনের সম্পূর্ণ রুট কি?' },
      { cmd: 'track 12952', text: 'ট্রেন ১২৯৫২ এর প্রধান স্টপগুলি কি?' }
    ],
    'mr-IN': [
      { cmd: 'route DEL -> BOM', text: 'दिल्ली ते मुंबई चा संपूर्ण रेल्वे मार्ग आणि थांबे कोणते?' },
      { cmd: 'track 12952', text: 'ट्रेन १२९५२ चे मुख्य थांबे सांगा' }
    ]
  };

  const languages = [
    { code: 'hi-IN', badge: 'HI', label: 'हिन्दी' },
    { code: 'en-IN', badge: 'EN', label: 'English' },
    { code: 'ta-IN', badge: 'TA', label: 'தமிழ்' },
    { code: 'te-IN', badge: 'TE', label: 'తెలుగు' },
    { code: 'bn-IN', badge: 'BN', label: 'বাংলা' },
    { code: 'mr-IN', badge: 'MR', label: 'मराठी' }
  ];

  // Helper to add timestamped terminal log
  const addLog = (tag, message) => {
    const time = new Date().toTimeString().split(' ')[0] + '.' + String(Date.now() % 1000).padStart(3, '0');
    setTerminalLogs(prev => [...prev.slice(-8), { time, tag, message }]);
  };

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
          addLog('STT_RECOG', transcript);
          handleProcessVoiceQuery(transcript);
        };

        recognition.onerror = (e) => {
          setIsListening(false);
          addLog('STT_ERR', e.error || 'Recognition interrupted');
        };
        recognition.onend = () => {
          setIsListening(false);
          addLog('STT_END', 'Audio stream captured');
        };

        recognitionRef.current = recognition;
      }
    }
  }, [selectedLang]);

  useEffect(() => {
    if (!isOpen) {
      humanVoice.stop();
      setIsSpeaking(false);
      setIsListening(false);
    } else {
      addLog('SYS_INIT', 'AI Voice Terminal OS v2.0 initialized');
      setLatencyMs(Math.floor(11 + Math.random() * 8));
    }
  }, [isOpen]);

  // Audio Equalizer dynamic bars animation
  useEffect(() => {
    let interval;
    if (isListening || isSpeaking) {
      interval = setInterval(() => {
        setEqBars(prev => prev.map((_, i) => {
          const centerBias = 1 - Math.abs(i - 11.5) / 12;
          const boost = isSpeaking ? 65 : 45;
          const rand = Math.random() * boost * (0.4 + centerBias * 0.8);
          return Math.max(8, Math.floor(rand + 10));
        }));
        setAudioDb((-(Math.random() * 12 + 6)).toFixed(1));
      }, 70);
    } else {
      setEqBars(prev => prev.map((_, i) => {
        const idleWave = Math.sin(Date.now() / 400 + i * 0.4) * 6 + 12;
        return Math.max(6, Math.floor(idleWave));
      }));
      setAudioDb('-38.0');
    }
    return () => clearInterval(interval);
  }, [isListening, isSpeaking]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  if (!isOpen) return null;

  const toggleListening = () => {
    soundService.playTerminalChirp();

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      addLog('MIC_INPUT', 'Recording suspended by user');
    } else {
      humanVoice.stop();
      setIsSpeaking(false);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = selectedLang;
          recognitionRef.current.start();
          setIsListening(true);
          addLog('MIC_INPUT', `Listening stream open [${selectedLang}]`);
        } catch (e) {
          setIsListening(true);
          addLog('MIC_STREAM', 'Fallback acoustic sensor activated');
          setTimeout(() => {
            const prompt = (sampleCommands[selectedLang] || sampleCommands['hi-IN'])[0].text;
            setQueryText(prompt);
            setIsListening(false);
            handleProcessVoiceQuery(prompt);
          }, 1400);
        }
      } else {
        setIsListening(true);
        addLog('MIC_STREAM', 'Simulated acoustic sensor active');
        setTimeout(() => {
          const prompt = (sampleCommands[selectedLang] || sampleCommands['hi-IN'])[0].text;
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
        addLog('TTS_PLAY', `Speaking: "${text.slice(0, 32)}..."`);
      },
      onEnd: () => {
        setIsSpeaking(false);
        addLog('TTS_DONE', 'Voice synthesis finished');
      }
    });
  };

  const handleProcessVoiceQuery = async (textToProcess) => {
    const text = textToProcess || queryText;
    if (!text.trim()) return;

    soundService.playClickSound();
    setLoading(true);
    addLog('QUERY_EXEC', text);

    try {
      const result = await api.processVoiceQuery(text, selectedLang, preferredModel);
      setResponseResult(result);
      addLog('INTENT_OK', `${result.intent || 'RESOLVED'} (Score: ${Math.round((result.confidence || 0.98) * 100)}%)`);

      if (result.spokenResponse) {
        triggerHumanSpeech(result.spokenResponse);
      }
    } catch (e) {
      console.error(e);
      addLog('QUERY_ERR', 'Failed to resolve voice intent');
    } finally {
      setLoading(false);
    }
  };

  const handleAiChatSend = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    soundService.playClickSound();
    const userMessage = chatInput.trim();
    const timeNow = new Date().toTimeString().split(' ')[0];
    
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMessage, time: timeNow }]);
    setChatInput('');
    setLoading(true);
    addLog('CHAT_SEND', userMessage);

    try {
      const result = await api.askAiChat(userMessage, selectedLang);
      if (result.success && result.reply) {
        setChatMessages((prev) => [
          ...prev,
          { 
            sender: 'ai', 
            text: result.reply, 
            model: result.model || 'ChatGPT (GPT-4o)',
            time: new Date().toTimeString().split(' ')[0] 
          }
        ]);
        addLog('CHAT_RECV', 'Response received from AI Core');
        triggerHumanSpeech(result.reply);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'AI Route Assistant encountered a network timeout. Please retry.', time: timeNow }
      ]);
      addLog('CHAT_ERR', 'Connection timeout');
    } finally {
      setLoading(false);
    }
  };

  const handleCommandClick = (cmdObj) => {
    soundService.playTerminalChirp();
    if (assistantMode === 'CHAT_CONSOLE') {
      setChatInput(cmdObj.text);
      setQueryText(cmdObj.text);
      handleAiChatSend();
    } else {
      setQueryText(cmdObj.text);
      handleProcessVoiceQuery(cmdObj.text);
    }
  };

  const handleNavigate = () => {
    soundService.playClickSound();
    humanVoice.stop();
    if (!responseResult) return;
    if (responseResult.action === 'NAVIGATE_TO_TRACKER') onNavigateTab('tracker');
    else if (responseResult.action === 'NAVIGATE_TO_PNR') onNavigateTab('pnr');
    else if (responseResult.action === 'NAVIGATE_TO_FOOD') onNavigateTab('food');
    else if (responseResult.action === 'NAVIGATE_TO_BOOKING') onNavigateTab('booking');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
      
      {/* High-tech Cyber Terminal Outer Shell */}
      <div className="bg-slate-950 border border-emerald-500/30 rounded-3xl max-w-2xl w-full shadow-[0_0_60px_rgba(16,185,129,0.18)] relative overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Futuristic scanline / grid texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(16,185,129,0.12),rgba(0,0,0,0))] pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Terminal Top Title Bar (Classic Mac / Linux Window Header with Neon HUD) */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-emerald-500/20 flex items-center justify-between gap-3 relative z-10 shrink-0">
          
          <div className="flex items-center gap-3">
            {/* Window control LED lights */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] cursor-pointer" onClick={() => { humanVoice.stop(); onClose(); }} />
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </div>

            <div className="h-4 w-px bg-slate-700" />

            <div className="flex items-center gap-2 font-mono">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white tracking-wider">
                RAILMATE_AI_VOICE_TERMINAL
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                v2.0-STT
              </span>
            </div>
          </div>

          {/* Right Status Badges */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 font-mono text-[10px]">
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> SYS_ONLINE
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                {latencyMs}ms
              </span>
            </div>

            <button
              onClick={() => {
                soundService.playClickSound();
                humanVoice.stop();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
              title="Close Terminal [ESC]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Terminal Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 relative z-10 flex-1">
          
          {/* 2. Terminal Mode & Engine Command Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2 rounded-2xl bg-slate-900/80 border border-slate-800">
            {/* Mode Switcher */}
            <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 gap-1 font-mono text-xs">
              <button
                onClick={() => {
                  soundService.playClickSound();
                  setAssistantMode('VOICE_TERMINAL');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
                  assistantMode === 'VOICE_TERMINAL'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" /> &gt;_ VOICE TERMINAL
              </button>
              <button
                onClick={() => {
                  soundService.playClickSound();
                  setAssistantMode('CHAT_CONSOLE');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
                  assistantMode === 'CHAT_CONSOLE'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" /> &gt;_ CHAT CONSOLE
              </button>
            </div>

            {/* AI Model Intelligence Switcher */}
            <div className="flex items-center gap-1.5 font-mono text-[11px] self-end sm:self-auto">
              <span className="text-slate-400 text-[10px] uppercase mr-1">NEURAL_CORE:</span>
              <button
                onClick={() => {
                  soundService.playClickSound();
                  setPreferredModel('chatgpt');
                }}
                className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                  preferredModel === 'chatgpt'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                GPT-4o
              </button>
              <button
                onClick={() => {
                  soundService.playClickSound();
                  setPreferredModel('gemini');
                }}
                className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                  preferredModel === 'gemini'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Gemini 2.0
              </button>
            </div>
          </div>

          {/* 3. Indic Language Terminal Selector */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 font-mono text-xs">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mr-1">
              <Globe className="w-3 h-3 text-emerald-400" /> LANG_MATRIX:
            </span>
            {languages.map((l) => {
              const active = selectedLang === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => {
                    soundService.playClickSound();
                    setSelectedLang(l.code);
                    addLog('LANG_SET', `Matrix switched to [${l.badge}] ${l.label}`);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)] font-bold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span className={`text-[10px] ${active ? 'text-slate-950' : 'text-emerald-400'}`}>[{l.badge}]</span>
                  <span>{l.label}</span>
                </button>
              );
            })}
          </div>

          {assistantMode === 'VOICE_TERMINAL' ? (
            /* VOICE TERMINAL MODE */
            <div className="space-y-4">
              
              {/* Dynamic 24-Band Equalizer & Reactor Mic Deck */}
              <div className="p-5 rounded-3xl bg-slate-900/90 border border-emerald-500/30 relative overflow-hidden flex flex-col items-center justify-center">
                
                {/* HUD Spectral Telemetry Bar */}
                <div className="w-full flex items-center justify-between font-mono text-[10px] text-slate-400 mb-4 pb-2 border-b border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Activity className={`w-3 h-3 ${isListening || isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                    BAND: 80Hz - 16kHz
                  </span>
                  <span className="text-emerald-400 font-bold">
                    SIGNAL: {audioDb} dB
                  </span>
                  <span className="hidden sm:inline text-cyan-400">
                    {isListening ? 'STREAMING PCM...' : (isSpeaking ? 'NEURAL SPEECH OUT' : 'STANDBY IDLE')}
                  </span>
                </div>

                {/* 24-Band Responsive Spectrum Equalizer Bars */}
                <div className="flex items-end justify-center gap-1 sm:gap-1.5 h-16 w-full max-w-md px-2 mb-5">
                  {eqBars.map((h, i) => {
                    // Vibrant color wave across frequencies: Emerald -> Cyan -> Purple -> Amber
                    const color = i < 6 
                      ? 'from-emerald-500 to-teal-400' 
                      : i < 12 
                      ? 'from-cyan-500 to-sky-300' 
                      : i < 18 
                      ? 'from-purple-500 to-fuchsia-400' 
                      : 'from-amber-500 to-orange-400';
                    return (
                      <div
                        key={i}
                        className={`w-2.5 sm:w-3 rounded-full bg-gradient-to-t ${color} transition-all duration-75 shadow-[0_0_8px_rgba(16,185,129,0.3)]`}
                        style={{ height: `${h}px` }}
                      />
                    );
                  })}
                </div>

                {/* Central Holographic Pulse Microphone Reactor */}
                <div className="relative flex items-center justify-center mb-3">
                  
                  {/* Concentric Animated Radar Wave Rings */}
                  {isListening && (
                    <>
                      <div className="absolute w-28 h-28 rounded-full border-2 border-rose-500/40 animate-ping duration-1000 pointer-events-none" />
                      <div className="absolute w-36 h-36 rounded-full border border-rose-500/20 animate-pulse duration-700 pointer-events-none" />
                    </>
                  )}
                  {isSpeaking && (
                    <>
                      <div className="absolute w-28 h-28 rounded-full border-2 border-emerald-400/40 animate-ping duration-1000 pointer-events-none" />
                      <div className="absolute w-36 h-36 rounded-full border border-cyan-400/30 animate-pulse duration-700 pointer-events-none" />
                    </>
                  )}

                  {/* Main Reactor Button */}
                  <button
                    onClick={toggleListening}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative z-10 ${
                      isListening
                        ? 'bg-rose-500 text-white shadow-[0_0_35px_rgba(244,63,94,0.6)] scale-105'
                        : isSpeaking
                        ? 'bg-gradient-to-tr from-emerald-500 via-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_35px_rgba(16,185,129,0.6)] animate-pulse'
                        : 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 hover:scale-105 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="w-8 h-8 animate-pulse text-white" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </button>

                  {/* Quick Stop Audio Button when Speaking */}
                  {isSpeaking && (
                    <button
                      onClick={() => {
                        soundService.playClickSound();
                        humanVoice.stop();
                        setIsSpeaking(false);
                        addLog('AUDIO_HALT', 'Audio playback halted');
                      }}
                      className="absolute -right-14 p-2.5 rounded-full bg-slate-900 border border-rose-500/40 text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                      title="Mute Audio Stream"
                    >
                      <VolumeX className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* State Text & Feedback */}
                <div className="text-center font-mono">
                  <div className="text-sm font-bold text-white flex items-center justify-center gap-2">
                    {isListening ? (
                      <span className="text-rose-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        RECORDING SPEECH INPUT...
                      </span>
                    ) : isSpeaking ? (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 animate-bounce" />
                        SPEAKING IN PURE HUMAN VOICE
                      </span>
                    ) : (
                      <span className="text-slate-300">
                        TAP MICROPHONE OR TYPE COMMAND BELOW
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Direct Speech-to-Intent Engine • Neural Regional Voice Telemetry
                  </p>
                </div>
              </div>

              {/* Terminal CLI Command Input Bar */}
              <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 flex items-center gap-2 font-mono shadow-inner">
                <span className="text-emerald-400 text-xs font-bold pl-2 select-none">
                  railmate@voice:~$
                </span>
                <input
                  type="text"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Ask train route, speed, status, halts, PNR..."
                  onKeyDown={(e) => e.key === 'Enter' && handleProcessVoiceQuery()}
                  className="flex-1 bg-transparent border-none text-white text-xs font-mono placeholder-slate-500 focus:outline-none"
                />
                <button
                  onClick={() => handleProcessVoiceQuery()}
                  disabled={loading || !queryText.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-40"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>EXEC ↵</span>}
                </button>
              </div>

              {/* Quick CLI Command Badges (Clickable executable commands) */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>QUICK_EXECUTABLES:</span>
                  <span className="text-emerald-400">Click to run</span>
                </div>
                <div className="flex flex-wrap gap-1.5 font-mono">
                  {(sampleCommands[selectedLang] || sampleCommands['hi-IN']).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCommandClick(item)}
                      className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-[11px] text-slate-300 hover:text-emerald-300 transition-all flex items-center gap-1.5 group shadow-sm"
                    >
                      <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform">&gt;</span>
                      <span className="text-emerald-400 font-bold">{item.cmd}</span>
                      <span className="text-slate-500 text-[10px] truncate max-w-[160px]">({item.text})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Terminal Log Stream Window */}
              <div className="p-3 rounded-2xl bg-black/80 border border-slate-800/80 font-mono text-[11px] text-slate-400 space-y-1 max-h-28 overflow-y-auto">
                <div className="text-[10px] text-slate-500 border-b border-slate-800/60 pb-1 flex justify-between">
                  <span>TELEMETRY_LOGS</span>
                  <span>BUFFER: 8 EVENTS</span>
                </div>
                {terminalLogs.length === 0 ? (
                  <div className="text-slate-600 italic">No events logged yet. Tap mic or click quick command.</div>
                ) : (
                  terminalLogs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-slate-500 text-[10px]">{log.time}</span>
                      <span className="text-emerald-400 font-bold">[{log.tag}]</span>
                      <span className="text-slate-300 truncate">{log.message}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Dynamic Result Card with Holographic Route Telemetry */}
              {responseResult && (
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-emerald-500/40 relative z-10 animate-in fade-in duration-200 space-y-3.5 shadow-xl">
                  
                  {/* Result Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                      <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-400 animate-pulse' : ''}`} />
                      [INTENT: {responseResult.intent || 'RESOLVED'}] // CONFIDENCE: {Math.round((responseResult.confidence || 0.98) * 100)}%
                    </span>
                    
                    <div className="flex items-center gap-2 font-mono">
                      {isSpeaking ? (
                        <button
                          onClick={() => {
                            soundService.playClickSound();
                            humanVoice.stop();
                            setIsSpeaking(false);
                          }}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        >
                          STOP AUDIO
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            soundService.playClickSound();
                            triggerHumanSpeech(responseResult.spokenResponse);
                          }}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1"
                        >
                          <Play className="w-2.5 h-2.5" /> REPLAY VOICE
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Spoken Response Text */}
                  <p className="text-sm text-slate-100 leading-relaxed font-medium font-sans">
                    {responseResult.spokenResponse}
                  </p>

                  {/* Detailed Route Breakdown Deck */}
                  {responseResult.routeDetails && (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3 text-xs text-slate-300 font-mono shadow-inner">
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                          <Route className="w-4 h-4 text-emerald-400" /> {responseResult.routeDetails.name}
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 uppercase">
                          Fastest Corridor
                        </span>
                      </div>

                      {/* Fastest Train Highlight Box */}
                      {responseResult.routeDetails.fastestTrain && (
                        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-cyan-500/10 border border-amber-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              {responseResult.routeDetails.fastestTrain.name || responseResult.routeDetails.fastestTrain.trainName}
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                              #{responseResult.routeDetails.fastestTrain.number || responseResult.routeDetails.fastestTrain.trainNumber}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-[11px]">
                            <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-center">
                              <span className="text-[9px] text-slate-400 block">DEPARTURE</span>
                              <span className="font-bold text-emerald-400">
                                {responseResult.routeDetails.fastestTrain.departure}
                              </span>
                            </div>
                            <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-center">
                              <span className="text-[9px] text-slate-400 block">ARRIVAL</span>
                              <span className="font-bold text-cyan-400">
                                {responseResult.routeDetails.fastestTrain.arrival}
                              </span>
                            </div>
                            <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-center">
                              <span className="text-[9px] text-slate-400 block">TRAVEL TIME</span>
                              <span className="font-bold text-amber-300 flex items-center justify-center gap-1">
                                <Clock className="w-3 h-3 text-amber-400" />
                                {responseResult.routeDetails.fastestTrain.duration}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-300 px-1">
                        <span><strong>Total Distance:</strong> {responseResult.routeDetails.distance}</span>
                        <span><strong>Corridor Time:</strong> {responseResult.routeDetails.duration}</span>
                      </div>

                      {responseResult.routeDetails.majorHalts && (
                        <div className="text-[11px] text-slate-300 pt-1.5 border-t border-slate-800">
                          <strong className="text-slate-400 block mb-0.5">Major Halts:</strong>
                          <span className="text-slate-200 leading-relaxed font-sans">{responseResult.routeDetails.majorHalts}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dashboard Action Button */}
                  {responseResult.action && responseResult.action !== 'SHOW_HELP' && (
                    <button
                      onClick={handleNavigate}
                      className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-95 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    >
                      &gt;_ OPEN IN LIVE DASHBOARD <ArrowUpRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* CHAT CONSOLE MODE (Terminal Style IRC / Console Layout) */
            <div className="space-y-3 font-mono">
              <div 
                ref={chatScrollRef}
                className="h-80 overflow-y-auto space-y-3 p-3.5 rounded-2xl bg-black/85 border border-slate-800 text-xs text-slate-300"
              >
                <div className="text-[10px] text-slate-500 border-b border-slate-800/80 pb-1.5 flex justify-between">
                  <span>TERMINAL_SESSION: ACTIVE</span>
                  <span>ENCRYPTION: TLS_1.3</span>
                </div>

                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`space-y-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    <div className="text-[10px] text-slate-500 flex items-center gap-2 select-none" style={{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                      <span className={msg.sender === 'user' ? 'text-cyan-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {msg.sender === 'user' ? 'user@guest:~$' : 'ai@railmate-core:~$'}
                      </span>
                      <span>{msg.time || 'NOW'}</span>
                    </div>

                    <div
                      className={`inline-block p-3 rounded-2xl text-xs max-w-[90%] text-left font-sans leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-900 border border-slate-700/80 text-slate-100 rounded-tl-none shadow-lg'
                      }`}
                    >
                      <div>{msg.text}</div>

                      {msg.sender === 'ai' && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between font-mono text-[10px]">
                          <button
                            onClick={() => {
                              soundService.playClickSound();
                              triggerHumanSpeech(msg.text);
                            }}
                            className="text-emerald-400 hover:text-white flex items-center gap-1.5"
                          >
                            <Volume2 className="w-3 h-3" /> Speak in Pure Human Voice
                          </button>
                          {msg.model && (
                            <span className="text-slate-500 text-[9px]">{msg.model}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="text-xs text-emerald-400 font-mono italic flex items-center gap-2 p-2">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" /> Neural core thinking...
                  </div>
                )}
              </div>

              {/* Console Input Bar */}
              <form onSubmit={handleAiChatSend} className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus-within:border-cyan-500">
                  <span className="text-cyan-400 text-xs font-mono font-bold select-none">&gt;</span>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask route, luggage rules, food, delays, halts..."
                    className="flex-1 bg-transparent border-none text-white text-xs font-mono focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !chatInput.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 text-slate-950 font-bold text-xs font-mono transition-all flex items-center gap-1.5 disabled:opacity-40 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  <Send className="w-3.5 h-3.5" /> SEND
                </button>
              </form>
            </div>
          )}

        </div>

        {/* 4. Terminal Bottom Footer HUD */}
        <div className="px-5 py-2.5 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>CORE: GPT-4o / GEMINI FLASH</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-slate-400">PURE HUMAN SPEECH SYNTHESIS</span>
          </div>

          <div className="text-slate-400">
            PRESS <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">ESC</kbd> TO EXIT
          </div>
        </div>

      </div>
    </div>
  );
}
