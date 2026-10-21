// Detector de acordes con IA en tiempo real utilizando MediaPipe HandLandmarker.
// Analiza la posición de las yemas de los dedos (Índice, Medio, Anular, Meñique)
// contra el mástil de la guitarra virtual para validar si el acorde se coloca correctamente.

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { fretPositions } from '../data/chords.js';
import { FINGER_NAMES } from './music.js';
import { chime, strum } from '../audio/guitar.js';
import { recordCameraValidation } from './state.js';

let handLandmarker = null;
let isInitializing = false;

export async function initHandLandmarker() {
  if (handLandmarker) return handLandmarker;
  if (isInitializing) {
    while (isInitializing) await new Promise((r) => setTimeout(r, 100));
    return handLandmarker;
  }
  isInitializing = true;
  try {
    const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: '/mediapipe/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    return handLandmarker;
  } catch (err) {
    console.warn('Fallback a CPU para MediaPipe:', err);
    try {
      const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/mediapipe/hand_landmarker.task',
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
      });
      return handLandmarker;
    } catch (e2) {
      console.error('No se pudo inicializar MediaPipe:', e2);
      throw e2;
    }
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
  constructor({ x = 0.18, y = 0.22, w = 0.64, h = 0.56, numFrets = 4 } = {}) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.numFrets = numFrets;
  }

  // Convierte cuerda (6..1) y traste (1..numFrets) a coordenadas de canvas
  getTargetPos(stringNum, fretNum, canvasW, canvasH) {
    const strIdx = 6 - stringNum; // 0..5
    const fx = this.x + (fretNum - 0.5) * (this.w / this.numFrets);
    const fy = this.y + (strIdx / 5) * this.h;
    return { x: fx * canvasW, y: fy * canvasH };
  }

  // Convierte un punto (x, y) de canvas a cuerda y traste más cercano
  pointToFretAndString(px, py, canvasW, canvasH) {
    const nx = px / canvasW;
    const ny = py / canvasH;

    const inBox = nx >= this.x - 0.05 && nx <= this.x + this.w + 0.05 &&
                 ny >= this.y - 0.05 && ny <= this.y + this.h + 0.05;

    const relX = (nx - this.x) / this.w;
    const relY = (ny - this.y) / this.h;

    const fret = Math.max(1, Math.min(this.numFrets, Math.floor(relX * this.numFrets) + 1));
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
export function evaluateChordPlacement(landmarks, chord, fretboard, canvasW, canvasH, { tolerancePx = 48 } = {}) {
  const reqPositions = fretPositions(chord); // [{ string, fret, finger }, ...]
  const results = [];
  let totalScore = 0;

  // Analizar cada dedo requerido por el acorde
  const fingersNeeded = [1, 2, 3, 4].filter((num) =>
    reqPositions.some((p) => p.finger === num)
  );

  if (!landmarks || landmarks.length === 0) {
    return {
      score: 0,
      detectedHand: false,
      details: fingersNeeded.map((f) => ({
        finger: f,
        name: FINGER_NAMES[f],
        status: 'no_hand',
        text: `Coloca tu mano frente a la cámara`,
        score: 0,
      })),
    };
  }

  // Si hay cejilla
  const hasBarre = !!chord.barre;

  for (const fingerNum of fingersNeeded) {
    const tipIdx = FINGER_TIPS[fingerNum];
    const tip = landmarks[tipIdx];

    // Posición requerida en el mástil para este dedo
    const req = reqPositions.find((p) => p.finger === fingerNum);
    if (!req) continue;

    const targetPos = fretboard.getTargetPos(req.string, req.fret, canvasW, canvasH);
    const tipPos = { x: tip.x * canvasW, y: tip.y * canvasH };

    // Distancia en píxeles
    const dx = tipPos.x - targetPos.x;
    const dy = tipPos.y - targetPos.y;
    const dist = Math.hypot(dx, dy);

    // ¿Qué traste y cuerda está pisando según el mapa?
    const actual = fretboard.pointToFretAndString(tipPos.x, tipPos.y, canvasW, canvasH);

    // Score de este dedo (1.0 = justo en el centro, decae con la distancia)
    const fingerScore = Math.max(0, Math.min(1, 1 - dist / (tolerancePx * 2.2)));

    let status = 'bad';
    let text = '';

    if (dist <= tolerancePx) {
      status = 'ok';
      text = `✓ En Traste ${req.fret}, Cuerda ${req.string} (¡Perfecto!)`;
    } else if (actual.fret === req.fret && actual.string !== req.string) {
      status = 'wrong_string';
      const dir = req.string > actual.string ? 'sube' : 'baja';
      text = `⚠ En traste ${req.fret}, pero ${dir} a cuerda ${req.string}`;
    } else if (actual.string === req.string && actual.fret !== req.fret) {
      status = 'wrong_fret';
      text = `⚠ En cuerda ${req.string}, pero mueve al traste ${req.fret}`;
    } else {
      status = 'bad';
      text = `Coloca el ${FINGER_NAMES[fingerNum]} en Cuerda ${req.string}, Traste ${req.fret}`;
    }

    results.push({
      finger: fingerNum,
      name: FINGER_NAMES[fingerNum],
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

  return {
    score: finalScore,
    detectedHand: true,
    details: results,
    isComplete: finalScore >= 75 && results.every((r) => r.status === 'ok' || r.score >= 0.7),
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
  }) {
    this.video = videoEl;
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.onEvaluation = onEvaluation;
    this.onSuccess = onSuccess;

    this.fretboard = new VirtualFretboard();
    this.currentChord = null;
    this.stream = null;
    this.animId = null;
    this.isRunning = false;

    // Validación sostenida (holding time)
    this.successStart = null;
    this.holdDuration = 1200; // 1.2 segundos continuos correctos
    this.hasTriggeredSuccess = false;

    // Estado de simulación (si no hay cámara)
    this.simulatedMode = false;
    this.simulatedAngle = 0;
  }

  setChord(chord) {
    this.currentChord = chord;
    this.successStart = null;
    this.hasTriggeredSuccess = false;
  }

  async startCamera() {
    await initHandLandmarker();
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
      audio: false,
    });

    this.video.srcObject = this.stream;
    await new Promise((resolve) => {
      this.video.onloadedmetadata = () => {
        this.video.play();
        resolve();
      };
    });

    this.canvas.width = this.video.videoWidth || 1280;
    this.canvas.height = this.video.videoHeight || 720;

    this.isRunning = true;
    this.loop();
  }

  startSimulation() {
    this.simulatedMode = true;
    this.canvas.width = 1280;
    this.canvas.height = 720;
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }

  loop() {
    if (!this.isRunning) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    // 1. Dibujar imagen de fondo (video o gradiente simulado)
    if (!this.simulatedMode && this.video.readyState >= 2) {
      ctx.save();
      // Efecto espejo horizontal para que actúe como un espejo natural
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.video, 0, 0, w, h);
      ctx.restore();
    } else {
      // Modo simulación: fondo de estudio oscuro con textura
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, w, h);
      const grad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, w * 0.7);
      grad.addColorStop(0, 'rgba(255, 120, 50, 0.08)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Obtener landmarks
    let landmarks = null;
    if (!this.simulatedMode && handLandmarker && this.video.readyState >= 2) {
      const results = handLandmarker.detectForVideo(this.video, performance.now());
      if (results.landmarks && results.landmarks.length > 0) {
        // En espejo, invertimos X de los landmarks para que coincida con el dibujo reflejado
        landmarks = results.landmarks[0].map((lm) => ({
          x: 1 - lm.x,
          y: lm.y,
          z: lm.z,
        }));
      }
    } else if (this.simulatedMode && this.currentChord) {
      // Mano simulada que se mueve suavemente hacia las notas del acorde
      this.simulatedAngle += 0.035;
      landmarks = this.generateSimulatedHand(w, h);
    }

    // 3. Dibujar el diapasón virtual (mástil guía)
    this.drawVirtualFretboard(ctx, w, h);

    // 4. Evaluar posiciones contra el acorde activo
    let evalResult = null;
    if (this.currentChord) {
      evalResult = evaluateChordPlacement(landmarks, this.currentChord, this.fretboard, w, h);
      this.drawChordTargetsAndFeedback(ctx, evalResult, w, h);

      // Notificar a la interfaz
      this.onEvaluation(evalResult);

      // 5. Manejo del éxito sostenido
      if (evalResult.isComplete) {
        if (!this.successStart) this.successStart = performance.now();
        const elapsed = performance.now() - this.successStart;
        const progress = Math.min(1, elapsed / this.holdDuration);

        // Dibujar indicador circular de retención exitosa
        this.drawHoldRing(ctx, w, h, progress);

        if (elapsed >= this.holdDuration && !this.hasTriggeredSuccess) {
          this.hasTriggeredSuccess = true;
          chime(true);
          strum(this.currentChord, { gain: 0.65 });
          recordCameraValidation(this.currentChord.id, evalResult.score);
          this.onSuccess(this.currentChord, evalResult);
        }
      } else {
        this.successStart = null;
        this.hasTriggeredSuccess = false;
      }
    }

    // 6. Dibujar esqueleto de la mano si se detectó
    if (landmarks) {
      this.drawHandLandmarks(ctx, landmarks, w, h);
    }

    this.animId = requestAnimationFrame(() => this.loop());
  }

  // Generador de mano simulada para pruebas
  generateSimulatedHand(w, h) {
    const fb = this.fretboard;
    const req = fretPositions(this.currentChord);
    const time = this.simulatedAngle;
    const wobble = Math.sin(time) * 14;

    // Crear 21 landmarks aproximados
    const lms = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));

    // Muñeca en la base del mástil
    const wristX = fb.x + fb.w * 0.4;
    const wristY = fb.y + fb.h * 1.15 + (Math.cos(time * 0.5) * 8) / h;
    lms[0] = { x: wristX, y: wristY, z: 0 };

    // Posicionar puntas de los dedos cerca de sus objetivos
    req.forEach((p) => {
      const tipIdx = FINGER_TIPS[p.finger];
      if (tipIdx) {
        const target = fb.getTargetPos(p.string, p.fret, w, h);
        // Llegan a la posición correcta cuando sin(time) > 0.1
        const reach = Math.max(0, Math.sin(time * 0.8));
        const tx = (target.x + (1 - reach) * wobble * 3) / w;
        const ty = (target.y + (1 - reach) * wobble * 3) / h;
        lms[tipIdx] = { x: tx, y: ty, z: 0 };

        // Nudillos intermedios
        const pipIdx = FINGER_PIPS[p.finger];
        lms[pipIdx] = { x: (tx + wristX) / 2, y: (ty + wristY) / 2, z: 0 };
      }
    });

    return lms;
  }

  // Dibuja el mástil de guitarra superpuesto con estilo Cyber/Studio
  drawVirtualFretboard(ctx, w, h) {
    const fb = this.fretboard;
    const x = fb.x * w;
    const y = fb.y * h;
    const bw = fb.w * w;
    const bh = fb.h * h;

    ctx.save();

    // Fondo del diapasón (madera oscura translúcida)
    ctx.fillStyle = 'rgba(18, 16, 22, 0.72)';
    ctx.strokeStyle = 'rgba(255, 179, 71, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y - 10, bw, bh + 20, 16);
    ctx.fill();
    ctx.stroke();

    // Cejuela (Nut) a la izquierda
    ctx.fillStyle = '#f5efe6';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 8;
    ctx.fillRect(x - 6, y - 10, 8, bh + 20);
    ctx.shadowBlur = 0;

    // Trastes (barritas verticales)
    const fretW = bw / fb.numFrets;
    for (let f = 1; f <= fb.numFrets; f++) {
      const fx = x + f * fretW;
      ctx.strokeStyle = 'rgba(230, 230, 240, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fx, y - 8);
      ctx.lineTo(fx, y + bh + 8);
      ctx.stroke();

      // Número del traste abajo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = 'bold 13px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Traste ${f}`, fx - fretW / 2, y + bh + 32);
    }

    // Puntos marcadores tradicionales en traste 3 y 5
    const dotFrets = [3, 5];
    dotFrets.forEach((df) => {
      if (df <= fb.numFrets) {
        const dotX = x + (df - 0.5) * fretW;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.beginPath();
        ctx.arc(dotX, y + bh / 2, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Cuerdas (líneas horizontales de la 6ª arriba a la 1ª abajo)
    const stringNames = ['6 (Mi)', '5 (La)', '4 (Re)', '3 (Sol)', '2 (Si)', '1 (Mi)'];
    const stringGauges = [4.2, 3.4, 2.8, 2.2, 1.6, 1.2];

    for (let s = 0; s < 6; s++) {
      const sy = y + (s / 5) * bh;
      ctx.strokeStyle = '#c5ccd8';
      ctx.lineWidth = stringGauges[s];
      ctx.beginPath();
      ctx.moveTo(x - 4, sy);
      ctx.lineTo(x + bw + 4, sy);
      ctx.stroke();

      // Nombre de la cuerda a la izquierda
      ctx.fillStyle = 'rgba(255, 179, 71, 0.85)';
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(stringNames[s], x - 14, sy + 4);
    }

    ctx.restore();
  }

  // Dibuja los objetivos del acorde y las conexiones con las yemas
  drawChordTargetsAndFeedback(ctx, evalResult, w, h) {
    if (!evalResult || !evalResult.details) return;

    ctx.save();

    evalResult.details.forEach((det) => {
      const { targetPos, tipPos, status, finger, score } = det;

      // 1. Círculo objetivo en el mástil
      ctx.lineWidth = 3;
      if (status === 'ok') {
        ctx.strokeStyle = '#28c76f';
        ctx.fillStyle = 'rgba(40, 199, 111, 0.3)';
        ctx.shadowColor = '#28c76f';
        ctx.shadowBlur = 18;
      } else {
        ctx.strokeStyle = '#ff9f43';
        ctx.fillStyle = 'rgba(255, 159, 67, 0.2)';
        ctx.shadowColor = '#ff9f43';
        ctx.shadowBlur = 12;
      }

      ctx.beginPath();
      ctx.arc(targetPos.x, targetPos.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Número del dedo en el objetivo
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`D${finger}`, targetPos.x, targetPos.y);

      // 2. Si detectamos la yema, trazar línea guía y halo
      if (tipPos) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = status === 'ok' ? 'rgba(40, 199, 111, 0.7)' : 'rgba(255, 77, 79, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tipPos.x, tipPos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Halo en la yema
        ctx.fillStyle = status === 'ok' ? 'rgba(40, 199, 111, 0.55)' : 'rgba(255, 77, 79, 0.55)';
        ctx.beginPath();
        ctx.arc(tipPos.x, tipPos.y, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  // Dibuja el esqueleto de la mano (landmarks MediaPipe)
  drawHandLandmarks(ctx, landmarks, w, h) {
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
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    });

    // Puntos
    landmarks.forEach((p, idx) => {
      const isTip = [4, 8, 12, 16, 20].includes(idx);
      ctx.fillStyle = isTip ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, isTip ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // Anillo de progreso al mantener la posición correcta
  drawHoldRing(ctx, w, h, progress) {
    ctx.save();
    const cx = w / 2;
    const cy = h / 2;
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
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(progress * 100)}%`, cx, cy);

    ctx.restore();
  }
}
