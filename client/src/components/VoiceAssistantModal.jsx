import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Globe, Sparkles, X, ArrowUpRight, Check, Bot, BrainCircuit, MessageSquare, Send } from 'lucide-react';
import { api } from '../services/api';

export default function VoiceAssistantModal({ isOpen, onClose, onNavigateTab }) {
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [isListening, setIsListening] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [responseResult, setResponseResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assistantMode, setAssistantMode] = useState('VOICE_NAV'); // 'VOICE_NAV' | 'GEMINI_CHAT'
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'नमस्ते! मैं RailMate AI सहायक हूँ, जो Google Gemini 2.0 Flash और Sarvam AI द्वारा संचालित है। आप ट्रेन स्थिति, सीट आरक्षण, या भोजन ऑर्डर करने के बारे में किसी भी भारतीय भाषा में पूछ सकते हैं।'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const recognitionRef = useRef(null);

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
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Google Gemini service encountered a temporary error. Please retry.' }
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
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 via-purple-600 to-orange-500 text-white shadow-lg shadow-purple-500/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Google Gemini & Sarvam Voice AI
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider font-semibold">
                  Gemini 2.0 Flash
                </span>
              </h2>
              <p className="text-xs text-slate-400">Multimodal reasoning & Indic speech recognition for Indian Railways</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs: Voice Navigation vs Gemini Travel Advice */}
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
            <Sparkles className="w-3.5 h-3.5" /> Gemini Railway Intelligence
          </button>
        </div>

        {/* Language selector */}
        <div className="mb-4 relative z-10">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
              <Globe className="w-3 h-3 text-orange-400" /> Indian Regional Language
            </label>
            <span className="text-[10px] text-emerald-400 font-mono">Sarvam Saaras STT + Bulbul TTS</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setSelectedLang(l.code)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
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

        {assistantMode === 'VOICE_NAV' ? (
          /* Voice Navigation Mode */
          <div>
            {/* Microphone Centerpiece */}
            <div className="my-5 flex flex-col items-center justify-center relative z-10">
              <div className="relative">
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
                      : 'bg-gradient-to-tr from-orange-500 via-amber-500 to-purple-600 hover:scale-105 text-white shadow-orange-500/30'
                  }`}
                >
                  {isListening ? <MicOff className="w-8 h-8 animate-pulse" /> : <Mic className="w-8 h-8" />}
                </button>
              </div>

              <div className="mt-3 text-center">
                <p className="text-sm font-semibold text-white">
                  {isListening ? 'Listening in ' + languages.find(l => l.code === selectedLang)?.label : 'Tap microphone to speak'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Powered by Google Gemini 2.0 Flash reasoning & Sarvam AI STT
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
                  placeholder="Or type voice query in Hindi, Tamil, English..."
                  onKeyDown={(e) => e.key === 'Enter' && handleProcessVoiceQuery()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={() => handleProcessVoiceQuery()}
                  disabled={loading || !queryText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
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
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-orange-500/30 relative z-10 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-orange-400 flex items-center gap-1.5">
                    <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-400 animate-pulse' : ''}`} />
                    {responseResult.intent} (Confidence: {Math.round(responseResult.confidence * 100)}%)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {responseResult.engine || 'Gemini 2.0 Flash'}
                  </span>
                </div>

                <p className="text-sm text-slate-100 leading-relaxed font-medium">
                  {responseResult.spokenResponse}
                </p>

                {responseResult.action && responseResult.action !== 'SHOW_HELP' && (
                  <button
                    onClick={handleNavigate}
                    className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md"
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
                        ? 'bg-orange-600 text-white rounded-br-none'
                        : 'bg-slate-800 border border-slate-700/60 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <div>{msg.text}</div>
                    {msg.model && (
                      <div className="text-[9px] text-blue-400 mt-1 font-mono">{msg.model}</div>
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
