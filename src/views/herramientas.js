// Vista de Herramientas Esenciales: Afinador cromático con micrófono,
// metrónomo con tap tempo, entrenador de cambio de acordes (1 minuto), explorador del diapasón
// y Laboratorio de Guitarras y Amplificadores (Acústica, Española, Strat Clean, Crunch, Heavy Metal).
import { pluck, click, audio, strum, arpeggio, GUITAR_PRESETS, getGuitarPreset, setGuitarPreset } from '../audio/guitar.js';
import { OPEN_MIDI, STRING_NAMES_EN, STRING_NAMES, midiToFreq, freqToMidi, pc, NOTES_EN, NOTES_ES } from '../lib/music.js';
import { CHORDS, getChord } from '../data/chords.js';
import { addXp, setSelectedGuitar } from '../lib/state.js';

let micStream = null;
let audioCtx = null;
let analyser = null;
let tunerAnimId = null;

let metroInterval = null;

export function renderHerramientas(container) {
  // Limpieza al entrar
  if (tunerAnimId) cancelAnimationFrame(tunerAnimId);
  if (micStream) micStream.getTracks().forEach((t) => t.stop());
  if (metroInterval) clearInterval(metroInterval);

  let activeTab = 'afinador';

  container.innerHTML = `
    <div class="view-enter">
      <div class="page-head">
        <div>
          <span class="eyebrow"><span class="ico">⚙</span> Caja de herramientas</span>
          <h1>Herramientas del <span class="grad-text">guitarrista</span></h1>
          <p>Afinador con micrófono en tiempo real, metrónomo de precisión, entrenador de velocidad de cambios, mapa del diapasón y laboratorio de timbres de guitarra.</p>
        </div>
      </div>

      <!-- TABS DE HERRAMIENTAS -->
      <div class="card" style="padding: 12px 16px; margin-bottom: 24px;">
        <div class="seg" id="tool-tabs" style="flex-wrap: wrap;">
          <button class="active" data-tool="afinador">🎯 Afinador con micrófono</button>
          <button data-tool="metronomo">⏱ Metrónomo</button>
          <button data-tool="entrenador">⚡ Entrenador de cambios (1 min)</button>
          <button data-tool="diapason">🎸 Explorador del diapasón</button>
          <button data-tool="guitarras">🎛 Laboratorio de Guitarras</button>
        </div>
      </div>

      <!-- CONTENEDOR DINÁMICO DE HERRAMIENTA -->
      <div id="tool-content-root"></div>
    </div>
  `;

  const tabs = container.querySelectorAll('#tool-tabs button');
  const root = container.querySelector('#tool-content-root');

  function switchTab(tool) {
    tabs.forEach((b) => b.classList.toggle('active', b.dataset.tool === tool));
    activeTab = tool;

    // Limpiar procesos anteriores
    if (tunerAnimId) cancelAnimationFrame(tunerAnimId);
    if (micStream) micStream.getTracks().forEach((t) => t.stop());
    if (metroInterval) clearInterval(metroInterval);

    if (tool === 'afinador') renderTuner(root);
    else if (tool === 'metronomo') renderMetronome(root);
    else if (tool === 'entrenador') renderTrainer(root);
    else if (tool === 'diapason') renderFretboard(root);
    else if (tool === 'guitarras') renderGuitarLab(root);
  }

  tabs.forEach((b) => {
    b.addEventListener('click', () => switchTab(b.dataset.tool));
  });

  // Render inicial
  switchTab(activeTab);
}

