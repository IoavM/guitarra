// Motor de audio: síntesis de guitarra (Karplus-Strong) con modelado físico de 5 guitarras,
// efectos de amplificador valvular (Overdrive / Crunch), emulación de pastillas single-coil,
// emulación de caja acústica / nylon, rasgueos, metrónomo y transporte.
import { midiToFreq, chordMidis } from '../lib/music.js';

let ctx = null;
let master = null;
let comp = null;

// Nodos del procesador de guitarra
let instrumentBus = null;
let bodyFilter = null;
let pickupFilter = null;
let preDriveGain = null;
let waveShaperNode = null;
let cabinetFilter = null;
let chorusDelayNode = null;
let chorusLfoNode = null;
let chorusGainNode = null;
let guitarOutGain = null;

const assetBase = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

export const GUITAR_PRESETS = [
  {
    id: 'acoustic-steel',
    name: 'Acústica Folk (Cuerdas de Acero)',
    shortName: 'Acústica Folk',
    category: 'acústica',
    image: `${assetBase}/img/guitars/acoustic-steel.jpg`,
    icon: '🎸',
    badge: 'Dreadnought Steel',
    color: '#ff9f43',
    desc: 'Brillante, percusiva y con gran resonancia. El sonido clásico de fogata, baladas y pop.',
    ksBright: 0.85,
    decayMult: 1.0,
    drive: 0,
    bodyFreq: 220,
    bodyQ: 1.0,
    bodyGain: 5,
    pickupFreq: 3400,
    pickupGain: 2,
    airCutoff: 6500,
    chorusDepth: 0,
    outGain: 1.0,
  },
  {
    id: 'classical-nylon',
    name: 'Española / Clásica (Cuerdas de Nylon)',
    shortName: 'Clásica Nylon',
    category: 'acústica',
    image: `${assetBase}/img/guitars/classical-nylon.jpg`,
    icon: '🪕',
    badge: 'Spanish Warm Nylon',
    color: '#e0a96d',
    desc: 'Tono dulce, amaderado y redondo. Ideal para arpegios, Juanes, flamenco y ritmos latinos.',
    ksBright: 0.38,
    decayMult: 0.88,
    drive: 0,
    bodyFreq: 180,
    bodyQ: 1.3,
    bodyGain: 7,
    pickupFreq: 1800,
    pickupGain: -3,
    airCutoff: 3900,
    chorusDepth: 0,
    outGain: 1.1,
  },
  {
    id: 'electric-clean',
    name: 'Eléctrica Strat Clean (Glass & Chorus)',
    shortName: 'Strat Clean',
    category: 'eléctrica',
    image: `${assetBase}/img/guitars/electric-clean.jpg`,
    icon: '⚡',
    badge: 'Single-Coil / Fender',
    color: '#00cfe8',
    desc: 'Campanadas cristalinas de pastillas single-coil con brillo de campana y chorus sutil.',
    ksBright: 0.76,
    decayMult: 1.4,
    drive: 0,
    bodyFreq: 450,
    bodyQ: 0.8,
    bodyGain: -4,
    pickupFreq: 2900,
    pickupGain: 6,
    airCutoff: 7800,
    chorusDepth: 0.002,
    outGain: 0.92,
  },
  {
    id: 'electric-crunch',
    name: 'Eléctrica Crunch / Overdrive (Tube Amp)',
    shortName: 'Rock Crunch',
    category: 'eléctrica',
    image: `${assetBase}/img/guitars/electric-crunch.jpg`,
    icon: '🔥',
    badge: 'Les Paul / Marshall',
    color: '#ff4d4f',
    desc: 'Saturación cálida de amplificador a válvulas. El rugido del rock clásico, blues y Jonas Brothers.',
    ksBright: 0.88,
    decayMult: 1.3,
    drive: 28,
    bodyFreq: 140,
    bodyQ: 1.2,
    bodyGain: 4,
    pickupFreq: 1400,
    pickupGain: 5,
    airCutoff: 4200, // Emulación de cono de altavoz Celestion 12"
    chorusDepth: 0,
    outGain: 0.62,
  },
  {
    id: 'electric-distortion',
    name: 'Eléctrica Heavy Distortion (High-Gain Lead)',
    shortName: 'Heavy Metal',
    category: 'eléctrica',
    image: `${assetBase}/img/guitars/electric-distortion.jpg`,
    icon: '🤘',
    badge: 'High-Gain 4x12',
    color: '#a855f7',
    desc: 'Distorsión pesada con compresión agresiva y gran sustain para Nirvana, punk rock y quintas.',
    ksBright: 0.96,
    decayMult: 1.55,
    drive: 75,
    bodyFreq: 110,
    bodyQ: 1.4,
    bodyGain: 6,
    pickupFreq: 3100,
    pickupGain: 7,
    airCutoff: 4500, // Pantalla 4x12
    chorusDepth: 0,
    outGain: 0.48,
  },
];

