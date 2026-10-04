// Human Voice Synthesis Engine (Google Gemini Live & Natural Voice Calibrator)

class HumanVoiceEngine {
  constructor() {
    this.voices = [];
    this.isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    this.activeUtterance = null;
    this.initVoices();
  }

  initVoices() {
    if (!this.isSupported) return;

    const loadVoices = () => {
      this.voices = window.speechSynthesis.getVoices();
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  // Find the warmest, most natural human voice available on the device
  findHumanVoice(languageCode = 'hi-IN') {
    if (!this.voices || this.voices.length === 0) {
      this.voices = window.speechSynthesis?.getVoices() || [];
    }

    const langPrefix = languageCode.split('-')[0].toLowerCase();

    // Priority ranker: human/neural voices receive higher scores
    const scoredVoices = this.voices.map(voice => {
      let score = 0;
      const name = voice.name.toLowerCase();
      const voiceLang = voice.lang.toLowerCase();

      // Language match
      if (voiceLang === languageCode.toLowerCase()) score += 40;
      else if (voiceLang.startsWith(langPrefix)) score += 30;

      // Google Neural / Gemini Voices
      if (name.includes('google')) score += 50;
      if (name.includes('natural')) score += 45;
      if (name.includes('premium')) score += 45;
      if (name.includes('enhanced')) score += 40;
      if (name.includes('online')) score += 30; // Edge Neural voices
      if (name.includes('neural')) score += 50;
      if (name.includes('journey') || name.includes('studio')) score += 50;

      // Quality macOS / iOS human voices
      if (name.includes('ava') || name.includes('samantha') || name.includes('serena') || name.includes('lekha') || name.includes('rishi') || name.includes('veena')) {
        score += 35;
      }

      // Negative penalty for robotic/novelty legacy voices
      if (name.includes('espeak') || name.includes('zarvox') || name.includes('trinoids') || name.includes('cellos') || name.includes('bad news') || name.includes('boing')) {
        score -= 100;
      }

      return { voice, score };
    });

    scoredVoices.sort((a, b) => b.score - a.score);
    return scoredVoices.length > 0 && scoredVoices[0].score > 0 ? scoredVoices[0].voice : null;
  }

  // Pre-process text so it sounds conversational and human
  cleanConversationalText(rawText) {
    if (!rawText) return '';
    return rawText
      // Remove markdown bold, italic, code
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/#{1,6}\s?/g, '')
      .replace(/\|/g, ' ')
      // Soften acronyms for human ears
      .replace(/\bPNR\b/g, 'P N R')
      .replace(/\bETA\b/g, 'E T A')
      .replace(/\bGPS\b/g, 'G P S')
      .replace(/\bUPI\b/g, 'U P I')
      .replace(/\bPF\b/g, 'Platform')
      .replace(/\bSch\./g, 'Scheduled')
      .trim();
  }

  // Speak with human cadence, warmth, and natural micro-pauses
  speak(text, {
    languageCode = 'hi-IN',
    onStart = () => {},
    onEnd = () => {},
    onWave = () => {},
    rate = 1.0,
    pitch = 1.0
  } = {}) {
    if (!this.isSupported) {
      onEnd();
      return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    const humanText = this.cleanConversationalText(text);
    if (!humanText) {
      onEnd();
      return;
    }

    const selectedVoice = this.findHumanVoice(languageCode);
    const utterance = new SpeechSynthesisUtterance(humanText);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = languageCode;
    }

    // Calibrate human conversational warmth
    // A slightly warm pitch and human conversational rate prevents robotic monotony
    utterance.rate = Math.max(0.92, Math.min(1.04, rate));
    utterance.pitch = Math.max(0.96, Math.min(1.05, pitch));
    utterance.volume = 1.0;

    utterance.onstart = () => {
      this.activeUtterance = utterance;
      onStart({ voiceName: selectedVoice ? selectedVoice.name : 'Human Natural Voice' });
    };

    utterance.onboundary = (e) => {
      // Trigger voice wave micro-amplitude on word boundary
      onWave(Math.random() * 0.5 + 0.5);
    };

    utterance.onend = () => {
      this.activeUtterance = null;
      onEnd();
    };

    utterance.onerror = () => {
      this.activeUtterance = null;
      onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  stop() {
    if (this.isSupported) {
      window.speechSynthesis.cancel();
      this.activeUtterance = null;
    }
  }

  isSpeaking() {
    return this.isSupported && window.speechSynthesis.speaking;
  }
}

export const humanVoice = new HumanVoiceEngine();