// -------------------------------------------------------------
// 1. AFINADOR CROMÁTICO Y DE CUERDAS
// -------------------------------------------------------------
function renderTuner(root) {
  root.innerHTML = `
    <div class="card tuner">
      <div class="row between" style="width: 100%;">
        <h3>Afinador de guitarra estándar (E-A-D-G-B-E)</h3>
        <button class="btn primary sm" id="start-mic-btn">🎙 Activar micrófono</button>
      </div>

      <!-- PANTALLA PRINCIPAL DE NOTA -->
      <div class="tuner-note" id="tuner-note-disp">--</div>
      <div class="small muted" id="tuner-cents-disp">Toca una cuerda o selecciona un tono de referencia</div>

      <!-- MEDIDOR DE AFINACIÓN (GAUGE) -->
      <div class="tuner-gauge">
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--muted); margin-bottom: 6px;">
          <span>-50¢ (Grave)</span>
          <span style="color: var(--success); font-weight: 700;">Afinado</span>
          <span>+50¢ (Agudo)</span>
        </div>
        <div class="meter" style="background: rgba(255,255,255,0.06); height: 14px; position: relative; border-radius: 99px;">
          <div id="tuner-needle" style="position: absolute; left: 50%; top: -3px; bottom: -3px; width: 4px; background: var(--primary); border-radius: 4px; transform: translateX(-50%); transition: left 0.1s linear;"></div>
        </div>
      </div>

      <!-- BOTONES DE TONO DE REFERENCIA POR CUERDA -->
      <div style="margin-top: 18px; width: 100%;">
        <span class="small muted" style="display: block; text-align: center; margin-bottom: 12px;">
          O escucha los tonos de referencia para afinar de oído:
        </span>
        <div class="tuner-strings">
          ${OPEN_MIDI.map((midi, i) => `
            <button data-midi="${midi}" data-idx="${i}" class="ref-string-btn">
              <b>${STRING_NAMES_EN[i]}</b>
              <span>Cuerda ${6 - i}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  const noteDisp = root.querySelector('#tuner-note-disp');
  const centsDisp = root.querySelector('#tuner-cents-disp');
  const needle = root.querySelector('#tuner-needle');
  const startMicBtn = root.querySelector('#start-mic-btn');

  // Sonido de referencia al pulsar botones
  root.querySelectorAll('.ref-string-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const midi = parseInt(btn.dataset.midi, 10);
      pluck(midi, 0, { gain: 0.65 });
      const idx = parseInt(btn.dataset.idx, 10);
      noteDisp.textContent = `${STRING_NAMES_EN[idx]}`;
      centsDisp.textContent = `Tono de referencia: Cuerda ${6 - idx} (${STRING_NAMES[idx]} · ${midiToFreq(midi).toFixed(1)} Hz)`;
      needle.style.left = '50%';
      needle.style.background = 'var(--success)';
    });
  });

  // Detección por micrófono con Algoritmo de Autocorrelación
  startMicBtn?.addEventListener('click', async () => {
    try {
      startMicBtn.disabled = true;
      startMicBtn.textContent = '🎙 Escuchando guitarra...';

      audioCtx = audio();
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioCtx.createMediaStreamSource(micStream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const buf = new Float32Array(analyser.fftSize);

      function detectPitch() {
        analyser.getFloatTimeDomainData(buf);

        // Calcular volumen RMS
        let rms = 0;
        for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
        rms = Math.sqrt(rms / buf.length);

        if (rms > 0.02) {
          // Autocorrelación básica
          const freq = autoCorrelate(buf, audioCtx.sampleRate);
          if (freq > 60 && freq < 450) {
            const midiExact = freqToMidi(freq);
            const midiRound = Math.round(midiExact);
            const cents = Math.round((midiExact - midiRound) * 100);
            const nName = NOTES_EN[pc(midiRound)];

            noteDisp.textContent = nName;
            centsDisp.textContent = `${freq.toFixed(1)} Hz (${cents > 0 ? '+' : ''}${cents} cents)`;

            // Posicionar aguja (-50 a +50 cents mapeados a 0%..100%)
            const percent = Math.max(5, Math.min(95, 50 + cents));
            needle.style.left = `${percent}%`;

            if (Math.abs(cents) <= 5) {
              noteDisp.className = 'tuner-note in';
              needle.style.background = 'var(--success)';
            } else {
              noteDisp.className = 'tuner-note';
              needle.style.background = 'var(--primary)';
            }
          }
        }

        tunerAnimId = requestAnimationFrame(detectPitch);
      }

      detectPitch();
    } catch (err) {
      console.error(err);
      alert('No se pudo acceder al micrófono para el afinador.');
      startMicBtn.disabled = false;
      startMicBtn.textContent = '🎙 Activar micrófono';
    }
  });
}

