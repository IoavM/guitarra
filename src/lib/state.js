// Sistema de persistencia y gamificación (XP, lecciones completadas, acordes dominados, racha)

const STORAGE_KEY = 'traste_guitar_state_v1';

const DEFAULT_STATE = {
  xp: 0,
  streak: 1,
  lastActive: new Date().toISOString().slice(0, 10),
  completedLessons: ['partes-y-postura'], // primera lección desbloqueada/avanzada para dar bienvenida
  masteredChords: [],
  selectedGuitar: 'acoustic-steel',
  favoriteSongs: ['stand-by-me'],
  quizScores: {},
  cameraStats: {
    validations: 0,
    bestAccuracy: 0,
  },
  cameraConfig: {
    mirror: true,
    showSkeleton: true,
    showVirtualNeck: true,
    sensitivity: 'normal', // 'relaxed', 'normal', 'strict'
    // Cuadro del mástil calibrado en coordenadas relativas (0..1)
    neckBox: { x: 0.15, y: 0.20, w: 0.70, h: 0.60, angle: 0 },
    handPreference: 'left', // mano que pisa los acordes (mano izquierda para diestros)
  }
};

let current = null;
const listeners = new Set();

export function getState() {
  if (!current) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      current = raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };
    } catch {
      current = { ...DEFAULT_STATE };
    }
    updateStreak();
  }
  return current;
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Error saving state:', err);
  }
  notify();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => {
    try { fn(current); } catch (e) { console.error(e); }
  });
}

function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  if (current.lastActive !== today) {
    const last = new Date(current.lastActive);
    const diff = Math.round((new Date(today) - last) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      current.streak = (current.streak || 0) + 1;
    } else if (diff > 1) {
      current.streak = 1;
    }
    current.lastActive = today;
    save();
  }
}

export function addXp(amount, reason = '') {
  getState();
  current.xp = (current.xp || 0) + amount;
  save();
  return current.xp;
}

export function markLessonCompleted(id) {
  getState();
  if (!current.completedLessons.includes(id)) {
    current.completedLessons.push(id);
    addXp(50, `Lección ${id} completada`);
  }
}

export function isLessonCompleted(id) {
  return getState().completedLessons.includes(id);
}

export function markChordMastered(id) {
  getState();
  if (!current.masteredChords.includes(id)) {
    current.masteredChords.push(id);
    addXp(30, `Acorde ${id} dominado con IA`);
  }
}

export function isChordMastered(id) {
  return getState().masteredChords.includes(id);
}

export function recordCameraValidation(chordId, accuracy) {
  getState();
  current.cameraStats.validations = (current.cameraStats.validations || 0) + 1;
  current.cameraStats.bestAccuracy = Math.max(current.cameraStats.bestAccuracy || 0, accuracy);
  markChordMastered(chordId);
  save();
}

export function saveCameraConfig(patch) {
  getState();
  current.cameraConfig = { ...current.cameraConfig, ...patch };
  save();
}

export function getSelectedGuitar() {
  return getState().selectedGuitar || 'acoustic-steel';
}

export function setSelectedGuitar(id) {
  getState();
  current.selectedGuitar = id;
  save();
}

export function getUserLevel() {
  const xp = getState().xp || 0;
  if (xp < 100) return { level: 1, title: 'Principiante entusiasta', nextXp: 100, progress: xp / 100 };
  if (xp < 300) return { level: 2, title: 'Rasgueador de acordes', nextXp: 300, progress: (xp - 100) / 200 };
  if (xp < 600) return { level: 3, title: 'Músico de fogata', nextXp: 600, progress: (xp - 300) / 300 };
  if (xp < 1000) return { level: 4, title: 'Guitarrista en ascenso', nextXp: 1000, progress: (xp - 600) / 400 };
  return { level: 5, title: 'Maestro del diapasón', nextXp: xp, progress: 1 };
}
