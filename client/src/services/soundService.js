// RailMate Sound Engine: Synthesizes realistic Indian Railways Train Running Atmosphere,
// Locomotive Horn, and Tactile UI Click Sounds via Web Audio API with zero external dependencies.

class SoundService {
  constructor() {
    this.audioCtx = null;
    this.isTrainSoundPlaying = false;
    this.isClickSoundEnabled = true;
    this.volume = 0.35; // Default comfortable ambient level
    this.trainNodes = null;
    this.clatterInterval = null;
    this.listeners = new Set();

    // Restore saved sound settings
    if (typeof window !== 'undefined') {
      const savedClick = localStorage.getItem('railmate_click_sound');
      if (savedClick !== null) {
        this.isClickSoundEnabled = savedClick === 'true';
      }

      const savedVol = localStorage.getItem('railmate_sound_volume');
      if (savedVol !== null) {
        this.volume = parseFloat(savedVol) || 0.35;
      }
    }
  }

  // Ensure AudioContext is ready and resumed
  ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // 1. Tactile UI Click Sound (Crisp mechanical switch / ticket punch click)
  playClickSound() {
    if (!this.isClickSoundEnabled) return;
    try {
      const ctx = this.ensureAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Sharp micro frequency drop
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.028);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {
      // Audio playback silently caught if autoplay policy holds
    }
  }