function autoCorrelate(buf, sampleRate) {
  const SIZE = buf.length;
  let c = new Float32Array(SIZE);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c[i] = c[i] + buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;
  return sampleRate / T0;
}

// -------------------------------------------------------------
// 2. METRÓNOMO
// -------------------------------------------------------------
function renderMetronome(root) {
  let bpm = 100;
  let beatsPerBar = 4;
  let isRunning = false;
  let currentBeat = 0;
  let lastTap = 0;
  let tapDeltas = [];

  root.innerHTML = `
    <div class="card" style="padding: 34px 24px; text-align: center;">
      <div class="row between" style="margin-bottom: 20px;">
        <h3>Metrónomo de precisión</h3>
        <div class="seg" id="metro-meter-seg">
          <button class="active" data-beats="4">4/4</button>
          <button data-beats="3">3/4</button>
          <button data-beats="2">2/4</button>
          <button data-beats="6">6/8</button>
        </div>
      </div>

      <!-- NÚMERO BPM GIGANTE -->
      <div class="bpm-display">
        <span id="metro-bpm-text">${bpm}</span>
        <small>BPM</small>
      </div>

      <!-- BOLITAS INDICADORAS DE PULSO -->
      <div class="metro-beats" id="metro-dots-row">
        ${Array.from({ length: beatsPerBar }).map((_, i) => `
          <i class="${i === 0 ? 'accent' : ''}" data-b="${i}"></i>
        `).join('')}
      </div>

      <!-- SLIDER DE TEMPO -->
      <div style="max-width: 440px; margin: 0 auto 24px;">
        <input type="range" id="metro-bpm-slider" min="40" max="220" value="${bpm}" />
        <div class="row between muted small" style="margin-top: 8px;">
          <span>40 Largo</span>
          <span>100 Andante</span>
          <span>140 Allegro</span>
          <span>220 Presto</span>
        </div>
      </div>

      <!-- BOTONES DE ACCIÓN -->
      <div class="row" style="justify-content: center; gap: 14px;">
        <button class="btn ghost" id="bpm-minus-btn">-5</button>
        <button class="btn primary lg" id="metro-start-btn" style="min-width: 140px;">
          <span>▶ Iniciar</span>
        </button>
        <button class="btn ghost" id="bpm-plus-btn">+5</button>
        <button class="btn ghost" id="tap-tempo-btn">🖐 Tap Tempo</button>
      </div>
    </div>
  `;

  const bpmText = root.querySelector('#metro-bpm-text');
  const slider = root.querySelector('#metro-bpm-slider');
  const dotsRow = root.querySelector('#metro-dots-row');
  const startBtn = root.querySelector('#metro-start-btn');
  const tapBtn = root.querySelector('#tap-tempo-btn');

  function updateDots() {
    dotsRow.innerHTML = Array.from({ length: beatsPerBar }).map((_, i) => `
      <i class="${i === 0 ? 'accent' : ''} ${i === currentBeat && isRunning ? 'on' : ''}" data-b="${i}"></i>
    `).join('');
  }

  function setBpm(val) {
    bpm = Math.max(40, Math.min(240, val));
    bpmText.textContent = bpm;
    slider.value = bpm;
    if (isRunning) restart();
  }

  slider.addEventListener('input', (e) => setBpm(parseInt(e.target.value, 10)));
  root.querySelector('#bpm-minus-btn')?.addEventListener('click', () => setBpm(bpm - 5));
  root.querySelector('#bpm-plus-btn')?.addEventListener('click', () => setBpm(bpm + 5));

  // Tap tempo
  tapBtn?.addEventListener('click', () => {
    const nowMs = performance.now();
    if (lastTap > 0 && nowMs - lastTap < 2500) {
      tapDeltas.push(nowMs - lastTap);
      if (tapDeltas.length > 4) tapDeltas.shift();
      const avg = tapDeltas.reduce((a, b) => a + b) / tapDeltas.length;
      setBpm(Math.round(60000 / avg));
    } else {
      tapDeltas = [];
    }
    lastTap = nowMs;
  });

  // Selector de compás (4/4, 3/4, etc.)
  root.querySelectorAll('#metro-meter-seg button').forEach((btn) => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('#metro-meter-seg button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      beatsPerBar = parseInt(btn.dataset.beats, 10);
      currentBeat = 0;
      updateDots();
      if (isRunning) restart();
    });
  });

  function tick() {
    click(0, currentBeat === 0, 0.45);
    updateDots();
    currentBeat = (currentBeat + 1) % beatsPerBar;
  }

  function start() {
    isRunning = true;
    currentBeat = 0;
    startBtn.classList.replace('primary', 'danger');
    startBtn.innerHTML = '<span>⏸ Pausar</span>';
    tick();
    metroInterval = setInterval(tick, (60 / bpm) * 1000);
  }

  function stop() {
    isRunning = false;
    if (metroInterval) clearInterval(metroInterval);
    startBtn.classList.replace('danger', 'primary');
    startBtn.innerHTML = '<span>▶ Iniciar</span>';
    updateDots();
  }

  function restart() {
    if (metroInterval) clearInterval(metroInterval);
    metroInterval = setInterval(tick, (60 / bpm) * 1000);
  }

  startBtn?.addEventListener('click', () => {
    if (isRunning) stop();
    else start();
  });
}

