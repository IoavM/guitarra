// Motor de audio: síntesis de guitarra (Karplus-Strong), rasgueos, metrónomo y transporte.
import { midiToFreq, chordMidis } from '../lib/music.js';

let ctx = null;
let master = null;

export function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;
    const body = ctx.createBiquadFilter();
    body.type = 'peaking';
    body.frequency.value = 210;
    body.Q.value = 0.9;
    body.gain.value = 4;
    const air = ctx.createBiquadFilter();
    air.type = 'lowpass';
    air.frequency.value = 5600;
    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(body);
    body.connect(air);
    air.connect(comp);
    comp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export const now = () => audio().currentTime;

const cache = new Map();

function ksBuffer(midi) {
  const key = midi;
  if (cache.has(key)) return cache.get(key);
  const sr = ctx.sampleRate;
  const freq = midiToFreq(midi);
  const N = Math.max(2, Math.round(sr / freq - 0.5));
  const t60 = Math.max(1.2, 3.6 - freq / 260);
  const dur = Math.min(4, t60 + 0.3);
  const len = Math.floor(sr * dur);
  const buf = ctx.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  const ring = new Float32Array(N);
  // Excitación: ruido filtrado (más cálido en notas graves)
  const bright = Math.min(0.9, 0.35 + freq / 1400);
  let prev = 0;
  for (let i = 0; i < N; i++) {
    prev += bright * (Math.random() * 2 - 1 - prev);
    ring[i] = prev;
  }
  let mean = 0;
  for (let i = 0; i < N; i++) mean += ring[i];
  mean /= N;
  let peak = 0;
  for (let i = 0; i < N; i++) { ring[i] -= mean; peak = Math.max(peak, Math.abs(ring[i])); }
  for (let i = 0; i < N; i++) ring[i] /= peak || 1;

  const decay = Math.pow(0.001, 1 / (freq * t60));
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const cur = ring[idx];
    const nxt = ring[idx + 1 === N ? 0 : idx + 1];
    out[i] = cur;
    ring[idx] = (cur + nxt) * 0.5 * decay;
    idx = idx + 1 === N ? 0 : idx + 1;
  }
  const fade = Math.floor(sr * 0.08);
  for (let i = 0; i < fade; i++) out[len - 1 - i] *= i / fade;
  cache.set(key, buf);
  return buf;
}

/** Pulsa una nota (MIDI). Devuelve el nodo para poder detenerlo. */
export function pluck(midi, when = 0, { gain = 0.5, stopAfter = null } = {}) {
  audio();
  const t = when || ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = ksBuffer(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  if (stopAfter) {
    g.gain.setValueAtTime(gain, t + stopAfter);
    g.gain.exponentialRampToValueAtTime(0.0001, t + stopAfter + 0.08);
  }
  src.connect(g);
  g.connect(master);
  src.start(t);
  if (stopAfter) src.stop(t + stopAfter + 0.1);
  return src;
}

function mutedHit(when, gain = 0.5) {
  const t = when || ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * 0.06);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800;
  bp.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(bp);
  bp.connect(g);
  g.connect(master);
  src.start(t);
}

/**
 * Rasguea un acorde.
 * dir: 'D' abajo (6→1), 'U' arriba (1→6, cuerdas agudas), 'X' golpe apagado.
 */
export function strum(chord, { dir = 'D', when = 0, spread = 0.014, gain = 0.42, stopAfter = null, onString } = {}) {
  audio();
  const t0 = when || ctx.currentTime;
  if (dir === 'X') { mutedHit(t0, 0.6); return; }
  const midis = chordMidis(chord);
  let order = midis.map((m, i) => ({ m, i })).filter((x) => x.m !== null);
  if (dir === 'U') order = order.reverse().slice(0, 4);
  order.forEach((x, k) => {
    const t = t0 + k * spread;
    pluck(x.m, t, { gain: gain * (dir === 'U' ? 0.75 : 1), stopAfter });
    if (onString) {
      const delay = Math.max(0, (t - ctx.currentTime) * 1000);
      setTimeout(() => onString(x.i), delay);
    }
  });
}

/** Arpegio lento del acorde, cuerda por cuerda */
export function arpeggio(chord, { gap = 0.22, onString } = {}) {
  audio();
  const t0 = ctx.currentTime + 0.02;
  let k = 0;
  chordMidis(chord).forEach((m, i) => {
    if (m === null) return;
    const t = t0 + k * gap;
    pluck(m, t, { gain: 0.5 });
    if (onString) setTimeout(() => onString(i), (t - ctx.currentTime) * 1000);
    k++;
  });
}

export function click(when = 0, accent = false, gain = 0.35) {
  audio();
  const t = when || ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.value = accent ? 1760 : 1180;
  o.type = 'sine';
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(accent ? gain * 1.4 : gain, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.06);
}

/** Sonido de éxito / error para feedback */
export function chime(ok = true) {
  audio();
  const t = ctx.currentTime;
  const notes = ok ? [76, 83, 88] : [52, 49];
  notes.forEach((n, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = ok ? 'triangle' : 'sawtooth';
    o.frequency.value = midiToFreq(n);
    const s = t + i * 0.08;
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(ok ? 0.18 : 0.06, s + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, s + (ok ? 0.5 : 0.25));
    o.connect(g);
    g.connect(ctx.destination);
    o.start(s);
    o.stop(s + 0.6);
  });
}

/**
 * Transporte con planificación anticipada (lookahead) para tiempos precisos.
 * onTick(tick, time) se usa para programar audio; onVisual(tick) se llama sincronizado con el sonido.
 */
export class Transport {
  constructor({ bpm = 80, subdiv = 1, onTick = () => {}, onVisual = () => {} } = {}) {
    this.bpm = bpm;
    this.subdiv = subdiv;
    this.onTick = onTick;
    this.onVisual = onVisual;
    this.timer = null;
    this.gen = 0;
  }
  get running() { return !!this.timer; }
  start() {
    audio();
    this.stop();
    this.gen++;
    const gen = this.gen;
    this.tick = 0;
    this.next = ctx.currentTime + 0.12;
    const sched = () => {
      while (this.next < ctx.currentTime + 0.12) {
        const t = this.next;
        const k = this.tick;
        this.onTick(k, t);
        const delay = Math.max(0, (t - ctx.currentTime) * 1000);
        setTimeout(() => { if (gen === this.gen && this.timer) this.onVisual(k, t); }, delay);
        this.next += 60 / this.bpm / this.subdiv;
        this.tick++;
      }
    };
    sched();
    this.timer = setInterval(sched, 25);
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.gen++;
  }
}
