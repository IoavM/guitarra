// Reproductor interactivo de canciones con acompañamiento de audio sintético,
// visualizador de rasgueo sincronizado, compases activos y letra con acordes.
import { getSong } from '../data/songs.js';
import { getChord } from '../data/chords.js';
import { renderChordSvg, bindChordDiagram } from '../components/chordDiagram.js';
import { Transport, strum, click, GUITAR_PRESETS, getGuitarPreset, setGuitarPreset, onGuitarChange } from '../audio/guitar.js';
import { setSelectedGuitar } from '../lib/state.js';

let activeTransport = null;

export function renderSongPlayer(container, songId) {
  if (activeTransport) {
    activeTransport.stop();
    activeTransport = null;
  }

  const song = getSong(songId);
  if (!song) {
    container.innerHTML = `
      <div class="empty">
        <h2>Canción no encontrada</h2>
        <a href="#/canciones" class="btn primary" style="margin-top: 14px;">← Volver al repertorio</a>
      </div>
    `;
    return;
  }

  const usedChords = song.chords.map((c) => getChord(c)).filter(Boolean);
  let currentBpm = song.bpm;
  let currentBarIdx = 0;
  let playAudioChords = true;
  let playMetronome = true;
  let currentGuitar = getGuitarPreset();

  container.innerHTML = `
    <div class="view-enter">
      <!-- CABECERA -->
      <div style="margin-bottom: 22px;">
        <a href="#/canciones" class="btn sm ghost" style="margin-bottom: 12px;">← Volver a canciones</a>
        <div class="row between">
          <div>
            <div class="eyebrow"><span class="ico">♫</span> Modo Play-Along sincronizado</div>
            <h1 style="font-size: clamp(1.8rem, 3.2vw, 2.4rem); font-weight: 800;">${song.title}</h1>
            <p class="muted">${song.artist} · ${song.genre} ${song.capo ? `· Capo en Traste ${song.capo}` : ''}</p>
          </div>
          <div class="row">
            <a href="#/camara?chord=${song.chords[0]}" class="btn sm primary">
              ◉ Practicar acordes con IA
            </a>
          </div>
        </div>
      </div>

      <!-- SELECTOR DE TIMBRE DE GUITARRA -->
      <div class="card" style="padding: 12px 18px; margin-bottom: 22px; background: var(--surface-2);">
        <div class="row between" style="gap: 12px; flex-wrap: wrap;">
          <div class="row" style="gap: 8px;">
            <b class="small" style="text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted);">
              Timbre de guitarra:
            </b>
            <span class="chip primary sm" id="song-guitar-badge">${currentGuitar.badge}</span>
          </div>
          <div class="seg" id="song-guitar-pills">
            ${GUITAR_PRESETS.map((g) => `
              <button class="${g.id === currentGuitar.id ? 'active' : ''}" data-id="${g.id}" title="${g.desc}">
                <span>${g.icon}</span> <span>${g.shortName}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="song-layout">
        <div class="stack" style="gap: 24px;">
          <!-- VISUALIZADOR DE RASGUEO ANIMADO -->
          <div class="card" style="padding: 20px; text-align: center;">
            <div class="row between" style="margin-bottom: 14px;">
              <b class="small" style="text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted);">
                Patrón de rasgueo:
              </b>
              <span class="small muted">${song.strumDesc}</span>
            </div>

            <div class="strum-row" id="strum-visualizer">
              ${song.strumPattern.map((action, idx) => {
                const count = song.strumCounts[idx] || '';
                const isDown = action === 'D';
                const isUp = action === 'U';
                const isMute = action === 'X';
                const arrow = isDown ? '↓' : isUp ? '↑' : isMute ? '✕' : '·';
                const typeClass = action ? action : 'rest';

                return `
                  <div class="strum-slot ${typeClass}" data-step="${idx}">
                    <span class="arrow">${arrow}</span>
                    <span class="cnt">${count}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- COMPASES DE LA PROGRESIÓN -->
          <div class="card" style="padding: 22px;">
            <div class="row between" style="margin-bottom: 16px;">
              <h3>Progresión de compases</h3>
              <span class="small muted">Haz clic en cualquier compás para saltar a él</span>
            </div>

            <div class="bars" id="song-bars-grid">
              ${song.bars.map((bar, idx) => `
                <div class="bar ${idx === 0 ? 'current' : ''}" data-bar-idx="${idx}">
                  ${bar.section ? `<span class="section-label">${bar.section}</span>` : ''}
                  <div style="font-size: 1.6rem; color: var(--primary);">${bar.chord}</div>
                  <div class="beats">
                    ${Array.from({ length: bar.beats || 4 }).map((_, bIdx) => `
                      <i data-beat="${bIdx}" class="${idx === 0 && bIdx === 0 ? 'on' : ''}"></i>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- LETRA CON ACORDES -->
          <div class="card" style="padding: 26px;">
            <h3 style="margin-bottom: 18px;">Letra y acordes superpuestos</h3>
            <div class="lyrics">
              ${song.lyrics.map((line) => {
                if (line.section) {
                  return `<div class="lyric-section">${line.section}</div>`;
                }
                return `
                  <div class="lyric-line">
                    ${line.parts.map((p) => `
                      <span class="lyric-seg">
                        <span class="ch" data-chord="${p.ch}">${p.ch}</span>
                        <span class="tx">${p.tx}</span>
                      </span>
                    `).join('')}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- SIDEBAR DE ACORDES DE LA CANCIÓN -->
        <aside class="stack sticky" style="gap: 16px;">
          <div class="card">
            <h3 style="margin-bottom: 12px;">Acordes necesarios</h3>
            <p class="small muted" style="margin-bottom: 14px;">Púlsalos o rasguéalos para memorizarlos:</p>
            <div class="stack" style="gap: 14px;">
              ${usedChords.map((chord) => `
                <div class="card chord-card" data-chord-id="${chord.id}" style="padding: 12px; background: var(--surface-2);">
                  <div class="row between" style="width: 100%;">
                    <b style="font-size: 1.25rem;">${chord.symbol}</b>
                    <span class="small muted">${chord.name}</span>
                  </div>
                  <div style="width: 100%; display: flex; justify-content: center; margin: 6px 0;">
                    ${renderChordSvg(chord, { width: 125 })}
                  </div>
                  <div class="row" style="width: 100%; justify-content: center; gap: 6px;">
                    <button class="btn sm strum-song-chord-btn" data-id="${chord.id}">▶ Rasguear</button>
                    <a href="#/camara?chord=${chord.id}" class="btn sm primary">◉ IA</a>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </aside>
      </div>

      <!-- BARRA DE REPRODUCCIÓN FLOTANTE (TRANSPORT) -->
      <div class="card glass player-bar">
        <button class="btn primary lg" id="play-pause-btn" style="min-width: 130px;">
          <span>▶ Reproducir</span>
        </button>

        <button class="btn sm ghost" id="reset-song-btn">↺ Reiniciar</button>

        <!-- TEMPO / BPM -->
        <div class="row" style="margin-left: 12px; gap: 10px;">
          <span class="small muted">Tempo:</span>
          <b class="mono" id="bpm-val" style="font-size: 1.1rem; width: 68px;">${currentBpm} BPM</b>
          <input
            type="range"
            id="bpm-range"
            min="40"
            max="180"
            value="${currentBpm}"
            style="width: 140px;"
          />
          <button class="btn sm ghost" id="tempo-slow-btn">50% Lento</button>
          <button class="btn sm ghost" id="tempo-normal-btn">100%</button>
        </div>

        <!-- TOGGLES DE SONIDO -->
        <div class="row" style="margin-left: auto; gap: 14px;">
          <label class="toggle">
            <input type="checkbox" id="toggle-audio-chords" checked />
            <span class="sw"></span>
            <span class="small">Guitarra guía</span>
          </label>
          <label class="toggle">
            <input type="checkbox" id="toggle-metronome" checked />
            <span class="sw"></span>
            <span class="small">Metrónomo</span>
          </label>
        </div>
      </div>
    </div>
  `;

  // Bindear acordes de la barra lateral
  usedChords.forEach((chord) => {
    const card = container.querySelector(`.chord-card[data-chord-id="${chord.id}"]`);
    if (card) {
      bindChordDiagram(card, chord);
      card.querySelector('.strum-song-chord-btn')?.addEventListener('click', () => {
        strum(chord, { dir: 'D', gain: 0.6 });
      });
    }
  });

  // Bindear clics en acordes dentro de la letra
  container.querySelectorAll('.lyric-seg .ch').forEach((chEl) => {
    chEl.addEventListener('click', () => {
      const sym = chEl.dataset.chord;
      const c = getChord(sym);
      if (c) strum(c, { dir: 'D', gain: 0.6 });
    });
  });

  // Manejo del selector de timbres de guitarra
  const guitarPills = container.querySelectorAll('#song-guitar-pills button');
  const guitarBadge = container.querySelector('#song-guitar-badge');

  guitarPills.forEach((btn) => {
    btn.addEventListener('click', () => {
      guitarPills.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const gId = btn.dataset.id;
      setGuitarPreset(gId);
      setSelectedGuitar(gId);
      const activeG = getGuitarPreset();
      if (guitarBadge) guitarBadge.textContent = activeG.badge;
      // Rasgueo de prueba rápido con el acorde inicial de la canción
      const testChord = usedChords[0] || getChord('Em');
      strum(testChord, { dir: 'D', gain: 0.65 });
    });
  });

  const playBtn = container.querySelector('#play-pause-btn');
  const resetBtn = container.querySelector('#reset-song-btn');
  const bpmRange = container.querySelector('#bpm-range');
  const bpmVal = container.querySelector('#bpm-val');
  const tempoSlow = container.querySelector('#tempo-slow-btn');
  const tempoNorm = container.querySelector('#tempo-normal-btn');
  const toggleChords = container.querySelector('#toggle-audio-chords');
  const toggleMetro = container.querySelector('#toggle-metronome');

  const strumSlots = container.querySelectorAll('.strum-slot');
  const barEls = container.querySelectorAll('.bar');

  // Configuración del motor de transporte de audio:
  // Subdivisión: 2 ticks por tiempo (corcheas en 4/4 = 8 ticks por compás)
  let tickInBar = 0;
  let barIndex = 0;

  activeTransport = new Transport({
    bpm: currentBpm,
    subdiv: 2, // Corcheas (8 pasos por compás de 4 tiempos)
    onTick: (tick, audioTime) => {
      const currentBar = song.bars[barIndex];
      const beatsInBar = currentBar?.beats || 4;
      const ticksInBar = beatsInBar * 2;

      const strumStep = tickInBar % song.strumPattern.length;
      const strumAction = song.strumPattern[strumStep];
      const isBeatStart = tickInBar % 2 === 0;

      // Sonido de metrónomo en cada tiempo
      if (isBeatStart && playMetronome) {
        click(audioTime, tickInBar === 0, 0.35);
      }

      // Rasgueo de guitarra
      if (strumAction && playAudioChords) {
        const chordObj = getChord(currentBar.chord);
        if (chordObj) {
          strum(chordObj, { dir: strumAction, when: audioTime, gain: 0.5 });
        }
      }
    },
    onVisual: (tick) => {
      const currentBar = song.bars[barIndex];
      const beatsInBar = currentBar?.beats || 4;
      const ticksInBar = beatsInBar * 2;

      // Actualizar visualizador de rasgueo
      const strumStep = tickInBar % song.strumPattern.length;
      strumSlots.forEach((slot, i) => {
        if (i === strumStep) slot.classList.add('now');
        else slot.classList.remove('now');
      });

      // Actualizar compás y tiempos activos
      barEls.forEach((b, i) => {
        if (i === barIndex) {
          b.classList.add('current');
          const beatDots = b.querySelectorAll('.beats i');
          const curBeat = Math.floor(tickInBar / 2);
          beatDots.forEach((dot, dIdx) => {
            if (dIdx === curBeat) dot.classList.add('on');
            else dot.classList.remove('on');
          });
        } else {
          b.classList.remove('current');
        }
      });

      // Avanzar tick
      tickInBar++;
      if (tickInBar >= ticksInBar) {
        tickInBar = 0;
        barIndex = (barIndex + 1) % song.bars.length;
      }
    },
  });

  function updatePlayState() {
    if (activeTransport.running) {
      playBtn.classList.replace('primary', 'danger');
      playBtn.innerHTML = '<span>⏸ Pausar</span>';
    } else {
      playBtn.classList.replace('danger', 'primary');
      playBtn.innerHTML = '<span>▶ Reproducir</span>';
      strumSlots.forEach((s) => s.classList.remove('now'));
    }
  }

  playBtn?.addEventListener('click', () => {
    if (activeTransport.running) {
      activeTransport.stop();
    } else {
      activeTransport.start();
    }
    updatePlayState();
  });

  resetBtn?.addEventListener('click', () => {
    activeTransport.stop();
    tickInBar = 0;
    barIndex = 0;
    updatePlayState();
    barEls.forEach((b, i) => {
      b.classList.toggle('current', i === 0);
      b.querySelectorAll('.beats i').forEach((d, dIdx) => d.classList.toggle('on', dIdx === 0));
    });
  });

  // Salto al hacer clic en un compás
  barEls.forEach((b) => {
    b.addEventListener('click', () => {
      barIndex = parseInt(b.dataset.barIdx, 10);
      tickInBar = 0;
      barEls.forEach((el, i) => el.classList.toggle('current', i === barIndex));
    });
  });

  // Controles de tempo
  const setBpm = (val) => {
    currentBpm = Math.max(40, Math.min(180, val));
    bpmVal.textContent = `${currentBpm} BPM`;
    bpmRange.value = currentBpm;
    activeTransport.bpm = currentBpm;
    if (activeTransport.running) {
      activeTransport.stop();
      activeTransport.start();
    }
  };

  bpmRange?.addEventListener('input', (e) => setBpm(parseInt(e.target.value, 10)));
  tempoSlow?.addEventListener('click', () => setBpm(Math.round(song.bpm * 0.6)));
  tempoNorm?.addEventListener('click', () => setBpm(song.bpm));

  toggleChords?.addEventListener('change', (e) => (playAudioChords = e.target.checked));
  toggleMetro?.addEventListener('change', (e) => (playMetronome = e.target.checked));
}