let activePresetId = 'acoustic-steel';
const guitarListeners = new Set();

function makeDistortionCurve(amount = 0) {
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  if (!amount || amount <= 0) {
    for (let i = 0; i < n_samples; ++i) curve[i] = (i * 2) / n_samples - 1;
    return curve;
  }
  const k = amount;
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    // Saturación analógica suave no lineal
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

export function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Compresor maestro final para evitar distorsión digital (clipping)
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;

    master = ctx.createGain();
    master.gain.value = 0.85;

    // Bus de entrada de instrumentos
    instrumentBus = ctx.createGain();
    instrumentBus.gain.value = 1.0;

    // Filtro 1: Resonancia de cuerpo (madera o cuerpo de guitarra)
    bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'peaking';
    bodyFilter.frequency.value = 220;
    bodyFilter.Q.value = 1.0;
    bodyFilter.gain.value = 5;

    // Filtro 2: Realce de pastilla / brillo de cuerdas
    pickupFilter = ctx.createBiquadFilter();
    pickupFilter.type = 'peaking';
    pickupFilter.frequency.value = 3400;
    pickupFilter.Q.value = 1.2;
    pickupFilter.gain.value = 2;

    // Etapa de distorsión / overdrive
    preDriveGain = ctx.createGain();
    preDriveGain.gain.value = 1.0;

    waveShaperNode = ctx.createWaveShaper();
    waveShaperNode.curve = makeDistortionCurve(0);
    waveShaperNode.oversample = '4x';

    // Filtro 3: Emulación de pantalla / altavoz (Speaker cabinet)
    cabinetFilter = ctx.createBiquadFilter();
    cabinetFilter.type = 'lowpass';
    cabinetFilter.frequency.value = 6500;
    cabinetFilter.Q.value = 0.7;

    // Chorus sutil estéreo para Stratocaster Clean
    chorusDelayNode = ctx.createDelay();
    chorusDelayNode.delayTime.value = 0.018;

    chorusGainNode = ctx.createGain();
    chorusGainNode.gain.value = 0; // Desactivado por defecto

    chorusLfoNode = ctx.createOscillator();
    chorusLfoNode.frequency.value = 0.8; // 0.8 Hz velocidad de chorus
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.002;
    chorusLfoNode.connect(lfoGain);
    lfoGain.connect(chorusDelayNode.delayTime);
    chorusLfoNode.start();

    // Ganancia de salida compensada por preset
    guitarOutGain = ctx.createGain();
    guitarOutGain.gain.value = 1.0;

    // CONEXIONES DEL GRAFO DE AUDIO:
    // instrumentBus -> bodyFilter -> pickupFilter -> preDriveGain -> waveShaper -> cabinetFilter
    instrumentBus.connect(bodyFilter);
    bodyFilter.connect(pickupFilter);
    pickupFilter.connect(preDriveGain);
    preDriveGain.connect(waveShaperNode);
    waveShaperNode.connect(cabinetFilter);

    // Camino seco
    cabinetFilter.connect(guitarOutGain);

    // Camino con chorus
    cabinetFilter.connect(chorusDelayNode);
    chorusDelayNode.connect(chorusGainNode);
    chorusGainNode.connect(guitarOutGain);

    // Salida hacia el Master y Compresor
    guitarOutGain.connect(master);
    master.connect(comp);
    comp.connect(ctx.destination);

    // Aplicar preset actual
    applyPresetToNodes(getGuitarPreset());
  }

  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

export const now = () => audio().currentTime;

