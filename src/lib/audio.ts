"use client";

import type { SceneId } from "@/data/types";

// Ambiances sonores synthétisées (Web Audio): aucun fichier, aucun son avant un clic volontaire.
// Chaque scène est un petit séquenceur. Pour de vraies musiques, remplacer `scenes` par des
// lecteurs <audio> en conservant l'API publique (enable / disable / setScene / cue).

type CueName = "scratch" | "pop" | "boom" | "whoosh";

interface SceneScore {
  bpm: number;
  stepsPerBeat: number;
  steps: number;
  play: (ctx: AudioContext, out: AudioNode, step: number, time: number, stepDur: number) => void;
}

const MASTER_LEVEL = 0.32;
const LOOKAHEAD_S = 0.14;
const TICK_MS = 30;

const midi = (note: number) => 440 * Math.pow(2, (note - 69) / 12);

function tone(
  ctx: AudioContext,
  out: AudioNode,
  { freq, time, dur, type = "sine", gain = 0.1, attack = 0.005, glideTo }: {
    freq: number; time: number; dur: number; type?: OscillatorType; gain?: number; attack?: number; glideTo?: number;
  },
) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, time + dur);
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(gain, time + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(amp).connect(out);
  osc.start(time);
  osc.stop(time + dur + 0.05);
}

function noise(ctx: AudioContext, out: AudioNode, time: number, dur: number, gain: number, highpass = 6000) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  src.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = highpass;
  amp.gain.setValueAtTime(gain, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  src.connect(filter).connect(amp).connect(out);
  src.start(time);
}

const PENTATONIC = [60, 62, 64, 67, 69, 72, 74, 76];

const scenes: Partial<Record<SceneId, SceneScore>> = {
  // Enfance: boîte à musique douce
  childhood: {
    bpm: 66, stepsPerBeat: 2, steps: 16,
    play(ctx, out, step, time, stepDur) {
      const pattern = [0, 2, 4, 2, 5, 4, 2, 1];
      if (step % 2 === 0) {
        const note = PENTATONIC[pattern[(step / 2) % pattern.length]];
        tone(ctx, out, { freq: midi(note + 12), time, dur: stepDur * 4, type: "triangle", gain: 0.07 });
        tone(ctx, out, { freq: midi(note), time, dur: stepDur * 5, type: "sine", gain: 0.05 });
      }
      if (step === 0) tone(ctx, out, { freq: midi(48), time, dur: stepDur * 14, type: "sine", gain: 0.05, attack: 0.4 });
    },
  },
  // Adolescence: electro à 120 BPM
  adolescence: {
    bpm: 120, stepsPerBeat: 4, steps: 16,
    play(ctx, out, step, time, stepDur) {
      if (step % 4 === 0) tone(ctx, out, { freq: 150, glideTo: 42, time, dur: 0.22, gain: 0.3 });
      if (step % 2 === 1) noise(ctx, out, time, 0.04, 0.05);
      const bass = [33, 33, 36, 40];
      if (step % 4 === 2) tone(ctx, out, { freq: midi(bass[(step >> 2) % 4]), time, dur: stepDur * 2.5, type: "sawtooth", gain: 0.07 });
      const lead = [69, 72, 76, 72, 69, 67, 64, 67];
      if (step % 2 === 0) tone(ctx, out, { freq: midi(lead[(step >> 1) % 8]), time, dur: stepDur * 1.6, type: "square", gain: 0.025 });
    },
  },
  // Bêtises: oom-pah de cirque + glissando de flûte
  mischief: {
    bpm: 132, stepsPerBeat: 2, steps: 16,
    play(ctx, out, step, time, stepDur) {
      const root = [48, 55, 53, 55];
      if (step % 4 === 0) tone(ctx, out, { freq: midi(root[(step >> 2) % 4]), time, dur: stepDur * 2.4, type: "triangle", gain: 0.2 });
      if (step % 4 === 2) {
        const chord = [60, 64, 67];
        chord.forEach((n) => tone(ctx, out, { freq: midi(n), time, dur: stepDur * 1.4, type: "square", gain: 0.03 }));
      }
      if (step === 14) tone(ctx, out, { freq: midi(72), glideTo: midi(96), time, dur: stepDur * 1.8, type: "sine", gain: 0.06 });
    },
  },
  // Finale: nappe chaude et cloches rares
  finale: {
    bpm: 48, stepsPerBeat: 1, steps: 8,
    play(ctx, out, step, time, stepDur) {
      if (step === 0) {
        [43, 50, 55].forEach((n) => tone(ctx, out, { freq: midi(n), time, dur: stepDur * 7, type: "sine", gain: 0.05, attack: 1.2 }));
      }
      if (step === 2 || step === 5) tone(ctx, out, { freq: midi(PENTATONIC[(step * 3) % 8] + 12), time, dur: stepDur * 3, type: "sine", gain: 0.05 });
    },
  },
};

class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  private scene: SceneId = "intro";
  private enabled = false;
  private step = 0;
  private nextTime = 0;

  isEnabled() { return this.enabled; }

  /** À appeler depuis un geste utilisateur (clic sur SOUND ON). */
  async enable() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      document.addEventListener("visibilitychange", () => {
        if (!this.ctx) return;
        if (document.hidden) void this.ctx.suspend();
        else if (this.enabled) void this.ctx.resume();
      });
    }
    await this.ctx.resume();
    this.enabled = true;
    this.master?.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master?.gain.linearRampToValueAtTime(MASTER_LEVEL, this.ctx.currentTime + 1.2);
    this.restart();
  }

  disable() {
    this.enabled = false;
    if (!this.ctx || !this.master) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
    this.stopTimer();
  }

  setScene(scene: SceneId) {
    if (scene === this.scene) return;
    this.scene = scene;
    if (this.enabled) this.restart();
  }

  /** Effets ponctuels, joués seulement si le son est activé. */
  cue(name: CueName) {
    if (!this.enabled || !this.ctx || !this.master) return;
    const ctx = this.ctx;
    const out = this.master;
    const t = ctx.currentTime;
    if (name === "scratch") {
      noise(ctx, out, t, 0.35, 0.25, 1200);
      tone(ctx, out, { freq: 900, glideTo: 120, time: t, dur: 0.3, type: "sawtooth", gain: 0.08 });
    } else if (name === "pop") {
      tone(ctx, out, { freq: 380, glideTo: 880, time: t, dur: 0.12, type: "sine", gain: 0.12 });
    } else if (name === "boom") {
      tone(ctx, out, { freq: 140, glideTo: 30, time: t, dur: 0.5, gain: 0.4 });
      noise(ctx, out, t, 0.25, 0.2, 400);
    } else {
      noise(ctx, out, t, 0.5, 0.12, 800);
    }
  }

  private restart() {
    this.stopTimer();
    const score = scenes[this.scene];
    if (!score || !this.ctx) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.timer = window.setInterval(() => this.schedule(score), TICK_MS);
  }

  private schedule(score: SceneScore) {
    if (!this.ctx || !this.master) return;
    const stepDur = 60 / score.bpm / score.stepsPerBeat;
    while (this.nextTime < this.ctx.currentTime + LOOKAHEAD_S) {
      score.play(this.ctx, this.master, this.step % score.steps, this.nextTime, stepDur);
      this.step += 1;
      this.nextTime += stepDur;
    }
  }

  private stopTimer() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }
}

export const audio = new AmbientEngine();
