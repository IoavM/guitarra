// Biblioteca de acordes.
// frets: de la cuerda 6 (Mi grave) a la 1 (Mi agudo). -1 = no se toca, 0 = al aire.
// fingers: 0 = sin dedo, 1 índice, 2 medio, 3 anular, 4 meñique.
// barre: { fret, from, to } cuerdas (6..1) cubiertas por el índice.

export const CHORD_GROUPS = [
  { id: 'primeros', name: 'Primeros acordes', level: 1 },
  { id: 'abiertos', name: 'Acordes abiertos esenciales', level: 2 },
  { id: 'septima', name: 'Séptimas y color', level: 3 },
  { id: 'cejilla', name: 'Con cejilla', level: 4 },
  { id: 'quintas', name: 'Power chords (quintas)', level: 4 },
];

export const CHORDS = [
  // ---------- Nivel 1 ----------
  { id: 'Em', symbol: 'Em', name: 'Mi menor', group: 'primeros', level: 1, frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0],
    tip: 'El acorde más fácil: solo dos dedos y suenan las 6 cuerdas. Ideal para tu primer día.' },
  { id: 'E', symbol: 'E', name: 'Mi mayor', group: 'primeros', level: 1, frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0],
    tip: 'Es Mi menor + el índice en el traste 1 de la 3ª cuerda. Fíjate cómo cambia de "triste" a "alegre".' },
  { id: 'Am', symbol: 'Am', name: 'La menor', group: 'primeros', level: 1, frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0],
    tip: 'Misma forma que Mi mayor pero una cuerda más abajo. No toques la 6ª cuerda.' },
  { id: 'A', symbol: 'A', name: 'La mayor', group: 'primeros', level: 1, frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0],
    tip: 'Tres dedos en fila en el traste 2. Arquea bien los dedos para que la 1ª cuerda suene.' },
  { id: 'D', symbol: 'D', name: 'Re mayor', group: 'primeros', level: 1, frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2],
    tip: 'Forma de triángulo. Rasguea solo desde la 4ª cuerda (Re) hacia abajo.' },
  { id: 'Dm', symbol: 'Dm', name: 'Re menor', group: 'primeros', level: 1, frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1],
    tip: 'Como Re mayor pero la 1ª cuerda baja al traste 1. Suena melancólico.' },

  // ---------- Nivel 2 ----------
  { id: 'C', symbol: 'C', name: 'Do mayor', group: 'abiertos', level: 2, frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0],
    tip: 'Dedos en escalera: 3-2-1. Cuida que la 3ª y la 1ª cuerda suenen al aire (no las toques con la palma de los dedos).' },
  { id: 'G', symbol: 'G', name: 'Sol mayor', group: 'abiertos', level: 2, frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3],
    tip: 'Suena enorme porque usa las 6 cuerdas. Variante: 3-2-0-0-3-3 con anular y meñique.' },
  { id: 'Em7', symbol: 'Em7', name: 'Mi menor séptima', group: 'abiertos', level: 2, frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0],
    tip: '¡Un solo dedo! Muy usado en Wonderwall y canciones acústicas.' },
  { id: 'Am7', symbol: 'Am7', name: 'La menor séptima', group: 'abiertos', level: 2, frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0],
    tip: 'La menor quitando el anular. Sonido suave y jazzero.' },
  { id: 'Cmaj7', symbol: 'Cmaj7', name: 'Do séptima mayor', group: 'abiertos', level: 2, frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0],
    tip: 'Do mayor levantando el índice. Sonido soñador.' },
  { id: 'Fmaj7', symbol: 'Fmaj7', name: 'Fa séptima mayor (Fa fácil)', group: 'abiertos', level: 2, frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0],
    tip: 'La forma más fácil de sustituir el Fa con cejilla mientras ganas fuerza.' },
  { id: 'Asus2', symbol: 'Asus2', name: 'La sus2', group: 'abiertos', level: 2, frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0],
    tip: 'Ni mayor ni menor: sonido abierto y moderno.' },
  { id: 'Dsus4', symbol: 'Dsus4', name: 'Re sus4', group: 'abiertos', level: 2, frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 3, 4],
    tip: 'Alterna Re ↔ Re sus4 moviendo un solo dedo para adornar tus rasgueos.' },
  { id: 'Dsus2', symbol: 'Dsus2', name: 'Re sus2', group: 'abiertos', level: 2, frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0],
    tip: 'Re mayor quitando el medio. Muy bonito en arpegios.' },

  // ---------- Nivel 3 ----------
  { id: 'E7', symbol: 'E7', name: 'Mi séptima', group: 'septima', level: 3, frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0],
    tip: 'Sonido de blues. Es Mi mayor quitando el anular.' },
  { id: 'A7', symbol: 'A7', name: 'La séptima', group: 'septima', level: 3, frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0],
    tip: 'La 3ª cuerda queda al aire. Perfecto para blues en La.' },
  { id: 'D7', symbol: 'D7', name: 'Re séptima', group: 'septima', level: 3, frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3],
    tip: 'Un triángulo invertido respecto a Re mayor. Lleva tensión hacia Sol.' },
  { id: 'G7', symbol: 'G7', name: 'Sol séptima', group: 'septima', level: 3, frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1],
    tip: 'Pide resolver a Do mayor. Escucha la tensión y la relajación.' },
  { id: 'C7', symbol: 'C7', name: 'Do séptima', group: 'septima', level: 3, frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0],
    tip: 'Do mayor + meñique en el traste 3 de la 3ª cuerda.' },
  { id: 'B7', symbol: 'B7', name: 'Si séptima', group: 'septima', level: 3, frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4],
    tip: 'Usa los 4 dedos. Clave para tocar en Mi menor (Em - B7).' },

  // ---------- Nivel 4: cejilla ----------
  { id: 'F', symbol: 'F', name: 'Fa mayor', group: 'cejilla', level: 4, frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 1, from: 6, to: 1 },
    tip: 'El "jefe final" del principiante. Índice de lado, pegado al traste, y usa el peso del brazo, no solo el pulgar.' },
  { id: 'Bm', symbol: 'Bm', name: 'Si menor', group: 'cejilla', level: 4, frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 2, from: 5, to: 1 },
    tip: 'Cejilla en traste 2 desde la 5ª cuerda. Es La menor desplazado y con cejilla.' },
  { id: 'B', symbol: 'B', name: 'Si mayor', group: 'cejilla', level: 4, frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], barre: { fret: 2, from: 5, to: 1 },
    tip: 'Forma de La mayor con cejilla en el traste 2.' },
  { id: 'Fm', symbol: 'Fm', name: 'Fa menor', group: 'cejilla', level: 4, frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 1, from: 6, to: 1 },
    tip: 'Fa mayor quitando el dedo medio: la cejilla hace todo el trabajo.' },
  { id: 'Gm', symbol: 'Gm', name: 'Sol menor', group: 'cejilla', level: 4, frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 3, from: 6, to: 1 }, baseFret: 3,
    tip: 'Forma de Mi menor con cejilla en el traste 3. ¡Muévela para tocar cualquier acorde menor!' },
  { id: 'Cm', symbol: 'Cm', name: 'Do menor', group: 'cejilla', level: 4, frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 3, from: 5, to: 1 }, baseFret: 3,
    tip: 'Forma de La menor con cejilla en el traste 3.' },

  // ---------- Nivel 4: quintas ----------
  { id: 'E5', symbol: 'E5', name: 'Mi quinta', group: 'quintas', level: 4, frets: [0, 2, 2, -1, -1, -1], fingers: [0, 1, 2, 0, 0, 0],
    tip: 'Power chord con cuerda al aire. Base del rock.' },
  { id: 'A5', symbol: 'A5', name: 'La quinta', group: 'quintas', level: 4, frets: [-1, 0, 2, 2, -1, -1], fingers: [0, 0, 1, 2, 0, 0],
    tip: 'Silencia las cuerdas agudas con la palma o los dedos.' },
  { id: 'G5', symbol: 'G5', name: 'Sol quinta', group: 'quintas', level: 4, frets: [3, 5, 5, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], baseFret: 3,
    tip: 'Forma móvil: índice en la 6ª cuerda y anular + meñique dos trastes más arriba.' },
  { id: 'C5', symbol: 'C5', name: 'Do quinta', group: 'quintas', level: 4, frets: [-1, 3, 5, 5, -1, -1], fingers: [0, 1, 3, 4, 0, 0], baseFret: 3,
    tip: 'La misma forma, ahora con la fundamental en la 5ª cuerda.' },
  { id: 'D5', symbol: 'D5', name: 'Re quinta', group: 'quintas', level: 4, frets: [-1, 5, 7, 7, -1, -1], fingers: [0, 1, 3, 4, 0, 0], baseFret: 5,
    tip: 'Desliza la forma de C5 dos trastes hacia el cuerpo.' },
];

