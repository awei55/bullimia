// Bullimia Audio Synthesizer (Web Audio API)
// 100% procedural sound effects and dynamic synthwave BGM - zero external audio files needed!

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.chargeOsc = null;
        this.chargeGain = null;
        this.chargeFilter = null;
        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.step = 0;
        this.masterVolume = 0.6;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopBGM();
            this.stopCharge();
        }
        return this.muted;
    }

    // --- Sound Effects ---

    playBullFlip() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';

        // Ascending power arpeggio (Bull charging upward)
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);

        gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    playBearFlip() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';

        // Crushing downward dive (Bear smashing downward)
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(130, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.25);

        // Lowpass filter for heavy thud
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(250, now + 0.25);

        gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.28);
    }

    startCharge() {
        if (this.muted) return;
        this.init();
        if (this.chargeOsc) return;

        const now = this.ctx.currentTime;
        this.chargeOsc = this.ctx.createOscillator();
        this.chargeGain = this.ctx.createGain();
        this.chargeFilter = this.ctx.createBiquadFilter();

        this.chargeOsc.type = 'sawtooth';
        this.chargeOsc.frequency.setValueAtTime(90, now);

        this.chargeFilter.type = 'bandpass';
        this.chargeFilter.frequency.setValueAtTime(400, now);
        this.chargeFilter.Q.setValueAtTime(5, now);

        this.chargeGain.gain.setValueAtTime(0.01, now);
        this.chargeGain.gain.linearRampToValueAtTime(0.18 * this.masterVolume, now + 0.1);

        this.chargeOsc.connect(this.chargeFilter);
        this.chargeFilter.connect(this.chargeGain);
        this.chargeGain.connect(this.ctx.destination);

        this.chargeOsc.start(now);
    }

    updateCharge(progress = 0) {
        if (this.muted || !this.chargeOsc || !this.ctx) return;
        const p = Math.max(0, Math.min(1.0, isNaN(progress) ? 0 : Number(progress)));
        const now = this.ctx.currentTime;
        if (!isFinite(now)) return;

        // Frequency ramps safely from 90Hz to 450Hz
        const freq = Math.max(20, Math.min(2000, 90 + Math.pow(p, 1.5) * 360));
        if (isFinite(freq)) {
            this.chargeOsc.frequency.setTargetAtTime(freq, now, 0.05);
        }

        // Filter opens up as charge builds
        const filterFreq = Math.max(100, Math.min(8000, 400 + p * 2000));
        if (isFinite(filterFreq) && this.chargeFilter) {
            this.chargeFilter.frequency.setTargetAtTime(filterFreq, now, 0.05);
        }

        // Slight gain boost as lots increase
        const gainLevel = Math.max(0.001, Math.min(1.0, (0.15 + p * 0.15) * this.masterVolume));
        if (isFinite(gainLevel) && this.chargeGain) {
            this.chargeGain.gain.setTargetAtTime(gainLevel, now, 0.05);
        }
    }

    stopCharge() {
        if (!this.chargeOsc) return;
        try {
            const now = this.ctx.currentTime;
            this.chargeGain.gain.linearRampToValueAtTime(0.001, now + 0.05);
            this.chargeOsc.stop(now + 0.06);
        } catch (e) {}
        this.chargeOsc = null;
        this.chargeGain = null;
        this.chargeFilter = null;
    }

    playProfit(amount = 0) {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;

        // Metallic cash register chime (two distinct high bells)
        [1567.98, 2093.00, 3135.96].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + i * 0.06);

            gain.gain.setValueAtTime(0.22 * this.masterVolume, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.36);
        });
    }

    playLoss(amount = 0) {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;

        // Dissonant drop thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.3);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);

        gain.gain.setValueAtTime(0.35 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.36);
    }

    playMarginCall() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;

        // Emergency alternating siren klaxon
        for (let i = 0; i < 4; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            const f = (i % 2 === 0) ? 880 : 660;
            osc.frequency.setValueAtTime(f, now + i * 0.18);

            gain.gain.setValueAtTime(0.3 * this.masterVolume, now + i * 0.18);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.18);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + i * 0.18);
            osc.stop(now + (i + 1) * 0.18);
        }
    }

    playMillionaireFanfare() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;

        // Grand victory fanfare chords
        const notes = [
            { f: 523.25, t: 0.00, d: 0.15 }, // C5
            { f: 659.25, t: 0.15, d: 0.15 }, // E5
            { f: 783.99, t: 0.30, d: 0.15 }, // G5
            { f: 1046.50, t: 0.45, d: 0.50 }, // C6 (long)
            { f: 880.00, t: 0.95, d: 0.15 }, // A5
            { f: 1046.50, t: 1.10, d: 0.80 }  // C6 grand
        ];

        notes.forEach(n => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(n.f, now + n.t);

            gain.gain.setValueAtTime(0.28 * this.masterVolume, now + n.t);
            gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + n.t);
            osc.stop(now + n.t + n.d);
        });
    }

    // --- Dynamic Procedural Synthwave BGM ---
    startBGM() {
        if (this.bgmPlaying || this.muted) return;
        this.init();
        this.bgmPlaying = true;
        this.step = 0;
        const bpm = 124;
        const interval = (60 / bpm) / 4; // 16th notes

        // Cyberpunk bassline pattern (Am -> F -> C -> G)
        const bassNotes = [
            110, 110, 110, 110, 110, 110, 165, 110, // A
            87.31, 87.31, 87.31, 87.31, 87.31, 87.31, 130.81, 87.31, // F
            130.81, 130.81, 130.81, 130.81, 130.81, 130.81, 196.00, 130.81, // C
            98.00, 98.00, 98.00, 98.00, 98.00, 98.00, 146.83, 98.00 // G
        ];

        this.bgmTimer = setInterval(() => {
            if (!this.bgmPlaying || this.muted) return;
            const now = this.ctx.currentTime;
            const noteIdx = this.step % bassNotes.length;
            const freq = bassNotes[noteIdx];

            // 1. Synth Bass Note
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(500 + (this.step % 8) * 80, now);
            filter.Q.setValueAtTime(4, now);

            gain.gain.setValueAtTime(0.12 * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + interval * 1.8);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + interval * 1.9);

            // 2. Rhythm Drums (Kick on 1, 5, 9, 13; Snare on 5, 13; Hi-hat on every 2nd 16th)
            const beatStep = this.step % 16;
            if (beatStep === 0 || beatStep === 8) {
                // Kick
                const kickOsc = this.ctx.createOscillator();
                const kickGain = this.ctx.createGain();
                kickOsc.frequency.setValueAtTime(140, now);
                kickOsc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
                kickGain.gain.setValueAtTime(0.22 * this.masterVolume, now);
                kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                kickOsc.connect(kickGain);
                kickGain.connect(this.ctx.destination);
                kickOsc.start(now);
                kickOsc.stop(now + 0.15);
            }
            if (beatStep === 4 || beatStep === 12) {
                // Snare clap
                const snareNoise = this.ctx.createOscillator();
                const snareGain = this.ctx.createGain();
                snareNoise.type = 'triangle';
                snareNoise.frequency.setValueAtTime(240, now);
                snareGain.gain.setValueAtTime(0.14 * this.masterVolume, now);
                snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
                snareNoise.connect(snareGain);
                snareGain.connect(this.ctx.destination);
                snareNoise.start(now);
                snareNoise.stop(now + 0.14);
            }
            if (beatStep % 2 === 0) {
                // Crisp hi-hat tick
                const hatOsc = this.ctx.createOscillator();
                const hatGain = this.ctx.createGain();
                const hatFilter = this.ctx.createBiquadFilter();
                hatOsc.type = 'square';
                hatOsc.frequency.setValueAtTime(8000, now);
                hatFilter.type = 'highpass';
                hatFilter.frequency.setValueAtTime(6000, now);
                hatGain.gain.setValueAtTime(0.03 * this.masterVolume, now);
                hatGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
                hatOsc.connect(hatFilter);
                hatFilter.connect(hatGain);
                hatGain.connect(this.ctx.destination);
                hatOsc.start(now);
                hatOsc.stop(now + 0.045);
            }

            this.step++;
        }, interval * 1000);
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}

export const audio = new SoundEngine();

// Auto-unlock Web Audio on first user gesture
if (typeof window !== 'undefined') {
    const unlockAudio = () => {
        audio.init();
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
}
