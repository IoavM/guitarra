// Componente SVG interactivo para visualizar y hacer sonar cualquier acorde de guitarra.
import { pluck, strum } from '../audio/guitar.js';
import { OPEN_MIDI, STRING_NAMES_EN } from '../lib/music.js';

export function renderChordSvg(chord, { width = 180, interactive = true, showFingers = true } = {}) {
  const numFrets = 4;
  const baseFret = chord.baseFret || 1;
  const showNut = baseFret === 1;

  // Geometría del SVG
  const padX = 26;
  const padTop = 38;
  const padBottom = 22;
  const w = 150;
  const h = 175;
  const stringSpacing = (w - padX * 2) / 5;
  const fretSpacing = (h - padTop - padBottom) / numFrets;

  const sx = (i) => padX + i * stringSpacing; // i: 0 (6ª cuerda) .. 5 (1ª cuerda)
  const fy = (f) => padTop + (f - baseFret + 0.5) * fretSpacing;

  let strMarkers = '';
  let dots = '';
  let barreSvg = '';

  // 1. Cuerdas silenciadas (X) y al aire (O) en la parte superior
  chord.frets.forEach((f, i) => {
    const x = sx(i);
    const y = padTop - 12;
    if (f === -1 || f === null) {
      strMarkers += `
        <g class="cd-marker-x">
          <line x1="${x - 5}" y1="${y - 5}" x2="${x + 5}" y2="${y + 5}" class="cd-mute" />
          <line x1="${x + 5}" y1="${y - 5}" x2="${x - 5}" y2="${y + 5}" class="cd-mute" />
        </g>`;
    } else if (f === 0) {
      strMarkers += `<circle cx="${x}" cy="${y}" r="4.5" class="cd-open" />`;
    }
  });

  // 2. Cejilla (barre) si existe
  if (chord.barre) {
    const bFret = chord.barre.fret;
    if (bFret >= baseFret && bFret < baseFret + numFrets) {
      const x1 = sx(6 - chord.barre.from);
      const x2 = sx(6 - chord.barre.to);
      const y = fy(bFret);
      barreSvg = `
        <rect x="${Math.min(x1, x2) - 8}" y="${y - 8}" width="${Math.abs(x2 - x1) + 16}" height="16" rx="8"
          fill="url(#cdGrad)" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.5))" />
        <text x="${(x1 + x2) / 2}" y="${y + 4}" text-anchor="middle" class="cd-num" font-size="10">1</text>
      `;
    }
  }

  // 3. Puntos de digitación (dedos)
  chord.frets.forEach((f, i) => {
    if (f > 0) {
      const relFret = f - baseFret + 1;
      if (relFret >= 1 && relFret <= numFrets) {
        const finger = chord.fingers[i] || '';
        // Si hay cejilla y este dedo es el 1 en el traste de cejilla, la barra ya lo dibuja
        const isCoveredByBarre = chord.barre && finger === 1 && f === chord.barre.fret;
        if (!isCoveredByBarre) {
          const x = sx(i);
          const y = fy(f);
          dots += `
            <g class="cd-dot-group">
              <circle cx="${x}" cy="${y}" r="8" class="cd-dot" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.4))" />
              ${showFingers && finger ? `<text x="${x}" y="${y + 3.8}" text-anchor="middle" class="cd-num" font-size="10.5">${finger}</text>` : ''}
            </g>`;
        }
      }
    }
  });

  // 4. Líneas de trastes
  let fretsSvg = '';
  for (let f = 0; f <= numFrets; f++) {
    const y = padTop + f * fretSpacing;
    const isNut = f === 0 && showNut;
    fretsSvg += `<line x1="${padX}" y1="${y}" x2="${w - padX}" y2="${y}" class="${isNut ? 'cd-nut' : 'cd-fret'}" stroke-width="${isNut ? 4.5 : 1.2}" />`;
  }

  // 5. Líneas de cuerdas (calibre visual de grueso a fino)
  let stringsSvg = '';
  let hitAreas = '';
  const gauges = [2.2, 1.8, 1.5, 1.2, 0.9, 0.7];
  for (let i = 0; i < 6; i++) {
    const x = sx(i);
    const y1 = padTop;
    const y2 = padTop + numFrets * fretSpacing;
    stringsSvg += `<line id="str-${chord.id}-${i}" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" class="cd-string" stroke-width="${gauges[i]}" />`;

    // Áreas clicables transparentes para tocar cuerda por cuerda
    if (interactive) {
      const f = chord.frets[i];
      const midi = f === -1 || f === null ? null : OPEN_MIDI[i] + f;
      hitAreas += `
        <rect class="cd-hit" x="${x - 10}" y="${padTop - 18}" width="20" height="${y2 - padTop + 32}" data-str="${i}" data-midi="${midi || ''}">
          <title>${STRING_NAMES_EN[i]} (${f === -1 ? 'silenciada' : f === 0 ? 'al aire' : 'traste ' + f})</title>
        </rect>`;
    }
  }

  // 6. Nombres de las cuerdas en la base
  let stringLabels = '';
  STRING_NAMES_EN.forEach((name, i) => {
    stringLabels += `<text x="${sx(i)}" y="${padTop + numFrets * fretSpacing + 14}" text-anchor="middle" class="cd-strname">${name}</text>`;
  });

  // 7. Indicador de traste inicial si no es traste 1
  const baseLabel = !showNut ? `<text x="${padX - 8}" y="${padTop + fretSpacing * 0.65}" text-anchor="end" class="cd-base">${baseFret}fr</text>` : '';

  return `
    <svg class="chord-diagram" viewBox="0 0 ${w} ${h}" style="max-width: ${width}px;" data-chord="${chord.id}">
      <defs>
        <linearGradient id="cdGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffb347" />
          <stop offset="100%" stop-color="#ff5e3a" />
        </linearGradient>
      </defs>
      ${fretsSvg}
      ${stringsSvg}
      ${barreSvg}
      ${dots}
      ${strMarkers}
      ${stringLabels}
      ${baseLabel}
      ${hitAreas}
    </svg>
  `;
}

/** Adjunta interactividad de sonido al hacer clic en las cuerdas del SVG o en el botón de rasgueo */
export function bindChordDiagram(container, chord) {
  if (!container) return;
  const svg = container.querySelector(`svg[data-chord="${chord.id}"]`) || container;
  svg.querySelectorAll('.cd-hit').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const midi = el.dataset.midi;
      const strIdx = parseInt(el.dataset.str, 10);
      if (midi) {
        pluck(parseInt(midi, 10), 0, { gain: 0.6 });
        const line = svg.querySelector(`#str-${chord.id}-${strIdx}`);
        if (line) {
          line.classList.remove('ringing');
          void line.offsetWidth;
          line.classList.add('ringing');
        }
      }
    });
  });
}