  // Futuristic Terminal Audio Chirp for voice activation
  playTerminalChirp() {
    if (!this.isClickSoundEnabled) return;
    try {
      const ctx = this.ensureAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(740, now);
      osc.frequency.setValueAtTime(1480, now + 0.035);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.095);
    } catch (e) {}
  }

  // 2. Realistic Train Running Ambient Sound (Engine Rumble + Rhythmic Rail Joint Clatter)
  startTrainRunningSound() {
    if (this.isTrainSoundPlaying) return;
    try {
      const ctx = this.ensureAudioContext();
      if (!ctx) return;

      this.isTrainSoundPlaying = true;
      localStorage.setItem('railmate_train_sound', 'true');

      // Master Ambient Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(this.volume, ctx.currentTime + 1.2);
      masterGain.connect(ctx.destination);

      // Low-Frequency Coach Rumble (Pink/Brown filtered noise)
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.8; // boost low rumble
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const lowpassFilter = ctx.createBiquadFilter();
      lowpassFilter.type = 'lowpass';
      lowpassFilter.frequency.setValueAtTime(170, ctx.currentTime);

      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.7, ctx.currentTime);

      noiseSource.connect(lowpassFilter);
      lowpassFilter.connect(rumbleGain);
      rumbleGain.connect(masterGain);
      noiseSource.start();

      // Swaying Low-Frequency Oscillator (Simulates gentle lateral sway of carriage)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.75, ctx.currentTime);
      lfoGain.gain.setValueAtTime(30, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(lowpassFilter.frequency);
      lfo.start();

      // Rhythmic Rail Joints Click-Clack ("kadak-kadak ... kadak-kadak")
      const playRailJointPulse = (delayTime, intensity = 1.0) => {
        if (!this.isTrainSoundPlaying) return;
        const t = ctx.currentTime + delayTime;

        // Metallic rail contact click
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(440, t);
        clickOsc.frequency.exponentialRampToValueAtTime(90, t + 0.045);

        clickGain.gain.setValueAtTime(0.24 * intensity, t);
        clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

        clickOsc.connect(clickGain);
        clickGain.connect(masterGain);

        clickOsc.start(t);
        clickOsc.stop(t + 0.05);

        // Low wheel-rail heavy impact thump
        const thumpOsc = ctx.createOscillator();
        const thumpGain = ctx.createGain();
        thumpOsc.type = 'sine';
        thumpOsc.frequency.setValueAtTime(120, t);
        thumpOsc.frequency.exponentialRampToValueAtTime(48, t + 0.06);

        thumpGain.gain.setValueAtTime(0.28 * intensity, t);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        thumpOsc.connect(thumpGain);
        thumpGain.connect(masterGain);

        thumpOsc.start(t);
        thumpOsc.stop(t + 0.065);
      };

      // Rhythm: Front bogie wheel 1 & 2, then Rear bogie wheel 1 & 2 (~90 km/h Indian express speed)
      const cycleLength = 1080; // ms per rail section
      const scheduleBar = () => {
        if (!this.isTrainSoundPlaying) return;
        playRailJointPulse(0.02, 1.0);
        playRailJointPulse(0.14, 0.78);
        playRailJointPulse(0.44, 0.92);
        playRailJointPulse(0.56, 0.72);
      };

      scheduleBar();
      this.clatterInterval = setInterval(scheduleBar, cycleLength);

      this.trainNodes = {
        masterGain,
        noiseSource,
        lfo,
        lowpassFilter
      };

      this.notifyListeners();
    } catch (e) {
      console.warn('Unable to start train audio engine:', e);
    }
  }

  // Stop Train Running Ambient Sound
  stopTrainRunningSound() {
    if (!this.isTrainSoundPlaying) return;
    this.isTrainSoundPlaying = false;
    localStorage.setItem('railmate_train_sound', 'false');

    if (this.clatterInterval) {
      clearInterval(this.clatterInterval);
      this.clatterInterval = null;
    }

    if (this.trainNodes && this.audioCtx) {
      try {
        const { masterGain, noiseSource, lfo } = this.trainNodes;
        masterGain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.5);
        setTimeout(() => {
          try {
            noiseSource.stop();
            lfo.stop();
            noiseSource.disconnect();
            lfo.disconnect();
          } catch (e) {}
        }, 550);
      } catch (e) {}
      this.trainNodes = null;
    }

    this.notifyListeners();
  }

  // Toggle Train Running Sound
  toggleTrainSound() {
    if (this.isTrainSoundPlaying) {
      this.stopTrainRunningSound();
    } else {
      this.startTrainRunningSound();
    }
    return this.isTrainSoundPlaying;
  }

  // Toggle Click Sound
  toggleClickSound() {
    this.isClickSoundEnabled = !this.isClickSoundEnabled;
    localStorage.setItem('railmate_click_sound', String(this.isClickSoundEnabled));
    if (this.isClickSoundEnabled) {
      this.playClickSound();
    }
    this.notifyListeners();
    return this.isClickSoundEnabled;
  }

  // Set Master Ambient Volume (0.05 to 1.0)
  setVolume(newVol) {
    this.volume = Math.max(0.05, Math.min(1.0, newVol));
    localStorage.setItem('railmate_sound_volume', String(this.volume));
    if (this.trainNodes && this.audioCtx) {
      this.trainNodes.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
    this.notifyListeners();
  }

  // Authentic Indian Railways Locomotive Horn (Dual-tone diesel/electric WAP-7 chord)
  playTrainHorn() {
    try {
      const ctx = this.ensureAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const freqs = [311.13, 369.99, 622.25]; // Indian Railways signature chord (Eb4 + F#4 + Eb5)
      const hornGain = ctx.createGain();

      hornGain.gain.setValueAtTime(0.001, now);
      hornGain.gain.linearRampToValueAtTime(0.38, now + 0.1);
      hornGain.gain.setValueAtTime(0.38, now + 0.95);
      hornGain.gain.linearRampToValueAtTime(0.001, now + 1.45);
      hornGain.connect(ctx.destination);

      freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);

        osc.connect(filter);
        filter.connect(hornGain);

        osc.start(now);
        osc.stop(now + 1.5);
      });

      this.playClickSound();
    } catch (e) {}
  }

  // Observer Subscription
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notifyListeners() {
    this.listeners.forEach(fn => {
      try {
        fn({
          isPlaying: this.isTrainSoundPlaying,
          isClickEnabled: this.isClickSoundEnabled,
          volume: this.volume
        });
      } catch (e) {}
    });
  }
}

export const soundService = new SoundService();
