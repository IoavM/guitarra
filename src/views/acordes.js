// Vista de Biblioteca de Acordes: Buscador, filtros por categoría, diagramas interactivos y modal explicativo.
import { CHORDS, CHORD_GROUPS, getChord } from '../data/chords.js';
import { renderChordSvg, bindChordDiagram } from '../components/chordDiagram.js';
import { strum, arpeggio } from '../audio/guitar.js';
import { isChordMastered } from '../lib/state.js';
import { chordPitchClasses, NOTES_ES } from '../lib/music.js';

export function renderAcordes(container) {
  let activeFilter = 'all';
  let searchTerm = '';

  function renderList() {
    let filtered = CHORDS;

    if (activeFilter !== 'all') {
      filtered = filtered.filter((c) => c.group === activeFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((c) =>
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }

    const grid = container.querySelector('#chords-catalog-grid');
    if (!grid) return;

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty" style="grid-column: 1 / -1;">
          <h3>No se encontraron acordes</h3>
          <p class="muted">Intenta buscar con otro término o selecciona "Todos".</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map((chord) => {
      const mastered = isChordMastered(chord.id);
      return `
        <div class="card chord-card hover" data-id="${chord.id}">
          <div class="row between" style="width: 100%;">
            <div class="cc-name">${chord.symbol}</div>
            ${mastered ? '<span class="chip success sm">✓ IA</span>' : `<span class="chip sm">Nivel ${chord.level}</span>`}
          </div>
          <div class="cc-es">${chord.name}</div>
          <div class="chord-diag-wrap" style="width: 100%; display: flex; justify-content: center; margin: 4px 0;">
            ${renderChordSvg(chord, { width: 140 })}
          </div>
          <div class="row" style="margin-top: auto; padding-top: 8px; gap: 6px; width: 100%; justify-content: center;">
            <button class="btn sm strum-btn" data-id="${chord.id}">▶ Rasguear</button>
            <button class="btn sm ghost detail-btn" data-id="${chord.id}">Info</button>
            <a href="#/camara?chord=${chord.id}" class="btn sm primary" title="Probar con la cámara">◉ IA</a>
          </div>
        </div>
      `;
    }).join('');

    // Bindear interactividad de cuerdas y botones
    filtered.forEach((chord) => {
      const card = grid.querySelector(`.chord-card[data-id="${chord.id}"]`);
      if (card) {
        bindChordDiagram(card, chord);

        card.querySelector('.strum-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          strum(chord, { dir: 'D', gain: 0.55 });
        });

        card.querySelector('.detail-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          openChordModal(chord);
        });

        card.addEventListener('click', (e) => {
          if (!e.target.closest('button') && !e.target.closest('a')) {
            openChordModal(chord);
          }
        });
      }
    });
  }

  container.innerHTML = `
    <div class="view-enter">
      <div class="page-head">
        <div>
          <span class="eyebrow"><span class="ico">▦</span> Diccionario sonoro</span>
          <h1>Biblioteca de acordes <span class="grad-text">interactiva</span></h1>
          <p>
            Explora más de 25 acordes esenciales ordenados por nivel de dificultad. Haz clic en las cuerdas para pulsarlas individualmente,
            escucha el rasgueo completo o pon a prueba tu postura en la Cámara IA.
          </p>
        </div>
      </div>

      <!-- BUSCADOR Y FILTROS -->
      <div class="card" style="padding: 16px 20px; margin-bottom: 24px;">
        <div class="row between" style="gap: 16px;">
          <div class="seg" id="chord-filter-seg">
            <button class="active" data-group="all">Todos (${CHORDS.length})</button>
            ${CHORD_GROUPS.map((g) => `
              <button data-group="${g.id}">${g.name}</button>
            `).join('')}
          </div>

          <div style="flex: 1; max-width: 320px;">
            <input
              type="search"
              id="chord-search-input"
              placeholder="Buscar acorde (ej. Sol, C, menor, Fa...)"
              style="width: 100%;"
            />
          </div>
        </div>
      </div>

      <!-- GRID DE ACORDES -->
      <div class="grid grid-auto" id="chords-catalog-grid"></div>

      <!-- CONTENEDOR DEL MODAL -->
      <div id="chord-modal-root"></div>
    </div>
  `;

  // Listeners de filtros
  const filterBtns = container.querySelectorAll('#chord-filter-seg button');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.group;
      renderList();
    });
  });

  // Listener de búsqueda
  const searchInput = container.querySelector('#chord-search-input');
  searchInput?.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    renderList();
  });

  // Modal detallado del acorde
  function openChordModal(chord) {
    const modalRoot = container.querySelector('#chord-modal-root');
    const pcs = chordPitchClasses(chord);
    const notesStr = pcs.map((p) => NOTES_ES[p]).join(' · ');

    modalRoot.innerHTML = `
      <div class="chord-modal-back" id="chord-modal-backdrop">
        <div class="card chord-modal" onclick="event.stopPropagation()">
          <div class="row between" style="margin-bottom: 20px;">
            <div>
              <span class="eyebrow">Detalles del acorde</span>
              <h2 style="font-size: 2rem;">${chord.symbol} <span class="muted" style="font-size: 1.3rem;">(${chord.name})</span></h2>
            </div>
            <button class="btn sm ghost" id="close-modal-btn">✕ Cerrar</button>
          </div>

          <div class="cm-grid">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--surface-2); padding: 20px; border-radius: 16px;">
              <div id="modal-diag-wrap">
                ${renderChordSvg(chord, { width: 180 })}
              </div>
              <div class="row" style="margin-top: 16px; gap: 8px;">
                <button class="btn sm primary" id="modal-strum-btn">▶ Rasgueo</button>
                <button class="btn sm ghost" id="modal-arp-btn">♫ Arpegio lento</button>
              </div>
            </div>

            <div class="stack" style="gap: 16px;">
              <div>
                <b class="small muted" style="text-transform: uppercase; letter-spacing: 0.1em;">Notas que lo componen:</b>
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--primary); margin-top: 4px;">${notesStr}</div>
              </div>

              <div>
                <b class="small muted" style="text-transform: uppercase; letter-spacing: 0.1em;">Consejo del profesor:</b>
                <p style="margin-top: 6px; line-height: 1.45; color: var(--text-2);">${chord.tip}</p>
              </div>

              <div>
                <b class="small muted" style="text-transform: uppercase; letter-spacing: 0.1em;">Nivel recomendado:</b>
                <div style="margin-top: 6px;"><span class="chip primary">Nivel ${chord.level}</span></div>
              </div>

              <div class="row" style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border);">
                <a href="#/camara?chord=${chord.id}" class="btn primary lg" style="width: 100%;">
                  ◉ Comprobar este acorde en mi Cámara IA
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const backdrop = modalRoot.querySelector('#chord-modal-backdrop');
    const closeBtn = modalRoot.querySelector('#close-modal-btn');
    const modalDiag = modalRoot.querySelector('#modal-diag-wrap');

    bindChordDiagram(modalDiag, chord);

    modalRoot.querySelector('#modal-strum-btn')?.addEventListener('click', () => {
      strum(chord, { gain: 0.65 });
    });

    modalRoot.querySelector('#modal-arp-btn')?.addEventListener('click', () => {
      arpeggio(chord);
    });

    const close = () => { modalRoot.innerHTML = ''; };
    backdrop?.addEventListener('click', close);
    closeBtn?.addEventListener('click', close);
  }

  // Render inicial
  renderList();
}
