// Detector de acordes con IA en tiempo real utilizando MediaPipe HandLandmarker.
// Analiza la posición de las yemas de los dedos (Índice, Medio, Anular, Meñique)
// contra el mástil de la guitarra virtual para validar si el acorde se coloca correctamente.

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { fretPositions } from '../data/chords.js';
import { FINGER_NAMES } from './music.js';
import { strum } from '../audio/guitar.js';
import { recordCameraValidation } from './state.js';

let handLandmarker = null;
let isInitializing = false;

// Rutas dinámicas para soportar tanto localhost como GitHub Pages (/guitarra/)
function getAssetUrls() {
  const origin = window.location.origin;
  const base = import.meta.env.BASE_URL || '/';
  const resolvedBase = new URL(base, origin).pathname.replace(/\/+$/, '');

  const localWasm = `${origin}${resolvedBase}/mediapipe/wasm`;
  const localModel = `${origin}${resolvedBase}/mediapipe/hand_landmarker.task`;
  const cdnWasm = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
  const cdnModel = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
  return { localWasm, localModel, cdnWasm, cdnModel };
}

export async function initHandLandmarker() {
  if (handLandmarker) return handLandmarker;
  if (isInitializing) {
    while (isInitializing) await new Promise((r) => setTimeout(r, 80));
    return handLandmarker;
  }
  isInitializing = true;

  const { localWasm, localModel, cdnWasm, cdnModel } = getAssetUrls();

  // Intento 1: Local con GPU
  try {
    const vision = await FilesetResolver.forVisionTasks(localWasm);
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: localModel,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    console.log('✓ MediaPipe HandLandmarker cargado: Local GPU');
    return handLandmarker;
  } catch (errLocalGpu) {
    console.warn('Fallo local GPU, probando local CPU...', errLocalGpu);
  }

  // Intento 2: Local con CPU
  try {
    const vision = await FilesetResolver.forVisionTasks(localWasm);
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: localModel,
        delegate: 'CPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
    });
    console.log('✓ MediaPipe HandLandmarker cargado: Local CPU');
    return handLandmarker;
  } catch (errLocalCpu) {
    console.warn('Fallo local CPU, probando CDN GPU de Google...', errLocalCpu);
  }

  // Intento 3: CDN con GPU
  try {
    const vision = await FilesetResolver.forVisionTasks(cdnWasm);
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: cdnModel,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
    });
    console.log('✓ MediaPipe HandLandmarker cargado: CDN GPU');
    return handLandmarker;
  } catch (errCdnGpu) {
    console.warn('Fallo CDN GPU, probando CDN CPU...', errCdnGpu);
  }

  // Intento 4: CDN con CPU
  try {
    const vision = await FilesetResolver.forVisionTasks(cdnWasm);
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: cdnModel,
        delegate: 'CPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
    });
    console.log('✓ MediaPipe HandLandmarker cargado: CDN CPU');
    return handLandmarker;
  } catch (errCdnCpu) {
    console.error('No se pudo inicializar MediaPipe (se usará modo visual guiado):', errCdnCpu);
    return null;
  } finally {
    isInitializing = false;
  }
}

/**
 * Representa el diapasón virtual dentro del canvas (coordenadas relativas 0..1).
 * Strings: 0 = cuerda 6 (más gruesa, arriba), 5 = cuerda 1 (más fina, abajo).
 * Frets: 1, 2, 3, 4, 5.
 */
export class VirtualFretboard {
  constructor({
    cx = 0.5,
    cy = 0.46,
    w = 0.34,
    h = 0.22,
    numFrets = 4,
    x = null,
    y = null,
  } = {}) {
    this.w = w;
    this.h = h;
    this.cx = x !== null ? x + w / 2 : cx;
    this.cy = y !== null ? y + h / 2 : cy;
    this.numFrets = numFrets;
  }

  get x() {
    return this.cx - this.w / 2;
  }

  set x(val) {
    this.cx = val + this.w / 2;
  }

