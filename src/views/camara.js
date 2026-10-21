// Vista de la Cámara IA: Detección de dedos en tiempo real para acordes de guitarra.
import { GuitarCameraController } from '../lib/cameraDetector.js';
import { CHORDS, getChord } from '../data/chords.js';
import { renderChordSvg, bindChordDiagram } from '../components/chordDiagram.js';
import { getState, isChordMastered } from '../lib/state.js';
import { strum } from '../audio/guitar.js';

let activeController = null;

export function renderCamara(container, queryParams = {}) {
  // Limpiar cualquier sesión anterior
  if (activeController) {
    activeController.stop();
    activeController = null;
  }

  const initialChordId = queryParams.chord || 'Em';
  let currentChord = getChord(initialChordId) || CHORDS[0];

  container.innerHTML = `
    <div class="view-enter">
      <!-- CABECERA -->
      <div class="page-head">
        <div>
          <span class="eyebrow"><span class="ico">◉</span> Visión por Computadora con MediaPipe</span>
          <h1>Cámara IA: <span class="grad-text">Revisor de dedos en vivo</span></h1>
          <p>
            Muestra tu mano frente a la cámara web. La IA rastrea las articulaciones y yemas de tus dedos,
            comparándolas con el diapasón para decirte en tiempo real si estás pisando el traste y cuerda correctos.
          </p>
        </div>
        <div class="row">
          <button class="btn primary lg" id="start-cam-btn">
            <span>📷 Iniciar Cámara Web</span>
          </button>
          <button class="btn ghost lg" id="start-sim-btn" title="Prueba el detector sin necesidad de cámara">
            <span>🧪 Modo Simulación</span>
          </button>
        </div>
      </div>

      <!-- SELECTOR DE ACORDES A PRACTICAR -->
      <div class="card" style="padding: 16px 20px; margin-bottom: 22px;">
        <div class="row between" style="margin-bottom: 10px;">
          <b class="small" style="text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted);">
            Elige el acorde a comprobar:
          </b>
          <span class="small muted">Verde = Ya validado con tu cámara</span>
        </div>
        <div class="chord-picker" id="cam-chord-picker">
          ${CHORDS.map((c) => {
            const mastered = isChordMastered(c.id);
            const active = c.id === currentChord.id;
            return `
              <button class="${active ? 'active' : ''} ${mastered ? 'mastered' : ''}" data-id="${c.id}">
                ${c.symbol} ${mastered ? '✓' : ''}
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- LAYOUT PRINCIPAL -->
      <div class="cam-layout">
        <!-- ÁREA DEL VIDEO / CANVAS -->
        <div class="stack">
          <div class="cam-stage" id="cam-stage">
            <video id="cam-video" playsinline muted></video>
            <canvas id="cam-canvas"></canvas>

            <!-- MENSAJE DE ESPERA / PLACEHOLDER -->
            <div class="cam-placeholder" id="cam-placeholder">
              <div class="cp-ico">🎸</div>
              <h3>Cámara en espera</h3>
              <p class="muted" style="margin-top: 6px; font-size: 0.95rem;">
                Haz clic en <b>"Iniciar Cámara Web"</b> para comenzar, o prueba el <b>"Modo Simulación"</b> para ver cómo funciona el algoritmo de análisis.
              </p>
            </div>

            <!-- OVERLAY DE RETROALIMENTACIÓN DINÁMICA -->
            <div class="cam-overlay-msg hidden" id="cam-msg">
              Coloca tus dedos en la posición del acorde
            </div>

            <!-- BURST DE ÉXITO -->
            <div class="cam-success hidden" id="cam-success">
              <div class="burst">¡ACORDE CORRECTO! 🎉</div>
            </div>

            <!-- HUD SUPERIOR / INFERIOR -->
            <div class="cam-hud" id="cam-hud" style="left: 14px; right: auto;">
              <span class="chip" id="hud-chord-name">Acorde: <b>${currentChord.symbol}</b></span>
              <span class="chip" id="hud-status">Estado: En espera</span>
            </div>
          </div>

          <!-- CONTROLES RÁPIDOS BAJO EL VIDEO -->
          <div class="card row between" style="padding: 12px 18px;">
            <div class="row">
              <button class="btn sm ghost" id="stop-cam-btn" disabled>⏹ Detener cámara</button>
              <button class="btn sm ghost" id="play-chord-audio-btn">▶ Escuchar acorde</button>
            </div>
            <div class="row">
              <label class="toggle">
                <input type="checkbox" id="toggle-virtual-fretboard" checked />
                <span class="sw"></span>
                <span class="small">Mostrar mástil guía</span>
              </label>
            </div>
          </div>
        </div>

        <!-- PANEL LATERAL: DIAGNÓSTICO EN TIEMPO REAL Y DIAGRAMA -->
        <aside class="stack" style="gap: 18px;">
          <!-- CARD DE PRECISIÓN Y SCORE -->
          <div class="card" style="padding: 22px;">
            <div class="row between" style="margin-bottom: 16px;">
              <h3>Precisión del acorde</h3>
              <span class="chip primary" id="accuracy-chip">0%</span>
            </div>

            <!-- BARRA DE PRECISIÓN -->
            <div class="meter" style="margin-bottom: 18px;">
              <span id="accuracy-meter-bar" style="width: 0%;"></span>
            </div>

            <!-- CHECKLIST DE DEDOS -->
            <div class="finger-feedback" id="finger-feedback-list">
              <p class="small muted">Inicia la cámara para ver el diagnóstico dedo por dedo.</p>
            </div>
          </div>

          <!-- DIAGRAMA GUÍA DEL ACORDE SELECCIONADO -->
          <div class="card" id="cam-ref-chord-card" style="padding: 20px; text-align: center;">
            <div class="row between" style="margin-bottom: 12px;">
              <b style="font-size: 1.25rem;">${currentChord.symbol} (${currentChord.name})</b>
              <span class="chip sm">Nivel ${currentChord.level}</span>
            </div>
            <div id="cam-diag-container" style="display: flex; justify-content: center; margin: 8px 0;">
              ${renderChordSvg(currentChord, { width: 150 })}
            </div>
            <p class="small muted" style="margin-top: 10px; line-height: 1.4;">
              💡 <b>Tip:</b> ${currentChord.tip}
            </p>
          </div>

          <!-- CALIBRACIÓN RÁPIDA -->
          <div class="card" style="padding: 18px; background: var(--surface-2);">
            <h4 style="margin-bottom: 8px;">⚙ Calibración de distancia</h4>
            <p class="small muted" style="margin-bottom: 12px;">
              Si tus dedos quedan muy lejos del mástil virtual, ajusta la escala del marco:
            </p>
            <div class="row" style="gap: 8px;">
              <button class="btn sm ghost" id="calib-closer-btn">🔍 Acercar marco</button>
              <button class="btn sm ghost" id="calib-farther-btn">🔎 Alejar marco</button>
              <button class="btn sm ghost" id="calib-reset-btn">↺ Reset</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `;

  const videoEl = container.querySelector('#cam-video');
  const canvasEl = container.querySelector('#cam-canvas');
  const placeholder = container.querySelector('#cam-placeholder');
  const msgOverlay = container.querySelector('#cam-msg');
  const successOverlay = container.querySelector('#cam-success');
  const startCamBtn = container.querySelector('#start-cam-btn');
  const startSimBtn = container.querySelector('#start-sim-btn');
  const stopCamBtn = container.querySelector('#stop-cam-btn');
  const accuracyChip = container.querySelector('#accuracy-chip');
  const accuracyBar = container.querySelector('#accuracy-meter-bar');
  const feedbackList = container.querySelector('#finger-feedback-list');
  const hudStatus = container.querySelector('#hud-status');
  const hudChord = container.querySelector('#hud-chord-name');
  const playChordBtn = container.querySelector('#play-chord-audio-btn');
  const diagContainer = container.querySelector('#cam-diag-container');

  // Inicializar controlador
  activeController = new GuitarCameraController({
    videoEl,
    canvasEl,
    onEvaluation: (res) => {
      // Actualizar score en tiempo real
      accuracyChip.textContent = `${res.score}%`;
      accuracyBar.style.width = `${res.score}%`;

      if (res.score >= 75) {
        accuracyChip.className = 'chip success';
        hudStatus.innerHTML = 'Estado: <b style="color: var(--success);">¡Mantén la posición!</b>';
      } else if (res.detectedHand) {
        accuracyChip.className = 'chip warning';
        hudStatus.innerHTML = 'Estado: <b style="color: var(--warning);">Ajustando dedos</b>';
      } else {
        accuracyChip.className = 'chip ghost';
        hudStatus.innerHTML = 'Estado: <span>Mano no detectada</span>';
      }

      // Actualizar lista de feedback dedo a dedo
      if (res.details && res.details.length > 0) {
        feedbackList.innerHTML = res.details.map((d) => `
          <div class="ff-item ${d.status}">
            <div class="ff-dot">D${d.finger}</div>
            <div class="ff-txt">
              <b>${d.name}</b>
              <span class="muted">${d.text}</span>
            </div>
          </div>
        `).join('');
      }
    },
    onSuccess: (chord, evalRes) => {
      // Mostrar animación de celebración
      successOverlay.classList.remove('hidden');
      msgOverlay.classList.remove('hidden');
      msgOverlay.innerHTML = `<span style="color: var(--success);">¡Excelente! Has dominado el acorde de ${chord.symbol} (+30 XP)</span>`;

      // Marcar botón en el picker
      const btn = container.querySelector(`.chord-picker button[data-id="${chord.id}"]`);
      if (btn) btn.classList.add('mastered');

      setTimeout(() => {
        successOverlay.classList.add('hidden');
        msgOverlay.classList.add('hidden');
      }, 2500);
    },
  });

  activeController.setChord(currentChord);

  // Bindear diagrama de referencia lateral
  bindChordDiagram(container.querySelector('#cam-ref-chord-card'), currentChord);

  // Iniciar cámara real
  startCamBtn?.addEventListener('click', async () => {
    try {
      startCamBtn.disabled = true;
      startCamBtn.innerHTML = '<span>⏳ Conectando cámara...</span>';
      await activeController.startCamera();
      placeholder.classList.add('hidden');
      stopCamBtn.disabled = false;
      startCamBtn.innerHTML = '<span>✓ Cámara activa</span>';
      hudStatus.textContent = 'Estado: Analizando mano';
    } catch (err) {
      console.error(err);
      alert('No se pudo acceder a la cámara web. Puedes probar el "Modo Simulación" para ver la detección en acción.');
      startCamBtn.disabled = false;
      startCamBtn.innerHTML = '<span>📷 Iniciar Cámara Web</span>';
    }
  });

  // Iniciar modo simulación
  startSimBtn?.addEventListener('click', () => {
    placeholder.classList.add('hidden');
    stopCamBtn.disabled = false;
    startCamBtn.disabled = true;
    startSimBtn.classList.replace('ghost', 'primary');
    activeController.startSimulation();
    hudStatus.textContent = 'Estado: Simulación interactiva';
  });

  // Detener cámara
  stopCamBtn?.addEventListener('click', () => {
    activeController.stop();
    placeholder.classList.remove('hidden');
    stopCamBtn.disabled = true;
    startCamBtn.disabled = false;
    startCamBtn.innerHTML = '<span>📷 Iniciar Cámara Web</span>';
    startSimBtn.classList.replace('primary', 'ghost');
    hudStatus.textContent = 'Estado: Detenido';
  });

  // Escuchar acorde actual
  playChordBtn?.addEventListener('click', () => {
    strum(currentChord, { gain: 0.6 });
  });

  // Selector de acordes a practicar
  container.querySelectorAll('#cam-chord-picker button').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#cam-chord-picker button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const chordId = btn.dataset.id;
      currentChord = getChord(chordId);
      activeController.setChord(currentChord);

      hudChord.innerHTML = `Acorde: <b>${currentChord.symbol}</b>`;

      // Actualizar tarjeta de referencia lateral
      diagContainer.innerHTML = renderChordSvg(currentChord, { width: 150 });
      bindChordDiagram(container.querySelector('#cam-ref-chord-card'), currentChord);
    });
  });

  // Calibración del diapasón virtual
  container.querySelector('#calib-closer-btn')?.addEventListener('click', () => {
    activeController.fretboard.w = Math.min(0.85, activeController.fretboard.w + 0.05);
    activeController.fretboard.h = Math.min(0.75, activeController.fretboard.h + 0.05);
  });
  container.querySelector('#calib-farther-btn')?.addEventListener('click', () => {
    activeController.fretboard.w = Math.max(0.45, activeController.fretboard.w - 0.05);
    activeController.fretboard.h = Math.max(0.35, activeController.fretboard.h - 0.05);
  });
  container.querySelector('#calib-reset-btn')?.addEventListener('click', () => {
    activeController.fretboard.w = 0.64;
    activeController.fretboard.h = 0.56;
  });
}