function applyPresetToNodes(preset) {
  if (!bodyFilter) return;
  const t = ctx.currentTime;

  bodyFilter.frequency.setTargetAtTime(preset.bodyFreq, t, 0.05);
  bodyFilter.Q.setTargetAtTime(preset.bodyQ, t, 0.05);
  bodyFilter.gain.setTargetAtTime(preset.bodyGain, t, 0.05);

  pickupFilter.frequency.setTargetAtTime(preset.pickupFreq, t, 0.05);
  pickupFilter.gain.setTargetAtTime(preset.pickupGain, t, 0.05);

  cabinetFilter.frequency.setTargetAtTime(preset.airCutoff, t, 0.05);

  waveShaperNode.curve = makeDistortionCurve(preset.drive);
  preDriveGain.gain.setTargetAtTime(preset.drive > 0 ? 1.4 : 1.0, t, 0.05);

  // Activar o desactivar chorus
  chorusGainNode.gain.setTargetAtTime(preset.chorusDepth > 0 ? 0.35 : 0, t, 0.05);

  guitarOutGain.gain.setTargetAtTime(preset.outGain, t, 0.05);
}

export function getGuitarPreset() {
  return GUITAR_PRESETS.find((p) => p.id === activePresetId) || GUITAR_PRESETS[0];
}

export function setGuitarPreset(id) {
  const found = GUITAR_PRESETS.find((p) => p.id === id);
  if (!found) return;
  activePresetId = id;
  if (ctx) applyPresetToNodes(found);
  guitarListeners.forEach((cb) => {
    try { cb(found); } catch (e) { console.error(e); }
  });
}

export function onGuitarChange(cb) {
  guitarListeners.add(cb);
  return () => guitarListeners.delete(cb);
}

// Caché de buffers Karplus-Strong indexados por preset y nota
const cache = new Map();

function ksBuffer(midi, preset) {
  const key = `${preset.id}_${midi}`;
  if (cache.has(key)) return cache.get(key);
  const sr = ctx.sampleRate;
  const freq = midiToFreq(midi);
  const N = Math.max(2, Math.round(sr / freq - 0.5));

  // Duración y decaimiento según el tipo de guitarra
  const baseT60 = Math.max(1.2, 3.6 - freq / 260);
  const t60 = baseT60 * preset.decayMult;
  const dur = Math.min(4.5, t60 + 0.3);
  const len = Math.floor(sr * dur);
  const buf = ctx.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  const ring = new Float32Array(N);

  // Excitación: ruido filtrado ajustado por el brillo del instrumento
  const bright = Math.min(0.95, preset.ksBright * (0.4 + freq / 1400));
  let prev = 0;
  for (let i = 0; i < N; i++) {
    prev += bright * (Math.random() * 2 - 1 - prev);
    ring[i] = prev;
  }
  let mean = 0;
  for (let i = 0; i < N; i++) mean += ring[i];
  mean /= N;
  let peak = 0;
  for (let i = 0; i < N; i++) {
    ring[i] -= mean;
    peak = Math.max(peak, Math.abs(ring[i]));
  }
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
  const preset = getGuitarPreset();
  const t = when || ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = ksBuffer(midi, preset);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  if (stopAfter) {
    g.gain.setValueAtTime(gain, t + stopAfter);
    g.gain.exponentialRampToValueAtTime(0.0001, t + stopAfter + 0.08);
  }
  src.connect(g);
  g.connect(instrumentBus);
  src.start(t);
  if (stopAfter) src.stop(t + stopAfter + 0.1);
  return src;
}

function mutedHit(when, gain = 0.5) {
  audio();
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
  g.connect(instrumentBus);
  src.start(t);
}

/**
 * Rasguea un acorde con el timbre de la guitarra activa.
 * dir: 'D' abajo (6→1), 'U' arriba (1→6, cuerdas agudas), 'X' golpe apagado.
 */
export function strum(chord, { dir = 'D', when = 0, spread = 0.014, gain = 0.42, stopAfter = null, onString } = {}) {
  audio();
  const t0 = when || ctx.currentTime;
  if (dir === 'X') {
    mutedHit(t0, 0.6);
    return;
  }
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
  o.connect(ctx.destination);
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
    o.connect(ctx.destination);
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
