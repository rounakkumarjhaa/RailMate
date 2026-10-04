import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Globe, Sparkles, X, ArrowUpRight, Check, Bot, BrainCircuit, Send, Radio, Heart } from 'lucide-react';
import { api } from '../services/api';
import { humanVoice } from '../services/humanVoice';

export default function VoiceAssistantModal({ isOpen, onClose, onNavigateTab }) {
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [isListening, setIsListening] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [responseResult, setResponseResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeVoiceName, setActiveVoiceName] = useState('Google Gemini Pure Human Voice');
  const [loading, setLoading] = useState(false);
  const [assistantMode, setAssistantMode] = useState('VOICE_NAV'); // 'VOICE_NAV' | 'GEMINI_CHAT'
  const [geminiPersona, setGeminiPersona] = useState('aoede'); // 'aoede' (warm) | 'puck' (expressive) | 'kore' (calm)
  const [waveHeight, setWaveHeight] = useState([20, 45, 60, 30]);

  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'नमस्ते! मैं RailMate AI सहायक हूँ। Google Gemini Live की स्वाभाविक मानवीय आवाज़ में आपकी सेवा के लिए तैयार हूँ। ट्रेन स्थिति, सीट आरक्षण, या भोजन ऑर्डर करने के बारे में किसी भी भारतीय भाषा में पूछ सकते हैं।'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const recognitionRef = useRef(null);

  const personas = [
    { id: 'aoede', name: 'Gemini Aoede', desc: 'Warm Conversational (Google App Live)', color: 'from-blue-500 to-purple-500' },
    { id: 'puck', name: 'Gemini Puck', desc: 'Friendly & Expressive', color: 'from-orange-500 to-amber-500' },
    { id: 'kore', name: 'Gemini Kore', desc: 'Calm & Natural Cadence', color: 'from-emerald-500 to-teal-500' }
  ];

  const samplePrompts = {
    'hi-IN': [
      'मेरी ट्रेन 12952 कहां तक पहुंची?',
      'पीएनआर 2849102941 की स्थिति क्या है?',
      'कोटा स्टेशन पर महाराजा थाली ऑर्डर करो',
      'वंदे भारत में सामान ले जाने के क्या नियम हैं?',
      'सीनियर सिटिजन के लिए लोअर बर्थ कैसे पाएं?'
    ],
    'en-IN': [
      'Where is my train 12952 right now?',
      'Check PNR 2849102941 status',
      'Order hot food at Kota Junction',
      'What are the luggage limits on Vande Bharat?',
      'Explain RAC vs Waiting list confirmation rules'
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

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, [selectedLang]);

  // Clean up speech when modal closes
  useEffect(() => {
    if (!isOpen) {
      humanVoice.stop();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  // Gemini Live Wave Animation when speaking
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
      humanVoice.stop(); // stop any current playback before listening
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
      rate: geminiPersona === 'puck' ? 1.04 : (geminiPersona === 'kore' ? 0.97 : 1.01),
      pitch: geminiPersona === 'puck' ? 1.03 : (geminiPersona === 'kore' ? 0.98 : 1.0),
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
      const result = await api.processVoiceQuery(text, selectedLang);
      setResponseResult(result);

      // Trigger pure human voice output
      if (result.spokenResponse) {
        triggerHumanSpeech(result.spokenResponse);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGeminiChatSend = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setChatInput('');
    setLoading(true);

    try {
      const result = await api.askGeminiChat(userMessage, selectedLang);
      if (result.success && result.reply) {
        setChatMessages((prev) => [
          ...prev,
          { sender: 'ai', text: result.reply, model: result.model || 'Gemini 2.0 Flash' }
        ]);

        // Speak response in pure human voice
        triggerHumanSpeech(result.reply);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Google Gemini encountered a temporary issue. Please retry.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (prompt) => {
    if (assistantMode === 'GEMINI_CHAT') {
      setChatInput(prompt);
      handleGeminiChatSend();
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
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-500 via-purple-500 to-amber-500 text-white shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Google Gemini Live Voice Assistant
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider font-semibold">
                  Pure Human Voice
                </span>
              </h2>
              <p className="text-xs text-slate-400">Natural conversational speech with zero robotic tone</p>
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
            <Mic className="w-3.5 h-3.5" /> Voice Navigation & Actions
          </button>
          <button
            onClick={() => setAssistantMode('GEMINI_CHAT')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              assistantMode === 'GEMINI_CHAT'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" /> Gemini Railway Intelligence
          </button>
        </div>

        {/* Gemini Persona Selector (Human Voice Style) */}
        <div className="mb-3 p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 relative z-10">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" /> Human Voice Persona (Gemini Live)
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              {isSpeaking ? 'Speaking in Natural Tone' : 'Calibrated for Human Speech'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => setGeminiPersona(p.id)}
                className={`py-1.5 px-2 rounded-xl text-left border transition-all ${
                  geminiPersona === p.id
                    ? 'bg-slate-800 border-blue-500 text-white shadow-md ring-1 ring-blue-500/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-[11px] font-bold text-white leading-tight">{p.name}</div>
                <div className="text-[9px] text-slate-400 leading-tight truncate mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Language selector */}
        <div className="mb-3 relative z-10">
          <div className="flex items-center justify-between mb-1 px-1">
            <label className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
              <Globe className="w-3 h-3 text-orange-400" /> Language
            </label>
            <span className="text-[10px] text-slate-400 font-mono">Neural Accent Detection</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setSelectedLang(l.code)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                  selectedLang === l.code
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {assistantMode === 'VOICE_NAV' ? (
          /* Voice Navigation Mode with Gemini Live Visualizer */
          <div>
            
            {/* Google Gemini Live Visualizer & Microphone Centerpiece */}
            <div className="my-4 flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-950/80 border border-slate-800/80 relative z-10">
              
              {/* Gemini Live Signature 4-Pill Audio Waveform */}
              <div className="flex items-center justify-center gap-2 h-16 mb-3">
                <div
                  className="w-2.5 rounded-full bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-150 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                  style={{ height: `${waveHeight[0]}px` }}
                />
                <div
                  className="w-2.5 rounded-full bg-gradient-to-t from-purple-600 to-pink-400 transition-all duration-150 shadow-[0_0_12px_rgba(168,85,247,0.6)]"
                  style={{ height: `${waveHeight[1]}px` }}
                />
                <div
                  className="w-2.5 rounded-full bg-gradient-to-t from-rose-600 to-orange-400 transition-all duration-150 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                  style={{ height: `${waveHeight[2]}px` }}
                />
                <div
                  className="w-2.5 rounded-full bg-gradient-to-t from-amber-500 to-yellow-300 transition-all duration-150 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                  style={{ height: `${waveHeight[3]}px` }}
                />
              </div>

              {/* Microphone & Speaking Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleListening}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                    isListening
                      ? 'bg-rose-500 text-white shadow-rose-500/40 scale-105'
                      : 'bg-gradient-to-tr from-blue-600 via-purple-600 to-orange-500 hover:scale-105 text-white shadow-blue-500/30'
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

              <div className="mt-2.5 text-center">
                <p className="text-xs font-semibold text-white">
                  {isListening
                    ? 'Listening... Speak naturally in ' + languages.find(l => l.code === selectedLang)?.label
                    : (isSpeaking ? 'Speaking in Gemini Live Pure Human Voice...' : 'Tap mic to speak or enter query below')}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Voice Model: <span className="text-blue-300 font-mono">{activeVoiceName}</span>
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
                  placeholder="Ask anything about train status, PNR, food..."
                  onKeyDown={(e) => e.key === 'Enter' && handleProcessVoiceQuery()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => handleProcessVoiceQuery()}
                  disabled={loading || !queryText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Bot className="w-3.5 h-3.5" /> Ask
                </button>
              </div>
            </div>

            {/* Quick Prompts */}
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

            {/* Result Card */}
            {responseResult && (
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-blue-500/30 relative z-10 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
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
                      className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" /> Replay
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-100 leading-relaxed font-medium">
                  {responseResult.spokenResponse}
                </p>

                {responseResult.action && responseResult.action !== 'SHOW_HELP' && (
                  <button
                    onClick={handleNavigate}
                    className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 hover:opacity-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    Open Feature & View Live Details <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

          </div>
        ) : (
          /* Gemini Railway Conversational Intelligence Chat */
          <div className="space-y-3 relative z-10">
            <div className="h-64 overflow-y-auto space-y-2.5 pr-1 p-2 rounded-2xl bg-slate-950/60 border border-slate-800">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-6 h-6 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-800 border border-slate-700/60 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <div>{msg.text}</div>
                    {msg.sender === 'ai' && (
                      <div className="mt-2 flex items-center gap-2 pt-1.5 border-t border-slate-700/60">
                        <button
                          onClick={() => triggerHumanSpeech(msg.text)}
                          className="text-[10px] text-blue-300 hover:text-white flex items-center gap-1"
                        >
                          <Volume2 className="w-3 h-3" /> Speak in Pure Human Voice
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-xs text-slate-400 italic flex items-center gap-1.5 p-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" /> Gemini is thinking...
                </div>
              )}
            </div>

            <form onSubmit={handleGeminiChatSend} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Gemini anything (e.g., Luggage rules, senior quota, scenic routes)..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !chatInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/20"
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
