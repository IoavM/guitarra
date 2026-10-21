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

          <!-- CALIBRACIÓN DEL TAMAÑO DEL MÁSTIL -->
          <div class="card" style="padding: 18px; background: var(--surface-2);">
            <div class="row between" style="margin-bottom: 8px;">
              <h4 style="margin: 0; font-size: 1rem;">📏 Tamaño del mástil virtual</h4>
              <span class="chip sm" id="calib-size-chip">Normal (100%)</span>
            </div>
            <p class="small muted" style="margin-bottom: 12px; line-height: 1.4;">
              Ajusta el tamaño para que tus dedos alcancen cómodamente las cuerdas y trastes según tu mano:
            </p>

            <!-- PRESETS DE TAMAÑO ERGONÓMICOS -->
            <div class="row" style="gap: 6px; margin-bottom: 10px;">
              <button class="btn sm ghost" id="preset-size-sm" style="flex: 1; padding: 6px 8px;" title="Dedos cortos o distancia lejana">
                🖐 Pequeño
              </button>
              <button class="btn sm primary" id="preset-size-md" style="flex: 1; padding: 6px 8px;" title="Tamaño ergonómico estándar">
                ✋ Normal
              </button>
              <button class="btn sm ghost" id="preset-size-lg" style="flex: 1; padding: 6px 8px;" title="Manos grandes o distancia cercana">
                🖐️ Grande
              </button>
            </div>

            <!-- CONTROLES FINOS -->
            <div class="row" style="gap: 6px; margin-bottom: 8px;">
              <button class="btn sm ghost" id="calib-shrink-btn" style="flex: 1;" title="Hacer el mástil más pequeño">
                ➖ Reducir
              </button>
              <button class="btn sm ghost" id="calib-expand-btn" style="flex: 1;" title="Hacer el mástil más amplio">
                ➕ Agrandar
              </button>
              <button class="btn sm ghost" id="calib-reset-btn" title="Restablecer tamaño recomendado">
                ↺ Reset
              </button>
            </div>

            <!-- AJUSTE DE POSICIÓN VERTICAL -->
            <div class="row between" style="margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border); font-size: 0.85rem; color: var(--muted);">
              <span>Posición:</span>
              <div class="row" style="gap: 6px;">
                <button class="btn sm ghost" id="calib-up-btn" style="padding: 4px 8px;" title="Subir mástil">⬆ Subir</button>
                <button class="btn sm ghost" id="calib-down-btn" style="padding: 4px 8px;" title="Bajar mástil">⬇ Bajar</button>
              </div>
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
    onStatusChange: (status) => {
      if (status === 'solicitando_permiso') {
        hudStatus.innerHTML = 'Estado: <b style="color: var(--primary);">Solicitando permiso...</b>';
      } else if (status === 'camara_activa') {
        hudStatus.innerHTML = 'Estado: <b style="color: var(--teal);">Cámara activa (Cargando detector IA...)</b>';
      } else if (status === 'ia_lista') {
        hudStatus.innerHTML = 'Estado: <b style="color: var(--success);">IA lista - Coloca tu mano</b>';
      } else if (status === 'ia_fallback') {
        hudStatus.innerHTML = 'Estado: <b style="color: var(--amber);">Cámara en vivo (Guía visual)</b>';
      } else if (status === 'simulacion') {
        hudStatus.innerHTML = 'Estado: <b style="color: var(--teal);">Simulación interactiva</b>';
      } else if (status === 'detenido') {
        hudStatus.innerHTML = 'Estado: <span>En espera</span>';
      }
    },
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
      hudStatus.innerHTML = 'Estado: <b style="color: var(--primary);">Solicitando permiso...</b>';

      await activeController.startCamera();

      placeholder.classList.add('hidden');
      stopCamBtn.disabled = false;
      startCamBtn.disabled = true;
      startCamBtn.innerHTML = '<span>✓ Cámara activa</span>';
    } catch (err) {
      console.error('Error detallado de cámara:', err);
      startCamBtn.disabled = false;
      startCamBtn.innerHTML = '<span>📷 Iniciar Cámara Web</span>';

      let userMsg = 'No se pudo acceder a la cámara web';
      let helpSteps = `
        <div style="text-align: left; max-width: 440px; margin: 0 auto 16px; font-size: 0.9rem; line-height: 1.5; background: var(--surface-2); padding: 14px 18px; border-radius: 12px; border: 1px solid var(--border);">
          <b style="color: var(--text); display: block; margin-bottom: 6px;">Cómo habilitar tu cámara:</b>
          <ol style="padding-left: 20px; margin: 0; color: var(--muted);">
            <li>Haz clic en el <b>ícono del candado (🔒)</b> o de permisos a la izquierda de la barra de direcciones de tu navegador.</li>
            <li>En la opción <b>Cámara</b>, selecciona <b>"Permitir"</b>.</li>
            <li>En Windows: Comprueba que <i>Configuración &gt; Privacidad y seguridad &gt; Cámara</i> tenga activado "Permitir que las aplicaciones accedan a la cámara".</li>
          </ol>
        </div>
      `;

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        hudStatus.innerHTML = 'Estado: <b style="color: var(--danger);">Permiso bloqueado</b>';
        userMsg = 'El navegador o Windows bloquearon el permiso de cámara';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        hudStatus.innerHTML = 'Estado: <b style="color: var(--danger);">Cámara no encontrada</b>';
        userMsg = 'No se detectó ninguna cámara web conectada a tu equipo';
        helpSteps = '<p class="muted" style="margin-bottom: 16px; font-size: 0.92rem;">Verifica la conexión de tu webcam USB o prueba el Modo Simulación interactivo.</p>';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        hudStatus.innerHTML = 'Estado: <b style="color: var(--danger);">Cámara ocupada</b>';
        userMsg = 'Tu cámara está siendo utilizada por otra aplicación';
        helpSteps = '<p class="muted" style="margin-bottom: 16px; font-size: 0.92rem;">Cierra aplicaciones como Zoom, Microsoft Teams, Google Meet o la app Cámara de Windows y vuelve a intentarlo.</p>';
      } else if (err.message === 'SECURE_CONTEXT_REQUIRED') {
        hudStatus.innerHTML = 'Estado: <b style="color: var(--danger);">Conexión no segura</b>';
        userMsg = 'Se requiere conexión segura (HTTPS o localhost)';
        helpSteps = '<p class="muted" style="margin-bottom: 16px; font-size: 0.92rem;">Ingresa a través de https://ioavm.github.io/guitarra/ o desde localhost.</p>';
      } else {
        hudStatus.innerHTML = 'Estado: <b style="color: var(--danger);">Error de acceso</b>';
        userMsg = `Error al conectar cámara: ${err.message || 'Desconocido'}`;
      }

      placeholder.innerHTML = `
        <div class="cp-ico" style="filter: drop-shadow(0 6px 20px hsla(355, 86%, 63%, 0.6));">📷</div>
        <h3 style="color: var(--danger); margin-bottom: 10px;">${userMsg}</h3>
        ${helpSteps}
        <div class="row" style="justify-content: center; gap: 10px;">
          <button class="btn primary sm" id="retry-cam-btn">🔄 Reintentar conexión</button>
          <button class="btn ghost sm" id="trigger-sim-fallback">🧪 Usar Modo Simulación</button>
        </div>
      `;

      placeholder.classList.remove('hidden');

      placeholder.querySelector('#retry-cam-btn')?.addEventListener('click', () => {
        startCamBtn.click();
      });

      placeholder.querySelector('#trigger-sim-fallback')?.addEventListener('click', () => {
        startSimBtn.click();
      });
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
    placeholder.innerHTML = `
      <div class="cp-ico">🎸</div>
      <h3>Cámara en espera</h3>
      <p class="muted" style="margin-top: 6px; font-size: 0.95rem;">
        Haz clic en <b>"Iniciar Cámara Web"</b> para comenzar, o prueba el <b>"Modo Simulación"</b> para ver cómo funciona el algoritmo de análisis.
      </p>
    `;
    placeholder.classList.remove('hidden');
    stopCamBtn.disabled = true;
    startCamBtn.disabled = false;
    startCamBtn.innerHTML = '<span>📷 Iniciar Cámara Web</span>';
    startSimBtn.classList.replace('primary', 'ghost');
    hudStatus.innerHTML = 'Estado: <span>En espera</span>';
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

  // Calibración y escala ergonómica del diapasón virtual
  const sizeChip = container.querySelector('#calib-size-chip');
  const btnSm = container.querySelector('#preset-size-sm');
  const btnMd = container.querySelector('#preset-size-md');
  const btnLg = container.querySelector('#preset-size-lg');

  const updateSizeUI = () => {
    if (!sizeChip || !activeController || !activeController.fretboard) return;
    const w = activeController.fretboard.w;
    const pct = Math.round((w / 0.34) * 100);

    let label = `${pct}%`;
    if (w <= 0.28) label = `Pequeño (${pct}%)`;
    else if (w >= 0.40) label = `Grande (${pct}%)`;
    else label = `Normal (${pct}%)`;

    sizeChip.textContent = label;

    btnSm?.classList.toggle('primary', w <= 0.28);
    btnSm?.classList.toggle('ghost', w > 0.28);

    btnMd?.classList.toggle('primary', w > 0.28 && w < 0.40);
    btnMd?.classList.toggle('ghost', !(w > 0.28 && w < 0.40));

    btnLg?.classList.toggle('primary', w >= 0.40);
    btnLg?.classList.toggle('ghost', w < 0.40);
  };

  updateSizeUI();

  // Presets
  btnSm?.addEventListener('click', () => {
    activeController.setFretboardScale(0.26, 0.17);
    updateSizeUI();
  });
  btnMd?.addEventListener('click', () => {
    activeController.setFretboardScale(0.34, 0.22);
    updateSizeUI();
  });
  btnLg?.addEventListener('click', () => {
    activeController.setFretboardScale(0.44, 0.28);
    updateSizeUI();
  });

  // Ajustes finos
  container.querySelector('#calib-shrink-btn')?.addEventListener('click', () => {
    const curW = activeController.fretboard.w;
    const curH = activeController.fretboard.h;
    activeController.setFretboardScale(curW * 0.9, curH * 0.9);
    updateSizeUI();
  });
  container.querySelector('#calib-expand-btn')?.addEventListener('click', () => {
    const curW = activeController.fretboard.w;
    const curH = activeController.fretboard.h;
    activeController.setFretboardScale(curW * 1.1, curH * 1.1);
    updateSizeUI();
  });
  container.querySelector('#calib-reset-btn')?.addEventListener('click', () => {
    activeController.setFretboardScale(0.34, 0.22, 0.46);
    updateSizeUI();
  });

  // Posición vertical
  container.querySelector('#calib-up-btn')?.addEventListener('click', () => {
    activeController.moveFretboard(-0.04);
  });
  container.querySelector('#calib-down-btn')?.addEventListener('click', () => {
    activeController.moveFretboard(0.04);
  });
}
