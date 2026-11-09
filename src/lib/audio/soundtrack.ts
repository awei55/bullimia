/**
 * BULLIMIA PROCEDURAL SYNTHWAVE & RESPONSIVE AUDIO ENGINE
 * Generates an adaptive, dynamic indie finance trader soundtrack
 * modulated in real-time by player PnL velocity, position sizing, and margin stress.
 */

export class SoundtrackEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  public isMuted: boolean = false;
  private isRunning: boolean = false;
  private step: number = 0;
  private nextNoteTime: number = 0;
  private timerId: number | null = null;

  // Adaptive parameters
  private baseBpm: number = 118;
  private currentBpm: number = 118;
  private tension: number = 0; // 0 (calm) to 1 (extreme stress/loss)
  private euphoria: number = 0; // 0 to 1 (profit/high watermark)

  // Cyberpunk Bass / Synthwave Scale (C Minor Pentatonic & Aeolian)
  // C2, Eb2, F2, G2, Bb2, C3, Eb3, G3
  private bassNotes: number[] = [65.41, 77.78, 87.31, 98.00, 116.54, 130.81, 155.56, 196.00];
  private arpeggioNotes: number[] = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25, 622.25, 783.99];

  constructor() {}

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.startMusicLoop();
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public updateTelemetry(pnl: number, lots: number, isMarginWarning: boolean) {
    if (!this.ctx) return;

    // Shift BPM and tension based on trading state
    if (lots > 1) {
      const lotRatio = Math.min(1.0, lots / 100);
      this.currentBpm = this.baseBpm + lotRatio * 32; // up to 150 BPM at 100 lots
    } else {
      this.currentBpm = this.baseBpm;
    }

    if (pnl < 0) {
      this.tension = Math.min(1.0, Math.abs(pnl) / 5000);
      this.euphoria = 0;
    } else {
      this.euphoria = Math.min(1.0, pnl / 10000);
      this.tension = 0;
    }

    if (isMarginWarning) {
      this.tension = 1.0;
    }
  }

  private startMusicLoop() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.nextNoteTime = this.ctx ? this.ctx.currentTime + 0.1 : 0.1;
    this.scheduleNotes();
  }

  private scheduleNotes = () => {
    if (!this.isRunning || !this.ctx) return;

    const secondsPerBeat = 60.0 / this.currentBpm;
    const sixteenthNote = secondsPerBeat / 4;

    while (this.nextNoteTime < this.ctx.currentTime + 0.2) {
      this.playSequencerStep(this.nextNoteTime, this.step);
      this.nextNoteTime += sixteenthNote;
      this.step = (this.step + 1) % 32;
    }

    this.timerId = window.setTimeout(this.scheduleNotes, 40);
  };

  private playSequencerStep(time: number, step: number) {
    if (!this.ctx || !this.musicGain || this.isMuted) return;

    // 1. Kick on 0, 8, 16, 24 (4-on-the-floor beat)
    if (step % 8 === 0) {
      this.triggerKick(time);
    }

    // 2. Hi-Hat on offbeats: 4, 12, 20, 28
    if (step % 8 === 4) {
      this.triggerHiHat(time);
    }

    // 3. Synthwave Bassline on 16th notes
    if (step % 2 === 0) {
      const noteIdx = Math.floor(step / 4) % this.bassNotes.length;
      let freq = this.bassNotes[noteIdx];
      if (this.tension > 0.5 && step % 4 === 2) {
        // Tension chromatic note
        freq *= 1.05946; // minor second clash
      }
      this.triggerBassNote(time, freq, sixteenthToSeconds(this.currentBpm) * 1.8);
    }

    // 4. Shimmering Arpeggio lead when in profit
    if (this.euphoria > 0.2 && step % 4 === 0) {
      const arpIdx = (step + Math.floor(this.step / 8)) % this.arpeggioNotes.length;
      this.triggerArpNote(time, this.arpeggioNotes[arpIdx]);
    }
  }

  private triggerKick(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  private triggerHiHat(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(9000, time);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.06);
  }

  private triggerBassNote(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    const cutoff = 400 + (this.tension * 800) + (this.euphoria * 600);
    filter.frequency.setValueAtTime(cutoff, time);
    filter.Q.setValueAtTime(3.5, time);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private triggerArpNote(time: number, freq: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.12 * this.euphoria, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.22);
  }

  // ---- Interactive Sound Effects ----

  public playVibrateCharge(progress: number) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const freq = 200 + Math.max(0, Math.min(1.0, progress)) * 600;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.05 + progress * 0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  public playOrderExecuted(side: string, lots: number) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Laser blip
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = side === 'BULL' ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(side === 'BULL' ? 520 : 380, now);
    osc.frequency.exponentialRampToValueAtTime(side === 'BULL' ? 880 : 180, now + 0.15);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playWin(pnl: number) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.2, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.45);
    });
  }

  public playLoss(pnl: number) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const chord = [220.0, 207.65, 196.0]; // descending chromatic gloom
    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.25, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.55);
    });
  }

  public playMarginWarning() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(440, now + 0.1);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }
}

function sixteenthToSeconds(bpm: number): number {
  return (60.0 / bpm) / 4;
}

export const soundEngine = new SoundtrackEngine();
