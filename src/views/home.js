// Vista de Inicio: Hero inmersivo, progreso de aprendizaje, atajos a la Cámara IA y acordes rápidos.
import { getState, getUserLevel } from '../lib/state.js';
import { ALL_LESSONS } from '../data/curriculum.js';
import { CHORDS } from '../data/chords.js';
import { SONGS } from '../data/songs.js';
import { renderChordSvg, bindChordDiagram } from '../components/chordDiagram.js';
import { strum } from '../audio/guitar.js';

export function renderHome(container) {
  const state = getState();
  const userLevel = getUserLevel();

  // Encontrar la siguiente lección pendiente
  const nextLesson = ALL_LESSONS.find((l) => !state.completedLessons.includes(l.id)) || ALL_LESSONS[0];

  // Acordes destacados para el primer día
  const quickChords = CHORDS.filter((c) => ['Em', 'E', 'Am', 'C', 'G', 'D'].includes(c.id));

  // Canciones destacadas
  const featuredSongs = SONGS.slice(0, 3);

  container.innerHTML = `
    <div class="view-enter">
      <!-- HERO -->
      <section class="hero" id="home-hero">
        <div class="hero-bg" style="background-image: url('/img/hero.jpg');"></div>
        <div style="position: relative; z-index: 2;">
          <span class="eyebrow"><span class="ico">🎸</span> Tu academia de guitarra interactiva</span>
          <h1>Aprende guitarra desde cero <span class="grad-text">con tu cámara web</span></h1>
          <p>
            Guiado paso a paso por niveles, lecciones en video de los mejores profesores en español,
            y el sistema de <b>Inteligencia Artificial</b> que detecta tus dedos en tiempo real para decirte si estás pisando el acorde correcto.
          </p>
          <div class="row">
            <a href="#/camara" class="btn primary lg" id="hero-cam-btn">
              <span>◉ Abrir Cámara IA</span>
            </a>
            <a href="#/ruta" class="btn ghost lg" id="hero-path-btn">
              <span>◈ Ver mi ruta guiada</span>
            </a>
          </div>
        </div>
      </section>

      <div class="spacer"></div>

      <!-- STATS & RESUMEN -->
      <section class="grid grid-3" id="home-stats">
        <div class="card stat-card">
          <div class="s-ico" style="background: var(--primary-soft); color: var(--primary);">⚡</div>
          <div>
            <div class="s-val">${state.xp} XP</div>
            <div class="s-lbl">Nivel: <b>${userLevel.title}</b></div>
          </div>
        </div>

        <div class="card stat-card">
          <div class="s-ico" style="background: var(--accent-soft); color: var(--accent);">🔥</div>
          <div>
            <div class="s-val">${state.streak} ${state.streak === 1 ? 'día' : 'días'}</div>
            <div class="s-lbl">Racha de práctica diaria</div>
          </div>
        </div>

        <div class="card stat-card">
          <div class="s-ico" style="background: var(--success-soft); color: var(--success);">🎯</div>
          <div>
            <div class="s-val">${state.masteredChords.length} / ${CHORDS.length}</div>
            <div class="s-lbl">Acordes validados con IA</div>
          </div>
        </div>
      </section>

      <!-- SIGUIENTE LECCIÓN RECOMENDADA -->
      <div class="spacer"></div>
      <div class="card next-lesson">
        <div>
          <div class="nl-meta">
            <span class="chip primary">Siguiente paso recomendado</span>
            <span class="chip">${nextLesson.duration}</span>
            <span class="chip">Nivel ${nextLesson.level}</span>
          </div>
          <h3>${nextLesson.title}</h3>
          <p class="muted" style="margin-top: 6px;">${nextLesson.summary}</p>
        </div>
        <div>
          <a href="#/leccion/${nextLesson.id}" class="btn primary lg">Continuar lección →</a>
        </div>
      </div>

      <!-- CARACTERÍSTICAS PRINCIPALES -->
      <div class="section-title">
        <h2>¿Por dónde empezar hoy?</h2>
      </div>

      <div class="grid grid-3">
        <div class="card hover feature-card" onclick="location.hash='#/camara'">
          <div>
            <div class="f-ico" style="background: var(--primary-soft); color: var(--primary);">◉</div>
            <h3 style="margin-top: 14px;">Cámara IA: Revisor de dedos</h3>
            <p class="sub">Coloca tus manos frente a la cámara web. La IA comprueba traste por traste si estás formando bien el acorde.</p>
          </div>
          <span class="go">Probar con tu cámara →</span>
        </div>

        <div class="card hover feature-card" onclick="location.hash='#/ruta'">
          <div>
            <div class="f-ico" style="background: var(--accent-soft); color: var(--accent);">◈</div>
            <h3 style="margin-top: 14px;">Ruta completa desde cero</h3>
            <p class="sub">4 niveles estructurados con videos de YouTube en español, ejercicios mecánicos, quizzes y pestañas explicativas.</p>
          </div>
          <span class="go">Explorar el mapa →</span>
        </div>

        <div class="card hover feature-card" onclick="location.hash='#/canciones'">
          <div>
            <div class="f-ico" style="background: var(--violet-soft); color: var(--violet);">♫</div>
            <h3 style="margin-top: 14px;">Cancionero interactivo</h3>
            <p class="sub">Toca clásicos como Stand By Me, Zombie o Soda Stereo con reproductor sincronizado de compases y rasgueos.</p>
          </div>
          <span class="go">Elegir canción →</span>
        </div>
      </div>

      <!-- ACORDES ESENCIALES INTERACTIVOS -->
      <div class="section-title">
        <h2>Acordes del primer día</h2>
        <a href="#/acordes">Ver biblioteca completa (${CHORDS.length} acordes) →</a>
      </div>

      <p class="muted" style="margin-bottom: 16px;">
        Haz clic en cualquier cuerda para escucharla pulsar, o toca el botón "Rasguear" para oír el acorde entero:
      </p>

      <div class="grid grid-auto" id="quick-chords-grid">
        ${quickChords.map((chord) => `
          <div class="card chord-card hover" data-id="${chord.id}">
            <div class="cc-name">${chord.symbol}</div>
            <div class="cc-es">${chord.name}</div>
            <div class="chord-diag-wrap" style="width: 100%; display: flex; justify-content: center;">
              ${renderChordSvg(chord, { width: 140 })}
            </div>
            <div class="row" style="margin-top: 8px;">
              <button class="btn sm strum-btn" data-id="${chord.id}">▶ Rasguear</button>
              <a href="#/camara?chord=${chord.id}" class="btn sm primary">◉ Probar en IA</a>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- CANCIONES DESTACADAS -->
      <div class="section-title">
        <h2>Canciones fáciles para principiantes</h2>
        <a href="#/canciones">Ver todas las canciones →</a>
      </div>

      <div class="grid grid-3">
        ${featuredSongs.map((s) => `
          <div class="card song-card hover" onclick="location.hash='#/cancion/${s.id}'">
            <div class="sc-top">
              <div>
                <h3>${s.title}</h3>
                <p class="muted small">${s.artist} · ${s.genre}</p>
              </div>
              <span class="chip primary">Nivel ${s.level}</span>
            </div>
            <div class="sc-chords">
              ${s.chords.map((c) => `<span>${c}</span>`).join('')}
            </div>
            <p class="small muted">${s.strumDesc}</p>
            <div class="row between" style="margin-top: auto; padding-top: 8px;">
              <span class="small mono muted">BPM: ${s.bpm}</span>
              <span class="btn sm ghost">Tocar canción →</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Bindear sonido de cuerdas para los acordes rápidos
  quickChords.forEach((chord) => {
    const card = container.querySelector(`.chord-card[data-id="${chord.id}"]`);
    if (card) {
      bindChordDiagram(card, chord);
      const strumBtn = card.querySelector('.strum-btn');
      strumBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        strum(chord, { dir: 'D', gain: 0.55 });
      });
    }
  });
}