// -------------------------------------------------------------
// 3. ENTRENADOR DE CAMBIOS DE ACORDES (1 MINUTO)
// -------------------------------------------------------------
function renderTrainer(root) {
  let chordA = 'C';
  let chordB = 'G';
  let timeLeft = 60;
  let count = 0;
  let timerId = null;
  let isRunning = false;
  let currentTarget = chordA;

  root.innerHTML = `
    <div class="card" style="padding: 30px; text-align: center;">
      <h3>⚡ El Minuto de Cambio (Agilidad Muscular)</h3>
      <p class="muted" style="max-width: 600px; margin: 8px auto 20px;">
        El ejercicio de agilidad número 1 del mundo: elige dos acordes y cuenta cuántos cambios limpios puedes hacer en 60 segundos.
      </p>

      <!-- SELECTORES DE ACORDES -->
      <div class="row" style="justify-content: center; gap: 16px; margin-bottom: 24px;">
        <div>
          <label class="small muted" style="display: block; margin-bottom: 4px;">Acorde A:</label>
          <select id="sel-chord-a">
            ${CHORDS.map((c) => `<option value="${c.id}" ${c.id === 'C' ? 'selected' : ''}>${c.symbol} (${c.name})</option>`).join('')}
          </select>
        </div>
        <div style="font-size: 1.5rem; color: var(--muted); align-self: flex-end; padding-bottom: 8px;">⇄</div>
        <div>
          <label class="small muted" style="display: block; margin-bottom: 4px;">Acorde B:</label>
          <select id="sel-chord-b">
            ${CHORDS.map((c) => `<option value="${c.id}" ${c.id === 'G' ? 'selected' : ''}>${c.symbol} (${c.name})</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- TIMER Y CONTADOR -->
      <div class="row between" style="max-width: 480px; margin: 0 auto 16px; background: var(--surface-2); padding: 18px 24px; border-radius: 16px;">
        <div>
          <div class="timer-big" id="trainer-timer">60s</div>
          <span class="small muted">Tiempo restante</span>
        </div>
        <div style="border-left: 1px solid var(--border); padding-left: 24px;">
          <div class="timer-big" id="trainer-count" style="color: var(--primary);">0</div>
          <span class="small muted">Cambios logrados</span>
        </div>
      </div>

      <!-- ACORDE OBJETIVO GIGANTE -->
      <div class="trainer-big">
        <div class="tb-chord on" id="trainer-chord-target">${chordA}</div>
      </div>

      <!-- BOTÓN REGISTRAR CAMBIO -->
      <div style="margin: 20px 0;">
        <button class="btn primary lg" id="trainer-step-btn" style="padding: 18px 36px; font-size: 1.2rem;" disabled>
          +1 ¡Cambio hecho! (Espacio o Clic)
        </button>
      </div>

      <!-- INICIAR / REINICIAR -->
      <div class="row" style="justify-content: center; gap: 12px;">
        <button class="btn ghost lg" id="trainer-start-btn">▶ Iniciar reto de 60s</button>
        <button class="btn ghost sm" id="trainer-reset-btn">↺ Reiniciar</button>
      </div>
    </div>
  `;

  const timerEl = root.querySelector('#trainer-timer');
  const countEl = root.querySelector('#trainer-count');
  const targetEl = root.querySelector('#trainer-chord-target');
  const stepBtn = root.querySelector('#trainer-step-btn');
  const startBtn = root.querySelector('#trainer-start-btn');
  const resetBtn = root.querySelector('#trainer-reset-btn');
  const selA = root.querySelector('#sel-chord-a');
  const selB = root.querySelector('#sel-chord-b');

  selA.addEventListener('change', (e) => { chordA = e.target.value; targetEl.textContent = chordA; });
  selB.addEventListener('change', (e) => { chordB = e.target.value; });

  function step() {
    if (!isRunning) return;
    count++;
    countEl.textContent = count;
    currentTarget = currentTarget === chordA ? chordB : chordA;
    targetEl.textContent = currentTarget;
    targetEl.classList.remove('on');
    void targetEl.offsetWidth;
    targetEl.classList.add('on');
    click(0, false, 0.25);
  }

  stepBtn?.addEventListener('click', step);

  startBtn?.addEventListener('click', () => {
    if (isRunning) return;
    isRunning = true;
    timeLeft = 60;
    count = 0;
    currentTarget = chordA;
    countEl.textContent = '0';
    targetEl.textContent = chordA;
    startBtn.disabled = true;
    stepBtn.disabled = false;
    stepBtn.focus();

    timerId = setInterval(() => {
      timeLeft--;
      timerEl.textContent = `${timeLeft}s`;
      if (timeLeft <= 0) {
        clearInterval(timerId);
        isRunning = false;
        stepBtn.disabled = true;
        startBtn.disabled = false;
        addXp(count * 2, 'Minuto de cambio de acordes');
        alert(`¡Tiempo terminado! Lograste ${count} cambios limpios. ¡Ganaste +${count * 2} XP!`);
      }
    }, 1000);
  });

  resetBtn?.addEventListener('click', () => {
    if (timerId) clearInterval(timerId);
    isRunning = false;
    timeLeft = 60;
    count = 0;
    timerEl.textContent = '60s';
    countEl.textContent = '0';
    startBtn.disabled = false;
    stepBtn.disabled = true;
    targetEl.textContent = chordA;
  });
}

// -------------------------------------------------------------
// 4. EXPLORADOR DEL DIAPASÓN
// -------------------------------------------------------------
function renderFretboard(root) {
  const numFrets = 15;

  root.innerHTML = `
    <div class="card" style="padding: 24px;">
      <div class="row between" style="margin-bottom: 16px;">
        <div>
          <h3>Explorador del Diapasón (15 trastes)</h3>
          <p class="small muted">Haz clic en cualquier traste para escuchar su nota exacta en guitarra real.</p>
        </div>
        <div class="row">
          <span class="chip primary sm">Mi-La-Re-Sol-Si-Mi</span>
        </div>
      </div>

      <!-- MAPA SVG DEL DIAPASÓN -->
      <div class="fretboard-wrap">
        <svg class="fretboard" viewBox="0 0 920 180" id="fb-svg">
          <!-- Dibujado dinámicamente -->
        </svg>
      </div>

      <div class="row between muted small" style="margin-top: 14px;">
        <span>Los puntos en trastes 3, 5, 7, 9, 12 indican posiciones de referencia tradicionales.</span>
        <span id="fb-note-info" style="font-weight: 700; color: var(--primary);">Toca una nota para inspeccionar</span>
      </div>
    </div>
  `;

  const svg = root.querySelector('#fb-svg');
  const info = root.querySelector('#fb-note-info');

  const padX = 30;
  const padY = 20;
  const fbW = 860;
  const fbH = 140;
  const fretW = fbW / numFrets;
  const strH = fbH / 5;

  let content = '';

  // Fondo madera
  content += `<rect x="${padX}" y="${padY}" width="${fbW}" height="${fbH}" fill="#161922" rx="10" stroke="rgba(255,255,255,0.1)" />`;

  // Trastes
  for (let f = 0; f <= numFrets; f++) {
    const fx = padX + f * fretW;
    const isNut = f === 0;
    content += `
      <line x1="${fx}" y1="${padY}" x2="${fx}" y2="${padY + fbH}" stroke="${isNut ? '#fff' : 'rgba(255,255,255,0.3)'}" stroke-width="${isNut ? 5 : 2}" />
      ${f > 0 ? `<text x="${fx - fretW / 2}" y="${padY + fbH + 16}" fill="rgba(255,255,255,0.5)" font-size="10" text-anchor="middle" font-weight="700">${f}</text>` : ''}
    `;
  }

  // Puntos marcadores
  [3, 5, 7, 9, 12].forEach((df) => {
    const dx = padX + (df - 0.5) * fretW;
    if (df === 12) {
      content += `<circle cx="${dx}" cy="${padY + fbH * 0.3}" r="4" fill="rgba(255,179,71,0.5)" />`;
      content += `<circle cx="${dx}" cy="${padY + fbH * 0.7}" r="4" fill="rgba(255,179,71,0.5)" />`;
    } else {
      content += `<circle cx="${dx}" cy="${padY + fbH * 0.5}" r="5" fill="rgba(255,255,255,0.2)" />`;
    }
  });

  // Cuerdas y notas pulsables
  for (let s = 0; s < 6; s++) {
    const sy = padY + s * strH;
    content += `<line x1="${padX}" y1="${sy}" x2="${padX + fbW}" y2="${sy}" stroke="#c0c7d4" stroke-width="${3.5 - s * 0.4}" />`;

    // Círculos clicables para cada traste
    for (let f = 0; f <= numFrets; f++) {
      const midi = OPEN_MIDI[s] + f;
      const nx = f === 0 ? padX - 14 : padX + (f - 0.5) * fretW;
      const noteEs = NOTES_ES[pc(midi)];
      const noteEn = NOTES_EN[pc(midi)];

      content += `
        <g class="fb-note" data-midi="${midi}" data-es="${noteEs}" data-en="${noteEn}" data-string="${6 - s}" data-fret="${f}">
          <circle cx="${nx}" cy="${sy}" r="${f === 0 ? 9 : 8}" fill="rgba(255,179,71,0.18)" stroke="rgba(255,179,71,0.4)" stroke-width="1.2" />
          <text x="${nx}" y="${sy + 3.2}" fill="#ffffff" font-size="8.5" text-anchor="middle" font-weight="700">${noteEs}</text>
        </g>
      `;
    }
  }

  svg.innerHTML = content;

  // Clic en notas del diapasón
  svg.querySelectorAll('.fb-note').forEach((nEl) => {
    nEl.addEventListener('click', () => {
      const midi = parseInt(nEl.dataset.midi, 10);
      pluck(midi, 0, { gain: 0.65 });
      info.textContent = `Nota: ${nEl.dataset.es} (${nEl.dataset.en}) · Cuerda ${nEl.dataset.string} · Traste ${nEl.dataset.fret}`;
    });
  });
}

// -------------------------------------------------------------
// 5. LABORATORIO DE GUITARRAS Y AMPLIFICADORES
// -------------------------------------------------------------
function renderGuitarLab(root) {
  let activeG = getGuitarPreset();

  function updateView() {
    root.innerHTML = `
      <div class="stack" style="gap: 24px;">
        <div class="card" style="padding: 24px;">
          <div class="row between" style="margin-bottom: 12px; flex-wrap: wrap;">
            <div>
              <h2 style="font-size: 1.5rem; display: flex; align-items: center; gap: 10px;">
                <span>${activeG.icon}</span> <span>${activeG.name}</span>
              </h2>
              <p class="muted small">${activeG.desc}</p>
            </div>
            <span class="chip primary lg" style="background: ${activeG.color}22; color: ${activeG.color}; border-color: ${activeG.color}55;">
              ${activeG.badge}
            </span>
          </div>

          <!-- SELECTOR DE GUITARRA -->
          <div class="guitar-grid" style="margin: 20px 0;">
            ${GUITAR_PRESETS.map((g) => {
              const isSel = g.id === activeG.id;
              return `
                <div class="guitar-card ${isSel ? 'selected' : ''}" data-lab-guitar="${g.id}">
                  <div class="row between" style="margin-bottom: 6px;">
                    <span class="g-badge" style="background: ${g.color}22; color: ${g.color}; border: 1px solid ${g.color}44;">
                      ${g.category}
                    </span>
                    <span class="g-radio">${isSel ? '✓ Activa' : 'Activar'}</span>
                  </div>
                  <div style="width: 100%; aspect-ratio: 16 / 10; border-radius: 10px; overflow: hidden; margin-bottom: 10px; background: #000; border: 1px solid var(--border);">
                    <img src="${g.image}" alt="${g.name}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;" />
                  </div>
                  <div class="row" style="gap: 8px; margin-bottom: 6px; align-items: baseline;">
                    <span style="font-size: 1.3rem;">${g.icon}</span>
                    <b style="font-size: 1.05rem;">${g.name}</b>
                  </div>
                  <p class="small muted" style="margin-bottom: 12px; line-height: 1.35; min-height: 36px;">${g.desc}</p>
                  <button class="btn sm ${isSel ? 'primary' : 'ghost'} w-full pick-lab-btn" data-lab-guitar="${g.id}">
                    ${isSel ? '✓ Guitarra Seleccionada' : 'Seleccionar esta guitarra'}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- BANCO DE PRUEBAS DE SONIDO -->
        <div class="grid grid-2" style="gap: 20px;">
          <!-- PRUEBA DE ACORDES -->
          <div class="card" style="padding: 22px;">
            <div class="row between" style="margin-bottom: 14px;">
              <h3>Banco de acordes de prueba</h3>
              <span class="small muted">Escucha el timbre y resonancia</span>
            </div>
            <p class="small muted" style="margin-bottom: 16px;">
              Haz clic en cualquier acorde para rasguearlo con <b>${activeG.name}</b>:
            </p>
            <div class="row" style="gap: 8px; flex-wrap: wrap;" id="lab-chord-buttons">
              ${['Em', 'G', 'C', 'D', 'Am', 'F#m', 'E5', 'A5', 'C#m'].map((cId) => `
                <button class="btn sm ghost lab-strum-chord" data-chord="${cId}" style="min-width: 60px; font-weight: 700;">
                  ${cId} ▶
                </button>
              `).join('')}
            </div>
          </div>

          <!-- CUERDAS SUELTAS AL AIRE -->
          <div class="card" style="padding: 22px;">
            <div class="row between" style="margin-bottom: 14px;">
              <h3>Pulsación de cuerdas al aire</h3>
              <span class="small muted">Afinación estándar (E-A-D-G-B-E)</span>
            </div>
            <p class="small muted" style="margin-bottom: 16px;">
              Toca cada cuerda para escuchar el ataque, armónicos y sustain:
            </p>
            <div class="row" style="gap: 8px; flex-wrap: wrap;">
              ${OPEN_MIDI.map((m, i) => `
                <button class="btn sm primary lab-pluck-string" data-midi="${m}" style="flex: 1; min-width: 48px; display: flex; flex-direction: column; padding: 10px 4px;">
                  <b>${6 - i}ª</b>
                  <span class="small" style="opacity: 0.8;">${STRING_NAMES_EN[i]}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Bindear selector de guitarra
    root.querySelectorAll('[data-lab-guitar]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.labGuitar;
        setGuitarPreset(id);
        setSelectedGuitar(id);
        activeG = getGuitarPreset();
        updateView();
        // Rasgueo de prueba inmediato
        const chord = id.includes('electric') ? (getChord('E5') || getChord('Em')) : (getChord('G') || getChord('Em'));
        strum(chord, { dir: 'D', gain: 0.65 });
      });
    });

    // Bindear acordes
    root.querySelectorAll('.lab-strum-chord').forEach((btn) => {
      btn.addEventListener('click', () => {
        const chord = getChord(btn.dataset.chord);
        if (chord) strum(chord, { dir: 'D', gain: 0.65 });
      });
    });

    // Bindear cuerdas
    root.querySelectorAll('.lab-pluck-string').forEach((btn) => {
      btn.addEventListener('click', () => {
        const midi = parseInt(btn.dataset.midi, 10);
        pluck(midi, 0, { gain: 0.7 });
      });
    });
  }

  updateView();
}
