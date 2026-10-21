// Vista de Biblioteca de Canciones para practicar con filtros por artista y género
import { SONGS } from '../data/songs.js';
import { getState } from '../lib/state.js';

export function renderCanciones(container) {
  const state = getState();
  let activeFilter = 'all';
  let searchTerm = '';

  function getFilteredSongs() {
    return SONGS.filter((s) => {
      // Búsqueda por texto
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchArtist = s.artist.toLowerCase().includes(q);
        const matchGenre = s.genre.toLowerCase().includes(q);
        if (!matchTitle && !matchArtist && !matchGenre) return false;
      }

      // Filtro de categoría
      if (activeFilter === 'juanes') {
        return s.artist.toLowerCase().includes('juanes') || s.genre.toLowerCase().includes('latino') || s.genre.toLowerCase().includes('español');
      }
      if (activeFilter === 'english') {
        return s.artist.toLowerCase().includes('jonas') || s.genre.toLowerCase().includes('folk') || s.genre.toLowerCase().includes('rock') || s.artist.toLowerCase().includes('ben e. king') || s.artist.toLowerCase().includes('oasis');
      }
      if (activeFilter === 'easy') {
        return s.level <= 2;
      }
      if (activeFilter === 'advanced') {
        return s.level >= 3;
      }
      return true;
    });
  }

  function renderList() {
    const list = getFilteredSongs();
    const grid = container.querySelector('#songs-grid');
    if (!grid) return;

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty" style="grid-column: 1 / -1; padding: 50px 20px;">
          <div style="font-size: 2.6rem; margin-bottom: 10px;">🎸</div>
          <h3>No encontramos canciones que coincidan con "${searchTerm}"</h3>
          <p class="muted" style="margin-top: 6px;">Prueba con otra palabra o selecciona "Todas las canciones".</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map((song) => {
      const isJuanes = song.artist.toLowerCase().includes('juanes');
      const isJonas = song.artist.toLowerCase().includes('jonas');
      return `
        <div class="card song-card hover" onclick="location.hash='#/cancion/${song.id}'">
          <div class="sc-top">
            <div>
              <div class="row" style="gap: 6px; margin-bottom: 2px;">
                <h3 style="font-size: 1.25rem;">${song.title}</h3>
                ${isJuanes ? '<span class="chip sm" style="background: rgba(255,160,50,0.15); color: #ff9f43; border-color: rgba(255,160,50,0.3);">🇨🇴 Juanes</span>' : ''}
                ${isJonas ? '<span class="chip sm" style="background: rgba(0,207,232,0.15); color: #00cfe8; border-color: rgba(0,207,232,0.3);">⚡ Jonas Brothers</span>' : ''}
              </div>
              <p class="muted small">${song.artist} · ${song.genre}</p>
            </div>
            <span class="chip primary sm">Nivel ${song.level}</span>
          </div>

          <!-- ACORDES USADOS -->
          <div>
            <span class="small muted" style="display: block; margin-bottom: 6px;">Acordes necesarios:</span>
            <div class="sc-chords">
              ${song.chords.map((c) => `<span>${c}</span>`).join('')}
            </div>
          </div>

          <!-- DESCRIPCIÓN DEL RITMO -->
          <div>
            <span class="small muted" style="display: block; margin-bottom: 4px;">Ritmo de rasgueo:</span>
            <p class="small" style="color: var(--text-2); line-height: 1.35;">${song.strumDesc}</p>
          </div>

          <div class="row between" style="margin-top: auto; padding-top: 10px; border-top: 1px solid var(--border);">
            <span class="small mono muted">Tempo: <b>${song.bpm} BPM</b></span>
            <span class="btn sm primary">Practicar canción →</span>
          </div>
        </div>
      `;
    }).join('');
  }

  container.innerHTML = `
    <div class="view-enter">
      <div class="page-head">
        <div>
          <span class="eyebrow"><span class="ico">♫</span> Repertorio de práctica interactivo</span>
          <h1>Canciones para <span class="grad-text">aprender y tocar</span></h1>
          <p>
            Aprende tus canciones favoritas desde cero: éxitos de <b>Juanes</b>, <b>Jonas Brothers</b>, clásicos del rock y pop.
            Con rasgueos sincronizados en tiempo real y selector de timbres de guitarra (acústica o eléctrica).
          </p>
        </div>
      </div>

      <!-- BARRA DE FILTROS Y BÚSQUEDA -->
      <div class="card" style="padding: 16px 20px; margin-bottom: 24px;">
        <div class="row between" style="gap: 16px; flex-wrap: wrap;">
          <div class="seg" id="song-filter-tabs">
            <button class="active" data-filter="all">Todas (${SONGS.length})</button>
            <button data-filter="juanes">🇨🇴 Juanes & Latino</button>
            <button data-filter="english">🇺🇸 Jonas Brothers & Pop Inglés</button>
            <button data-filter="easy">⭐ Nivel 1 y 2 (Fáciles)</button>
            <button data-filter="advanced">🔥 Nivel 3 y 4 (Cejilla/Rock)</button>
          </div>

          <div style="flex: 1; max-width: 320px; min-width: 200px;">
            <input
              type="search"
              id="song-search-input"
              placeholder="🔍 Buscar canción o artista..."
              style="width: 100%; padding: 8px 14px; border-radius: 10px; background: var(--surface); border: 1px solid var(--border); color: var(--text); font-size: 0.9rem;"
            />
          </div>
        </div>
      </div>

      <!-- GRID DE CANCIONES -->
      <div class="grid grid-3" id="songs-grid" style="gap: 20px;"></div>
    </div>
  `;

  // Bindear tabs de filtros
  const filterTabs = container.querySelectorAll('#song-filter-tabs button');
  filterTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterTabs.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderList();
    });
  });

  // Bindear input de búsqueda
  const searchInput = container.querySelector('#song-search-input');
  searchInput?.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    renderList();
  });

  // Render inicial
  renderList();
}
