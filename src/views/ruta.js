// Vista de la Ruta de Aprendizaje (Curriculum / Roadmap)
import { LEVELS } from '../data/curriculum.js';
import { getState } from '../lib/state.js';

export function renderRuta(container) {
  const state = getState();

  const totalLessons = LEVELS.reduce((acc, l) => acc + l.lessons.length, 0);
  const completedCount = state.completedLessons.length;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);

  container.innerHTML = `
    <div class="view-enter">
      <div class="page-head">
        <div>
          <span class="eyebrow"><span class="ico">◈</span> Plan de estudio paso a paso</span>
          <h1>Mi ruta: <span class="grad-text">De 0 a guitarrista</span></h1>
          <p>
            Un camino guiado diseñado para que avances sin frustrarte. Cada lección cuenta con explicaciones biomecánicas,
            videos seleccionados de YouTube en español, acordes interactivos y preguntas para fijar el conocimiento.
          </p>
        </div>
        <div style="min-width: 220px; text-align: right;">
          <div class="muted small" style="margin-bottom: 6px;">Progreso total del curso</div>
          <div class="row" style="justify-content: flex-end; gap: 8px;">
            <b style="font-size: 1.3rem;">${progressPercent}%</b>
            <span class="muted small">(${completedCount}/${totalLessons} lecciones)</span>
          </div>
          <div class="progress" style="margin-top: 8px;">
            <span style="width: ${progressPercent}%;"></span>
          </div>
        </div>
      </div>

      <div class="stack" style="gap: 28px; margin-top: 24px;">
        ${LEVELS.map((level) => {
          const lvlCompleted = level.lessons.filter((l) => state.completedLessons.includes(l.id)).length;
          const lvlPercent = Math.round((lvlCompleted / level.lessons.length) * 100);
          const isAllDone = lvlCompleted === level.lessons.length;

          return `
            <div class="level-block" id="level-${level.number}">
              <div class="level-head">
                <div class="level-num ${isAllDone ? 'done' : ''}">
                  ${isAllDone ? '✓' : level.number}
                </div>
                <div>
                  <h2>${level.title}</h2>
                  <p>${level.subtitle}</p>
                </div>
                <div style="margin-left: auto; text-align: right;">
                  <span class="chip ${isAllDone ? 'success' : 'primary'} small">
                    ${lvlCompleted}/${level.lessons.length} completadas
                  </span>
                </div>
              </div>

              <div class="lesson-list">
                ${level.lessons.map((lesson, idx) => {
                  const isDone = state.completedLessons.includes(lesson.id);
                  const isNext = !isDone && (idx === 0 || state.completedLessons.includes(level.lessons[idx - 1]?.id));

                  return `
                    <div class="card hover lesson-card ${isDone ? 'done' : ''} ${isNext ? 'next' : ''}"
                         onclick="location.hash='#/leccion/${lesson.id}'">
                      <div class="lc-state">
                        ${isDone ? '✓' : (idx + 1)}
                      </div>
                      <div style="flex: 1;">
                        <h4>${lesson.title}</h4>
                        <p class="muted small" style="line-height: 1.35; margin-top: 4px;">${lesson.summary}</p>
                        <div class="lc-meta">
                          <span class="chip sm">${lesson.duration}</span>
                          ${lesson.chords ? lesson.chords.map((c) => `<span class="chip sm primary">${c}</span>`).join('') : ''}
                          ${isNext ? '<span class="chip sm warning">Siguiente</span>' : ''}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