  get y() {
    return this.cy - this.h / 2;
  }

  set y(val) {
    this.cy = val + this.h / 2;
  }

  // Convierte cuerda (6..1) y traste (1..numFrets) a coordenadas de canvas
  getTargetPos(stringNum, fretNum, canvasW = 1280, canvasH = 720) {
    const cW = canvasW || 1280;
    const cH = canvasH || 720;
    const strIdx = Math.max(0, Math.min(5, 6 - (stringNum || 1))); // 0..5
    const frets = Math.max(1, this.numFrets || 4);
    const safeFret = Math.max(1, Math.min(frets, fretNum || 1));
    const fx = this.x + (safeFret - 0.5) * (this.w / frets);
    const fy = this.y + (strIdx / 5) * this.h;
    return { x: fx * cW, y: fy * cH };
  }

  // Convierte un punto (x, y) de canvas a cuerda y traste más cercano
  pointToFretAndString(px, py, canvasW = 1280, canvasH = 720) {
    const w = canvasW || 1280;
    const h = canvasH || 720;
    const nx = px / w;
    const ny = py / h;
    const bx = this.x;
    const by = this.y;
    const bw = this.w;
    const bh = this.h;
    const frets = Math.max(1, this.numFrets || 4);

    const inBox = nx >= bx - 0.05 && nx <= bx + bw + 0.05 &&
                 ny >= by - 0.05 && ny <= by + bh + 0.05;

    const relX = (nx - bx) / (bw || 0.34);
    const relY = (ny - by) / (bh || 0.22);

    const fret = Math.max(1, Math.min(frets, Math.floor(relX * frets) + 1));
    const strIdx = Math.max(0, Math.min(5, Math.round(relY * 5)));
    const string = 6 - strIdx; // 6..1

    return { fret, string, inBox, relX, relY };
  }
}

// Índices de MediaPipe para las puntas de los dedos
export const FINGER_TIPS = {
  1: 8,  // Dedo 1 (Índice) -> Landmark 8
  2: 12, // Dedo 2 (Medio) -> Landmark 12
  3: 16, // Dedo 3 (Anular) -> Landmark 16
  4: 20, // Dedo 4 (Meñique) -> Landmark 20
};

export const FINGER_PIPS = {
  1: 6,
  2: 10,
  3: 14,
  4: 18,
};

/**
 * Evalúa si las puntas de los dedos coinciden con las posiciones requeridas del acorde.
 */