// Formas especiales usadas en canciones (no aparecen en la biblioteca principal)
export const EXTRA_CHORDS = [
  { id: 'A7sus4', symbol: 'A7sus4', name: 'La 7 sus4', level: 2, frets: [-1, 0, 2, 0, 3, 0], fingers: [0, 0, 2, 0, 3, 0] },
  { id: 'D6add9', symbol: 'D6/9', name: 'Re 6/9 (sobre Fa#)', level: 1, frets: [2, -1, 0, 2, 0, 0], fingers: [1, 0, 0, 2, 0, 0] },
  { id: 'D/F#', symbol: 'D/F#', name: 'Re con bajo en Fa#', level: 3, frets: [2, -1, 0, 2, 3, 2], fingers: [1, 0, 0, 2, 4, 3] },
  { id: 'Cadd9', symbol: 'Cadd9', name: 'Do add9', level: 2, frets: [-1, 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0] },
  { id: 'F#', symbol: 'F#', name: 'Fa# mayor', level: 4, frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 2, from: 6, to: 1 } },
  { id: 'Bb5', symbol: 'Bb5', name: 'Sib quinta', level: 4, frets: [-1, 1, 3, 3, -1, -1], fingers: [0, 1, 3, 4, 0, 0] },
  { id: 'F5', symbol: 'F5', name: 'Fa quinta', level: 4, frets: [1, 3, 3, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0] },
  { id: 'Ab5', symbol: 'Ab5', name: 'Lab quinta', level: 4, frets: [4, 6, 6, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], baseFret: 4 },
  { id: 'Db5', symbol: 'Db5', name: 'Reb quinta', level: 4, frets: [-1, 4, 6, 6, -1, -1], fingers: [0, 1, 3, 4, 0, 0], baseFret: 4 },
  { id: 'F#m', symbol: 'F#m', name: 'Fa sostenido menor', level: 4, frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 2, from: 6, to: 1 }, baseFret: 2, tip: 'Clave en La Camisa Negra de Juanes. Forma de Em con cejilla en traste 2.' },
  { id: 'C#7', symbol: 'C#7', name: 'Do sostenido séptima', level: 3, frets: [-1, 4, 3, 4, 2, -1], fingers: [0, 3, 2, 4, 1, 0], baseFret: 2, tip: 'Tensión dominante para canciones en F#m como Juanes.' },
  { id: 'C#m', symbol: 'C#m', name: 'Do sostenido menor', level: 4, frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 4, from: 5, to: 1 }, baseFret: 4, tip: 'Cejilla en traste 4 con forma de Am. Clave en Sucker de Jonas Brothers.' },
  { id: 'G#m', symbol: 'G#m', name: 'Sol sostenido menor', level: 4, frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 4, from: 6, to: 1 }, baseFret: 4, tip: 'Forma de Em con cejilla en traste 4.' },
  { id: 'Bm7', symbol: 'Bm7', name: 'Si menor 7', level: 3, frets: [-1, 2, 0, 2, 0, 2], fingers: [0, 1, 0, 2, 0, 3] },
];

const ALL = [...CHORDS, ...EXTRA_CHORDS];
const BY_ID = Object.fromEntries(ALL.map((c) => [c.id, c]));

export function getChord(id) {
  return BY_ID[id] || null;
}

export function chordsByGroup(group) {
  return CHORDS.filter((c) => c.group === group);
}

/** Posiciones que deben pisarse (excluye las que cubre la cejilla con el índice). */
export function fretPositions(chord) {
  const out = [];
  chord.frets.forEach((f, i) => {
    if (f > 0) {
      const string = 6 - i;
      const finger = chord.fingers[i] || 0;
      const barreCovered = chord.barre && finger === 1 && f === chord.barre.fret;
      out.push({ string, fret: f, finger, barreCovered });
    }
  });
  return out;
}
