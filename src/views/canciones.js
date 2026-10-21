// Vista de Biblioteca de Canciones para practicar
import { SONGS } from '../data/songs.js';
import { getState } from '../lib/state.js';

export function renderCanciones(container) {
  const state = getState();

  container.innerHTML = `
    <div class="view-enter">
      <div class="page-head">
        <div>
          <span class="eyebrow"><span class="ico">♫</span> Repertorio de práctica</span>
          <h1>Canciones <span class="grad-text">interactivas</span></h1>
          <p>
            Aprende a tocar canciones reales desde el primer día. Incluyen visualizador de rasgueo animado,
            compases sincronizados que se iluminan al compás y acordes superpuestos en la letra.
          </p>
        </div>
      </div>

      <div class="grid grid-3" style="gap: 20px;">
        ${SONGS.map((song) => {
          const isFav = state.favoriteSongs.includes(song.id);
          return `
            <div class="card song-card hover" onclick="location.hash='#/cancion/${song.id}'">
              <div class="sc-top">
                <div>
                  <h3 style="font-size: 1.25rem;">${song.title}</h3>
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
        }).join('')}
      </div>
    </div>
  `;
}
