// Vista de detalle de Lección: Reproductor de YouTube, teoría, acordes interactivos y quiz.
import { getLesson, getNextLesson } from '../data/curriculum.js';
import { getChord } from '../data/chords.js';
import { renderChordSvg, bindChordDiagram } from '../components/chordDiagram.js';
import { isLessonCompleted, markLessonCompleted, addXp } from '../lib/state.js';
import { chime, strum } from '../audio/guitar.js';

export function renderLesson(container, lessonId) {
  const lesson = getLesson(lessonId);
  if (!lesson) {
    container.innerHTML = `
      <div class="empty">
        <h2>Lección no encontrada</h2>
        <p class="muted">La lección solicitada no existe o fue movida.</p>
        <div style="margin-top: 18px;">
          <a href="#/ruta" class="btn primary">← Volver a mi ruta</a>
        </div>
      </div>
    `;
    return;
  }

  const next = getNextLesson(lesson.id);
  const isDone = isLessonCompleted(lesson.id);
  const chords = (lesson.chords || []).map((id) => getChord(id)).filter(Boolean);

  // Convierte el markdown simple del body a HTML limpio
  const parsedBody = lesson.body
    .replace(/^### (.*$)/gim, '<h3 style="margin: 22px 0 10px; font-size: 1.25rem;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="margin: 26px 0 12px; font-size: 1.45rem;">$1</h2>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/```([\s\S]*?)```/gim, '<pre class="tab-block"><code>$1</code></pre>')
    .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
    .replace(/\*(.*?)\*/gim, '<i>$1</i>');

  let activeVideoIdx = 0;
  const currentVideo = lesson.youtube?.[activeVideoIdx];

  container.innerHTML = `
    <div class="view-enter">
      <!-- CABECERA -->
      <div style="margin-bottom: 20px;">
        <a href="#/ruta" class="btn sm ghost" style="margin-bottom: 12px;">← Volver al mapa de ruta</a>
        <div class="row between">
          <div>
            <div class="eyebrow"><span class="ico">◈</span> Nivel ${lesson.level} · Lección guiada</div>
            <h1 style="font-size: clamp(1.8rem, 3.2vw, 2.4rem); font-weight: 800;">${lesson.title}</h1>
          </div>
          <div class="row">
            ${isDone
              ? '<span class="chip success" id="status-chip">✓ Lección completada (+50 XP)</span>'
              : '<button class="btn primary" id="complete-btn">✓ Marcar como completada</button>'}
          </div>
        </div>
      </div>

      <div class="lesson-layout">
        <!-- COLUMNA PRINCIPAL -->
        <div class="lesson-body">
          <!-- REPRODUCTOR YOUTUBE -->
          ${lesson.youtube && lesson.youtube.length > 0 ? `
            <div class="card" style="padding: 14px;">
              <div class="video-wrap" id="video-container">
                <iframe
                  id="yt-iframe"
                  src="https://www.youtube-nocookie.com/embed/${currentVideo.id}?rel=0&modestbranding=1"
                  title="${currentVideo.title}"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen>
                </iframe>
              </div>

              ${lesson.youtube.length > 1 ? `
                <div style="margin-top: 12px;">
                  <span class="small muted" style="margin-right: 8px;">Tutoriales recomendados:</span>
                  <div class="video-tabs" id="video-tabs">
                    ${lesson.youtube.map((v, i) => `
                      <button class="btn sm ${i === 0 ? 'active' : 'ghost'}" data-idx="${i}" data-id="${v.id}">
                        ▶ ${v.author}: ${v.title.length > 36 ? v.title.slice(0, 36) + '...' : v.title}
                      </button>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <!-- CONTENIDO TEÓRICO -->
          <div class="card prose" style="padding: 28px;">
            ${parsedBody}
          </div>

          <!-- CONSEJOS PRO -->
          ${lesson.tips && lesson.tips.length > 0 ? `
            <div class="card" style="background: var(--accent-soft); border-color: hsla(172, 72%, 48%, 0.25);">
              <h3 style="color: var(--accent); margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span>💡</span> Consejos biomecánicos del profesor:
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: var(--text-2);">
                ${lesson.tips.map((t) => `<li style="margin-bottom: 6px;">${t}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- AUTOEVALUACIÓN (QUIZ) -->
          ${lesson.quiz && lesson.quiz.length > 0 ? `
            <div class="card" id="quiz-block" style="padding: 28px;">
              <div class="row between" style="margin-bottom: 16px;">
                <h3>🎯 Comprueba lo aprendido</h3>
                <span class="chip sm primary">+20 XP por respuesta correcta</span>
              </div>

              ${lesson.quiz.map((item, qIdx) => `
                <div class="quiz-q" data-qidx="${qIdx}">
                  <h4>${qIdx + 1}. ${item.q}</h4>
                  <div class="quiz-opts">
                    ${item.options.map((opt, optIdx) => `
                      <button class="quiz-opt" data-qidx="${qIdx}" data-optidx="${optIdx}">
                        ${opt}
                      </button>
                    `).join('')}
                  </div>
                  <div class="quiz-explain hidden" id="explain-${qIdx}"></div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- BOTÓN SIGUIENTE LECCIÓN -->
          <div class="row between" style="margin-top: 14px; padding-top: 16px; border-top: 1px solid var(--border);">
            <a href="#/ruta" class="btn ghost">← Lista de lecciones</a>
            ${next ? `
              <a href="#/leccion/${next.id}" class="btn primary lg">
                Siguiente: ${next.title} →
              </a>
            ` : `
              <a href="#/canciones" class="btn primary lg">
                ¡Has completado el curso! Ver canciones →
              </a>
            `}
          </div>
        </div>

        <!-- SIDEBAR DE ACORDES Y HERRAMIENTAS DE ESTA LECCIÓN -->
        <aside class="stack sticky" style="gap: 18px;">
          ${chords.length > 0 ? `
            <div class="card">
              <h3 style="margin-bottom: 12px;">Acordes de la lección</h3>
              <p class="small muted" style="margin-bottom: 14px;">Toca las cuerdas para escuchar cada nota o ábrelos en la Cámara IA:</p>
              <div class="stack" style="gap: 16px;">
                ${chords.map((chord) => `
                  <div class="card chord-card" data-chord-id="${chord.id}" style="padding: 12px; background: var(--surface-2);">
                    <div class="row between" style="width: 100%;">
                      <b style="font-size: 1.25rem;">${chord.symbol}</b>
                      <span class="small muted">${chord.name}</span>
                    </div>
                    <div style="width: 100%; display: flex; justify-content: center; margin: 8px 0;">
                      ${renderChordSvg(chord, { width: 130 })}
                    </div>
                    <div class="row" style="width: 100%; justify-content: center; gap: 8px;">
                      <button class="btn sm strum-lesson-btn" data-id="${chord.id}">▶ Rasguear</button>
                      <a href="#/camara?chord=${chord.id}" class="btn sm primary">◉ Comprobar con IA</a>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="card" style="background: linear-gradient(135deg, hsla(30, 96%, 58%, 0.12), transparent);">
            <h4 style="margin-bottom: 6px;">¿Quieres afinar primero?</h4>
            <p class="small muted">Asegúrate de que tus 6 cuerdas estén bien afinadas antes de empezar el ejercicio.</p>
            <div style="margin-top: 12px;">
              <a href="#/herramientas" class="btn sm ghost" style="width: 100%;">Abrir afinador y metrónomo</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `;

  // 1. Selector de videos de YouTube alternativos
  const videoTabs = container.querySelectorAll('#video-tabs button');
  const iframe = container.querySelector('#yt-iframe');
  videoTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      videoTabs.forEach((b) => b.classList.replace('active', 'ghost'));
      btn.classList.replace('ghost', 'active');
      const vId = btn.dataset.id;
      if (iframe) {
        iframe.src = `https://www.youtube-nocookie.com/embed/${vId}?autoplay=1&rel=0`;
      }
    });
  });

  // 2. Botón "Completar lección"
  const completeBtn = container.querySelector('#complete-btn');
  completeBtn?.addEventListener('click', () => {
    markLessonCompleted(lesson.id);
    chime(true);
    completeBtn.outerHTML = '<span class="chip success" id="status-chip">✓ Lección completada (+50 XP)</span>';
  });

  // 3. Bindear acordes interactivos en la sidebar
  chords.forEach((chord) => {
    const card = container.querySelector(`.chord-card[data-chord-id="${chord.id}"]`);
    if (card) {
      bindChordDiagram(card, chord);
      const strumBtn = card.querySelector('.strum-lesson-btn');
      strumBtn?.addEventListener('click', () => {
        strum(chord, { dir: 'D', gain: 0.55 });
      });
    }
  });

  // 4. Lógica de Quizzes
  if (lesson.quiz) {
    lesson.quiz.forEach((qItem, qIdx) => {
      const qBlock = container.querySelector(`.quiz-q[data-qidx="${qIdx}"]`);
      if (!qBlock) return;
      const optButtons = qBlock.querySelectorAll('.quiz-opt');
      const explainEl = qBlock.querySelector(`#explain-${qIdx}`);

      optButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const chosen = parseInt(btn.dataset.optidx, 10);
          optButtons.forEach((b) => (b.disabled = true));

          if (chosen === qItem.correct) {
            btn.classList.add('correct');
            chime(true);
            addXp(20, 'Quiz correcto');
            explainEl.innerHTML = `
              <div style="color: var(--success); font-weight: 600;">¡Respuesta Correcta! (+20 XP)</div>
              <div class="muted small" style="margin-top: 4px;">${qItem.explain}</div>
            `;
          } else {
            btn.classList.add('wrong');
            optButtons[qItem.correct].classList.add('correct');
            chime(false);
            explainEl.innerHTML = `
              <div style="color: var(--danger); font-weight: 600;">No exactamente</div>
              <div class="muted small" style="margin-top: 4px;">${qItem.explain}</div>
            `;
          }
          explainEl.classList.remove('hidden');
        });
      });
    });
  }
}