export function evaluateChordPlacement(landmarks, chord, fretboard, canvasW, canvasH, { tolerancePx } = {}) {
  if (!chord) {
    return { score: 0, detectedHand: false, details: [], isComplete: false };
  }

  const fb = fretboard || new VirtualFretboard();
  const cW = canvasW || 1280;
  const cH = canvasH || 720;
  // Distancia vertical entre cuerdas en píxeles
  const stringSpacing = (fb.h * cH) / 5;
  // Tolerancia ergonómica adaptada a la escala del mástil
  const effTolerance = tolerancePx || Math.max(24, Math.min(46, Math.round(stringSpacing * 0.72)));

  const reqPositions = fretPositions(chord); // [{ string, fret, finger }, ...]
  const results = [];
  let totalScore = 0;

  // Analizar cada dedo requerido por el acorde (dedos 1 al 4)
  const fingersNeeded = [1, 2, 3, 4].filter((num) =>
    reqPositions.some((p) => p.finger === num)
  );

  if (!landmarks || !Array.isArray(landmarks) || landmarks.length === 0) {
    return {
      score: 0,
      detectedHand: false,
      details: fingersNeeded.map((f) => {
        const req = reqPositions.find((p) => p.finger === f);
        return {
          finger: f,
          name: FINGER_NAMES[f] || `Dedo ${f}`,
          status: 'no_hand',
          text: req ? `Coloca el ${FINGER_NAMES[f] || 'dedo'} en Cuerda ${req.string}, Traste ${req.fret}` : 'Coloca tu mano frente a la cámara',
          score: 0,
          targetPos: req ? fb.getTargetPos(req.string, req.fret, cW, cH) : null,
          tipPos: null,
          targetFret: req ? req.fret : 1,
          targetString: req ? req.string : 1,
        };
      }),
      isComplete: false,
    };
  }

  for (const fingerNum of fingersNeeded) {
    const tipIdx = FINGER_TIPS[fingerNum];
    const tip = (tipIdx !== undefined && landmarks[tipIdx]) ? landmarks[tipIdx] : null;

    // Posición requerida en el mástil para este dedo
    const req = reqPositions.find((p) => p.finger === fingerNum);
    if (!req) continue;

    const targetPos = fb.getTargetPos(req.string, req.fret, cW, cH);

    // Si la yema no se detectó o no tiene coordenadas válidas
    if (!tip || typeof tip.x !== 'number' || typeof tip.y !== 'number' || isNaN(tip.x) || isNaN(tip.y)) {
      results.push({
        finger: fingerNum,
        name: FINGER_NAMES[fingerNum] || `Dedo ${fingerNum}`,
        status: 'no_tip',
        text: `Acerca el ${FINGER_NAMES[fingerNum] || 'dedo'} a cuerda ${req.string}, traste ${req.fret}`,
        score: 0,
        dist: 9999,
        targetPos,
        tipPos: null,
        targetFret: req.fret,
        targetString: req.string,
      });
      continue;
    }

    const tipPos = { x: tip.x * cW, y: tip.y * cH };
    const dx = tipPos.x - targetPos.x;
    const dy = tipPos.y - targetPos.y;
    const dist = Math.hypot(dx, dy);

    // ¿Qué traste y cuerda está pisando según el mapa?
    const actual = fb.pointToFretAndString(tipPos.x, tipPos.y, cW, cH);

    // Score de este dedo (1.0 = justo en el centro, decae con la distancia)
    const fingerScore = Math.max(0, Math.min(1, 1 - dist / (effTolerance * 2.2)));

    let status = 'bad';
    let text = '';

    if (dist <= effTolerance) {
      status = 'ok';
      text = `✓ En Traste ${req.fret}, Cuerda ${req.string} (¡Perfecto!)`;
    } else if (dist <= effTolerance * 1.35) {
      status = 'near_ok';
      text = `✓ En Traste ${req.fret}, Cuerda ${req.string}`;
    } else if (actual.fret === req.fret && actual.string !== req.string) {
      status = 'wrong_string';
      const dir = req.string > actual.string ? 'sube' : 'baja';
      text = `⚠ En traste ${req.fret}, pero ${dir} a cuerda ${req.string}`;
    } else if (actual.string === req.string && actual.fret !== req.fret) {
      status = 'wrong_fret';
      text = `⚠ En cuerda ${req.string}, pero mueve al traste ${req.fret}`;
    } else {
      status = 'bad';
      text = `Coloca el ${FINGER_NAMES[fingerNum] || 'dedo'} en Cuerda ${req.string}, Traste ${req.fret}`;
    }

    results.push({
      finger: fingerNum,
      name: FINGER_NAMES[fingerNum] || `Dedo ${fingerNum}`,
      status,
      text,
      score: fingerScore,
      dist,
      targetPos,
      tipPos,
      targetFret: req.fret,
      targetString: req.string,
    });

    totalScore += fingerScore;
  }

  const finalScore = fingersNeeded.length > 0
    ? Math.round((totalScore / fingersNeeded.length) * 100)
    : 100;

  // Tolerancia flexible ante micro-movimiento natural
  const allFingersNear = results.length > 0 && results.every((r) =>
    r.status === 'ok' || r.status === 'near_ok' || r.dist <= effTolerance * 1.35 || r.score >= 0.58
  );

  const isMatching = (finalScore >= 65 && allFingersNear) || (results.length > 0 && results.every((r) => r.status === 'ok' || r.status === 'near_ok'));

  return {
    score: finalScore,
    detectedHand: true,
    details: results,
    isMatching,
    isComplete: isMatching,
  };
}

