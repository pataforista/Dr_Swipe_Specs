import { useEffect, useRef } from 'react';

/**
 * Procedural audio engine (Web Audio API).
 *
 * Dr. Swipe shipped referencing six .mp3 files under /sounds that never
 * existed in the repo, so the game was silent and Howler logged load errors.
 * Rather than depend on missing binary assets, the SFX are synthesized on the
 * fly to match the soft "scrapbook / paper" aesthetic. The public hook API
 * (playSwipe / playFeedback / playGacha / startTriageAlarm / stopTriageAlarm)
 * is unchanged, so no caller needs to change.
 */

type Dir = 'left' | 'right';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private supported = true;

  private getCtx(): AudioContext | null {
    if (!this.supported) return null;
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) { this.supported = false; return null; }
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.35; // keep it gentle
        this.master.connect(this.ctx.destination);
      }
      // Browsers start the context suspended until a user gesture; resume on use.
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      this.supported = false;
      return null;
    }
  }

  /** A pitched blip with an attack/decay envelope. */
  private tone(opts: {
    type?: OscillatorType;
    from: number;
    to?: number;
    dur: number;
    gain?: number;
    delay?: number;
    filter?: number;
  }) {
    const ctx = this.getCtx();
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(opts.from, t0);
    if (opts.to !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.to), t0 + opts.dur);
    const peak = opts.gain ?? 0.6;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    let node: AudioNode = osc;
    if (opts.filter) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = opts.filter;
      osc.connect(lp); node = lp;
    }
    node.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + opts.dur + 0.02);
  }

  /** A short filtered-noise burst — used for paper slides and the marker scratch. */
  private noise(opts: { dur: number; gain?: number; filter?: number; hp?: boolean }) {
    const ctx = this.getCtx();
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * opts.dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len); // decaying
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = opts.hp ? 'highpass' : 'lowpass';
    filt.frequency.value = opts.filter ?? 1200;
    const g = ctx.createGain();
    g.gain.value = opts.gain ?? 0.4;
    src.connect(filt); filt.connect(g); g.connect(this.master);
    src.start(t0);
    src.stop(t0 + opts.dur + 0.02);
  }

  swipe(direction: Dir) {
    // Soft paper slide; right (keep) sweeps up, left (discard) sweeps down.
    this.noise({ dur: 0.18, gain: 0.25, filter: direction === 'right' ? 2600 : 1500 });
    this.tone({ type: 'sine', from: direction === 'right' ? 340 : 280, to: direction === 'right' ? 460 : 200, dur: 0.16, gain: 0.18, filter: 1800 });
  }

  correct() {
    // Bright two-note "pop".
    this.tone({ type: 'sine', from: 660, to: 880, dur: 0.12, gain: 0.5 });
    this.tone({ type: 'sine', from: 990, dur: 0.16, gain: 0.4, delay: 0.09 });
  }

  wrong() {
    // Dry descending buzz (marker scratch).
    this.tone({ type: 'sawtooth', from: 240, to: 90, dur: 0.22, gain: 0.32, filter: 900 });
    this.noise({ dur: 0.12, gain: 0.18, filter: 800 });
  }

  gacha() {
    // Ascending magic arpeggio.
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      this.tone({ type: 'triangle', from: f, dur: 0.28, gain: 0.34, delay: i * 0.08 }));
  }

  /** One soft clock tick (used by the looping triage alarm). */
  tick() {
    this.tone({ type: 'square', from: 1400, to: 900, dur: 0.05, gain: 0.22, filter: 2500 });
  }
}

const engine = new AudioEngine();

export const useGameAudio = () => {
  const alarmRef = useRef<number | null>(null);

  const playSwipe = (direction: Dir) => engine.swipe(direction);
  const playFeedback = (type: 'correct' | 'wrong') => (type === 'correct' ? engine.correct() : engine.wrong());
  const playGacha = () => engine.gacha();

  const startTriageAlarm = () => {
    if (alarmRef.current !== null) return;
    engine.tick();
    alarmRef.current = window.setInterval(() => engine.tick(), 1000);
  };

  const stopTriageAlarm = () => {
    if (alarmRef.current !== null) {
      clearInterval(alarmRef.current);
      alarmRef.current = null;
    }
  };

  useEffect(() => () => stopTriageAlarm(), []);

  return { playSwipe, playFeedback, playGacha, startTriageAlarm, stopTriageAlarm };
};
