// Utilidades de teoría musical
export const NOTES_EN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTES_ES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

// Cuerdas al aire, de la 6ª (más gruesa) a la 1ª (más fina): E2 A2 D3 G3 B3 E4
export const OPEN_MIDI = [40, 45, 50, 55, 59, 64];
export const STRING_NAMES = ['Mi', 'La', 'Re', 'Sol', 'Si', 'Mi'];
export const STRING_NAMES_EN = ['E', 'A', 'D', 'G', 'B', 'e'];

export const FINGER_NAMES = { 1: 'Índice', 2: 'Medio', 3: 'Anular', 4: 'Meñique', T: 'Pulgar' };

export const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
export const freqToMidi = (f) => 69 + 12 * Math.log2(f / 440);
export const pc = (m) => ((Math.round(m) % 12) + 12) % 12;

export function noteName(midi, lang = 'es') {
  const n = pc(midi);
  return lang === 'es' ? NOTES_ES[n] : NOTES_EN[n];
}

export function noteWithOctave(midi) {
  const m = Math.round(midi);
  return NOTES_EN[pc(m)] + (Math.floor(m / 12) - 1);
}

/** MIDI de cada cuerda para un acorde (null si la cuerda no suena). Índice 0 = cuerda 6. */
export function chordMidis(chord) {
  return chord.frets.map((f, i) => (f === null || f < 0 ? null : OPEN_MIDI[i] + f));
}

/** Clases de altura (0-11) que forman el acorde */
export function chordPitchClasses(chord) {
  const set = new Set();
  chordMidis(chord).forEach((m) => m !== null && set.add(pc(m)));
  return [...set];
}

/** Número de cuerda humano (6..1) a índice (0..5) y viceversa */
export const stringToIdx = (s) => 6 - s;
export const idxToString = (i) => 6 - i;

export const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
export const MINOR_PENTA = [0, 3, 5, 7, 10];
export const MAJOR_PENTA = [0, 2, 4, 7, 9];
export const BLUES = [0, 3, 5, 6, 7, 10];

export function diatonicChords(rootPc) {
  const qualities = ['', 'm', 'm', '', '', 'm', 'dim'];
  const roman = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
  return MAJOR_SCALE.map((iv, i) => {
    const p = (rootPc + iv) % 12;
    return { degree: roman[i], en: NOTES_EN[p] + qualities[i], es: NOTES_ES[p] + (qualities[i] === 'm' ? 'm' : qualities[i] === 'dim' ? '°' : '') };
  });
}