/**
 * Controlador de la Cámara y Loop de Detección.
 */
export class GuitarCameraController {
  constructor({
    videoEl,
    canvasEl,
    onEvaluation = () => {},
    onSuccess = () => {},
    onStatusChange = () => {},
  }) {
    this.video = videoEl;
    this.canvas = canvasEl;
    this.ctx = canvasEl ? canvasEl.getContext('2d') : null;
    this.onEvaluation = onEvaluation;
    this.onSuccess = onSuccess;
    this.onStatusChange = onStatusChange;

    // Cargar escala preferida del usuario (o usar la predeterminada ergonómica compacta)
    let initW = 0.34;
    let initH = 0.22;
    let initCy = 0.46;
    try {
      const saved = localStorage.getItem('traste_fretboard_scale');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.w === 'number') initW = parsed.w;
        if (parsed && typeof parsed.h === 'number') initH = parsed.h;
        if (parsed && typeof parsed.cy === 'number') initCy = parsed.cy;
      }
    } catch (e) {}

    this.fretboard = new VirtualFretboard({ w: initW, h: initH, cy: initCy });
    this.currentChord = null;
    this.stream = null;
    this.animId = null;
    this.isRunning = false;

    // Control de tiempo para detección fluida
    this.lastVideoTime = -1;
    this.lastDetectionTime = 0;
    this.lastLandmarks = null;

    // Validación sostenida con acumulador continuo resiliente al movimiento
    this.holdProgress = 0;
    this.holdDuration = 750; // 0.75 segundos continuos
    this.hasTriggeredSuccess = false;
    this.lastLoopTime = performance.now();

    // Estado de simulación (si no hay cámara)
    this.simulatedMode = false;
    this.simulatedAngle = 0;
  }

  setFretboardScale(w, h, cy = null) {
    if (!this.fretboard) return;
    this.fretboard.w = Math.max(0.18, Math.min(0.55, w));
    this.fretboard.h = Math.max(0.12, Math.min(0.38, h));
    if (cy !== null) {
      this.fretboard.cy = Math.max(0.20, Math.min(0.80, cy));
    }
    try {
      localStorage.setItem(
        'traste_fretboard_scale',
        JSON.stringify({ w: this.fretboard.w, h: this.fretboard.h, cy: this.fretboard.cy })
      );
    } catch (e) {}
  }

  moveFretboard(dCy) {
    if (!this.fretboard) return;
    this.fretboard.cy = Math.max(0.20, Math.min(0.80, this.fretboard.cy + dCy));
    try {
      localStorage.setItem(
        'traste_fretboard_scale',
        JSON.stringify({ w: this.fretboard.w, h: this.fretboard.h, cy: this.fretboard.cy })
      );
    } catch (e) {}
  }

  setChord(chord) {
    this.currentChord = chord;
    this.holdProgress = 0;
    this.hasTriggeredSuccess = false;
    if (chord && chord.frets && Array.isArray(chord.frets)) {
      const positiveFrets = chord.frets.filter((f) => f > 0);
      const maxFret = positiveFrets.length > 0 ? Math.max(...positiveFrets) : 4;
      if (this.fretboard) {
        this.fretboard.numFrets = Math.min(8, Math.max(4, maxFret));
      }
    }
  }

  async startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('SECURE_CONTEXT_REQUIRED');
    }

    this.onStatusChange('solicitando_permiso');

    // 1. Obtener stream de la cámara (con fallback si falla la resolución ideal)
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });
    } catch (errConstraint) {
      console.warn('Fallo con resolución ideal, intentando video simple:', errConstraint);
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    }

    this.stream = stream;
    if (this.video) {
      this.video.srcObject = this.stream;
      this.video.setAttribute('playsinline', '');
      this.video.setAttribute('muted', '');
      this.video.muted = true;

      // 2. Esperar a que el video esté listo para reproducirse
      await new Promise((resolve) => {
        if (this.video.readyState >= 2) {
          resolve();
        } else {
          const onReady = () => {
            this.video.removeEventListener('loadeddata', onReady);
            this.video.removeEventListener('loadedmetadata', onReady);
            resolve();
          };
          this.video.addEventListener('loadeddata', onReady);
          this.video.addEventListener('loadedmetadata', onReady);
          setTimeout(resolve, 2500); // Timeout de seguridad
        }
      });

      try {
        await this.video.play();
      } catch (playErr) {
        console.warn('Advertencia al reproducir video:', playErr);
      }
    }

    if (this.canvas) {
      this.canvas.width = (this.video && this.video.videoWidth) ? this.video.videoWidth : 1280;
      this.canvas.height = (this.video && this.video.videoHeight) ? this.video.videoHeight : 720;
    }
    this.isRunning = true;
    this.simulatedMode = false;
    this.lastVideoTime = -1;
    this.lastDetectionTime = 0;
    this.lastLandmarks = null;

    // Desacoplamos el loop con requestAnimationFrame para que ningún error transitorio rechace la promesa de startCamera
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.animId = requestAnimationFrame(() => this.loop());

    this.onStatusChange('camara_activa');

    // 3. Inicializar MediaPipe en segundo plano sin bloquear el video en vivo
    initHandLandmarker()
      .then((landmarker) => {
        if (!this.isRunning) return;
        if (landmarker) {
          this.onStatusChange('ia_lista');
        } else {
          this.onStatusChange('ia_fallback');
        }
      })
      .catch((err) => {
        console.warn('MediaPipe error en inicialización de fondo:', err);
        if (this.isRunning) {
          this.onStatusChange('ia_fallback');
        }
      });
  }

  startSimulation() {
    this.simulatedMode = true;
    if (this.canvas) {
      this.canvas.width = 1280;
      this.canvas.height = 720;
    }
    this.isRunning = true;
    this.lastLandmarks = null;
    this.onStatusChange('simulacion');
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.animId = requestAnimationFrame(() => this.loop());
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.lastLandmarks = null;
    this.lastVideoTime = -1;
    this.onStatusChange('detenido');
  }

  loop() {
    if (!this.isRunning) return;

    // Asegurar que el siguiente frame se encole siempre
    this.animId = requestAnimationFrame(() => this.loop());

    try {
      const w = (this.canvas && this.canvas.width) ? this.canvas.width : 1280;
      const h = (this.canvas && this.canvas.height) ? this.canvas.height : 720;
      const ctx = this.ctx;
      if (!ctx) return;

      // Limpiar canvas para que actúe como overlay transparente sobre el video nativo
      ctx.clearRect(0, 0, w, h);

      if (this.simulatedMode) {
        // Modo simulación: fondo de estudio oscuro con textura
        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(0, 0, w, h);
        const grad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, w * 0.7);
        grad.addColorStop(0, 'rgba(255, 120, 50, 0.08)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // 2. Obtener landmarks
      let landmarks = null;
      if (!this.simulatedMode && handLandmarker && this.video && this.video.readyState >= 2) {
        const now = performance.now();
        // MediaPipe exige timestamps crecientes y nuevo frame
        if (this.video.currentTime !== this.lastVideoTime && now > this.lastDetectionTime) {
          this.lastVideoTime = this.video.currentTime;
          this.lastDetectionTime = now;
          try {
            const results = handLandmarker.detectForVideo(this.video, now);
            if (
              results &&
              results.landmarks &&
              results.landmarks.length > 0 &&
              Array.isArray(results.landmarks[0]) &&
              results.landmarks[0].length >= 21
            ) {
              // En espejo, invertimos X de los landmarks para que coincida con el video CSS transform: scaleX(-1)
              landmarks = results.landmarks[0].map((lm) => ({
                x: lm && typeof lm.x === 'number' ? 1 - lm.x : 0.5,
                y: lm && typeof lm.y === 'number' ? lm.y : 0.5,
                z: lm && typeof lm.z === 'number' ? lm.z : 0,
              }));
              this.lastLandmarks = landmarks;
            } else {
              this.lastLandmarks = null;
            }
          } catch (detErr) {
            console.warn('Frame de detección omitido:', detErr);
            landmarks = this.lastLandmarks;
          }
        } else {
          landmarks = this.lastLandmarks;
        }
      } else if (this.simulatedMode && this.currentChord) {
        // Mano simulada que se mueve suavemente hacia las notas del acorde
        this.simulatedAngle = (this.simulatedAngle || 0) + 0.035;
        landmarks = this.generateSimulatedHand(w, h);
      }

      // 3. Dibujar el diapasón virtual (mástil guía)
      this.drawVirtualFretboard(ctx, w, h);

      // 4. Evaluar posiciones contra el acorde activo
      if (this.currentChord) {
        const evalResult = evaluateChordPlacement(landmarks, this.currentChord, this.fretboard, w, h);
        this.drawChordTargetsAndFeedback(ctx, evalResult, w, h);

        // Notificar a la interfaz
        if (this.onEvaluation && evalResult) {
          this.onEvaluation(evalResult);
        }

        // 5. Manejo del éxito sostenido con acumulador continuo resiliente al movimiento
        const nowMs = performance.now();
        const dt = Math.min(100, Math.max(10, nowMs - (this.lastLoopTime || nowMs)));
        this.lastLoopTime = nowMs;

        if (evalResult && evalResult.isMatching) {
          // Si está en verde/tocando el acorde, el porcentaje sube de 0 a 100% en ~750ms
          this.holdProgress = Math.min(1, this.holdProgress + dt / this.holdDuration);
        } else {
          // Si hay micro-movimiento o fluctuación de 1 frame, no se resetea a 0; decae suavemente
          this.holdProgress = Math.max(0, this.holdProgress - (dt / 1400));
        }

        // Dibujar indicador circular en pantalla si hay progreso visible
        if (this.holdProgress > 0.04) {
          this.drawHoldRing(ctx, w, h, this.holdProgress);
        }

        // Notificar a la interfaz con holdProgress
        if (this.onEvaluation && evalResult) {
          this.onEvaluation({ ...evalResult, holdProgress: this.holdProgress });
        }

        // Disparar éxito cuando el porcentaje se completa al 100%
        if (this.holdProgress >= 0.99) {
          if (!this.hasTriggeredSuccess) {
            this.hasTriggeredSuccess = true;
            strum(this.currentChord, { gain: 0.7 });
            recordCameraValidation(this.currentChord.id, evalResult.score);
            if (this.onSuccess) {
              this.onSuccess(this.currentChord, evalResult);
            }
          }
        } else if (this.holdProgress <= 0.05) {
          // Solo se rearma para volver a sonar cuando el usuario suelta el acorde
          this.hasTriggeredSuccess = false;
        }
      }

      // 6. Dibujar esqueleto de la mano si se detectó
      if (landmarks) {
        this.drawHandLandmarks(ctx, landmarks, w, h);
      }
    } catch (frameErr) {
      console.warn('Error en frame de visualización:', frameErr);
    }
  }

  // Generador de mano simulada para pruebas
  generateSimulatedHand(w, h) {
    const fb = this.fretboard || new VirtualFretboard();
    const req = this.currentChord ? fretPositions(this.currentChord) : [];
    const time = this.simulatedAngle || 0;
    const wobble = Math.sin(time) * 14;

    // Crear 21 landmarks aproximados
    const lms = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));

    // Muñeca en la base del mástil
    const wristX = (fb.x ?? 0.18) + (fb.w ?? 0.64) * 0.4;
    const wristY = (fb.y ?? 0.22) + (fb.h ?? 0.56) * 1.15 + (Math.cos(time * 0.5) * 8) / (h || 720);
    lms[0] = { x: wristX, y: wristY, z: 0 };

    // Posicionar puntas de los dedos cerca de sus objetivos
    req.forEach((p) => {
      const tipIdx = FINGER_TIPS[p.finger];
      if (tipIdx && tipIdx < lms.length) {
        const target = fb.getTargetPos(p.string, p.fret, w, h);
        if (target && typeof target.x === 'number' && typeof target.y === 'number') {
          // Llegan a la posición correcta cuando sin(time) > 0.1
          const reach = Math.max(0, Math.sin(time * 0.8));
          const tx = (target.x + (1 - reach) * wobble * 3) / (w || 1280);
          const ty = (target.y + (1 - reach) * wobble * 3) / (h || 720);
          lms[tipIdx] = { x: tx, y: ty, z: 0 };

          // Nudillos intermedios
          const pipIdx = FINGER_PIPS[p.finger];
          if (pipIdx && pipIdx < lms.length) {
            lms[pipIdx] = { x: (tx + wristX) / 2, y: (ty + wristY) / 2, z: 0 };
          }
        }
      }
    });

    return lms;
  }

  // Dibuja el mástil de guitarra superpuesto con estilo Cyber/Studio
  drawVirtualFretboard(ctx, w, h) {
    if (!ctx) return;
    const fb = this.fretboard || new VirtualFretboard();
    const x = fb.x * w;
    const y = fb.y * h;
    const bw = fb.w * w;
    const bh = fb.h * h;
    const numFrets = fb.numFrets || 4;

    ctx.save();

    // Fondo del diapasón (madera oscura translúcida)
    ctx.fillStyle = 'rgba(18, 16, 22, 0.78)';
    ctx.strokeStyle = 'rgba(255, 179, 71, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y - 8, bw, bh + 16, 12);
    } else {
      ctx.rect(x, y - 8, bw, bh + 16);
    }
    ctx.fill();
    ctx.stroke();

    // Cejuela (Nut) a la izquierda
    ctx.fillStyle = '#f5efe6';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 6;
    ctx.fillRect(x - 5, y - 8, 6, bh + 16);
    ctx.shadowBlur = 0;

    // Trastes (barritas verticales)
    const fretW = bw / numFrets;
    for (let f = 1; f <= numFrets; f++) {
      const fx = x + f * fretW;
      ctx.strokeStyle = 'rgba(230, 230, 240, 0.35)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(fx, y - 6);
      ctx.lineTo(fx, y + bh + 6);
      ctx.stroke();

      // Número del traste abajo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Traste ${f}`, fx - fretW / 2, y + bh + 20);
    }

    // Puntos marcadores tradicionales en traste 3, 5, 7
    const dotFrets = [3, 5, 7];
    dotFrets.forEach((df) => {
      if (df <= numFrets) {
        const dotX = x + (df - 0.5) * fretW;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.beginPath();
        ctx.arc(dotX, y + bh / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Cuerdas (líneas horizontales de la 6ª arriba a la 1ª abajo)
    const stringNames = ['6 (Mi)', '5 (La)', '4 (Re)', '3 (Sol)', '2 (Si)', '1 (Mi)'];
    const stringGauges = [3.2, 2.6, 2.1, 1.6, 1.2, 0.9];

    for (let s = 0; s < 6; s++) {
      const sy = y + (s / 5) * bh;
      ctx.strokeStyle = '#c5ccd8';
      ctx.lineWidth = stringGauges[s];
      ctx.beginPath();
      ctx.moveTo(x - 4, sy);
      ctx.lineTo(x + bw + 4, sy);
      ctx.stroke();

      // Nombre de la cuerda a la izquierda
      ctx.fillStyle = 'rgba(255, 179, 71, 0.88)';
      ctx.font = '600 10.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(stringNames[s], x - 8, sy + 3.5);
    }

    ctx.restore();
  }

  // Dibuja los objetivos del acorde y las conexiones con las yemas
  drawChordTargetsAndFeedback(ctx, evalResult, w, h) {
    if (!ctx || !evalResult || !evalResult.details || !Array.isArray(evalResult.details)) return;

    const fb = this.fretboard || new VirtualFretboard();
    const bh = fb.h * h;
    const targetRadius = Math.max(12, Math.min(18, Math.round(bh / 11)));
    const tipRadius = Math.max(8, Math.min(13, Math.round(targetRadius * 0.75)));

    ctx.save();

    evalResult.details.forEach((det) => {
      const { targetPos, tipPos, status, finger } = det;
      if (!targetPos || typeof targetPos.x !== 'number' || typeof targetPos.y !== 'number') return;

      // 1. Círculo objetivo en el mástil
      ctx.lineWidth = 2.5;
      const isGreen = status === 'ok' || status === 'near_ok';
      if (isGreen) {
        ctx.strokeStyle = '#28c76f';
        ctx.fillStyle = 'rgba(40, 199, 111, 0.35)';
        ctx.shadowColor = '#28c76f';
        ctx.shadowBlur = 14;
      } else {
        ctx.strokeStyle = '#ff9f43';
        ctx.fillStyle = 'rgba(255, 159, 67, 0.22)';
        ctx.shadowColor = '#ff9f43';
        ctx.shadowBlur = 10;
      }

      ctx.beginPath();
      ctx.arc(targetPos.x, targetPos.y, targetRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Número del dedo en el objetivo
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(targetRadius * 0.95)}px Outfit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`D${finger}`, targetPos.x, targetPos.y);

      // 2. Si detectamos la yema, trazar línea guía y halo
      if (tipPos && typeof tipPos.x === 'number' && typeof tipPos.y === 'number') {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = isGreen ? 'rgba(40, 199, 111, 0.75)' : 'rgba(255, 77, 79, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tipPos.x, tipPos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Halo en la yema
        ctx.fillStyle = isGreen ? 'rgba(40, 199, 111, 0.6)' : 'rgba(255, 77, 79, 0.6)';
        ctx.beginPath();
        ctx.arc(tipPos.x, tipPos.y, tipRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  // Dibuja el esqueleto de la mano (landmarks MediaPipe)
  drawHandLandmarks(ctx, landmarks, w, h) {
    if (!ctx || !landmarks || !Array.isArray(landmarks)) return;
    ctx.save();

    // Conexiones de los dedos
    const CONNECTIONS = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Pulgar
      [0, 5], [5, 6], [6, 7], [7, 8],       // Índice
      [0, 9], [9, 10], [10, 11], [11, 12],  // Medio
      [0, 13], [13, 14], [14, 15], [15, 16],// Anular
      [0, 17], [17, 18], [18, 19], [19, 20],// Meñique
      [5, 9], [9, 13], [13, 17]             // Palma
    ];

    ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
    ctx.lineWidth = 2.5;
    CONNECTIONS.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      if (
        p1 && p2 &&
        typeof p1.x === 'number' && typeof p1.y === 'number' &&
        typeof p2.x === 'number' && typeof p2.y === 'number'
      ) {
        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
      }
    });

    // Puntos
    landmarks.forEach((p, idx) => {
      if (p && typeof p.x === 'number' && typeof p.y === 'number') {
        const isTip = [4, 8, 12, 16, 20].includes(idx);
        ctx.fillStyle = isTip ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, isTip ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }

  // Anillo de progreso al mantener la posición correcta
  drawHoldRing(ctx, w, h, progress) {
    if (!ctx) return;
    ctx.save();
    const cx = (w || 1280) / 2;
    const cy = (h || 720) / 2;
    const r = 70;

    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#28c76f';
    ctx.shadowColor = '#28c76f';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, progress)));
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(progress * 100)}%`, cx, cy);

    ctx.restore();
  }
}

