// Modal interactivo para seleccionar el tipo y timbre de guitarra
// Permite preescuchar cada instrumento (Acústica, Española, Strat Clean, Crunch Les Paul, Heavy Metal)
import { GUITAR_PRESETS, getGuitarPreset, setGuitarPreset, strum, arpeggio } from '../audio/guitar.js';
import { setSelectedGuitar } from '../lib/state.js';
import { getChord } from '../data/chords.js';

let activeModalEl = null;

export function openGuitarSelectorModal({ onSelect = () => {} } = {}) {
  if (activeModalEl) {
    activeModalEl.remove();
    activeModalEl = null;
  }

  const current = getGuitarPreset();

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'guitar-selector-modal-backdrop';

  backdrop.innerHTML = `
    <div class="card glass guitar-modal" role="dialog" aria-labelledby="gmodal-title">
      <div class="row between" style="margin-bottom: 8px;">
        <div class="row" style="gap: 10px;">
          <span style="font-size: 1.8rem;">🎸</span>
          <div>
            <h2 id="gmodal-title" style="font-size: 1.4rem;">Elige tu Guitarra y Timbre</h2>
            <p class="small muted">Cambia el motor de sonido Web Audio en tiempo real para todas las canciones y acordes.</p>
          </div>
        </div>
        <button class="btn sm ghost" id="close-gmodal-btn" aria-label="Cerrar modal">✕</button>
      </div>

      <div class="guitar-grid" style="margin: 20px 0;">
        ${GUITAR_PRESETS.map((g) => {
          const isSelected = g.id === current.id;
          return `
            <div class="guitar-card ${isSelected ? 'selected' : ''}" data-id="${g.id}">
              <div class="row between" style="margin-bottom: 8px;">
                <span class="g-badge" style="background: ${g.color}22; color: ${g.color}; border: 1px solid ${g.color}44;">
                  ${g.badge}
                </span>
                <span class="g-radio">${isSelected ? '✓ Activa' : 'Seleccionar'}</span>
              </div>

              <div class="row" style="gap: 12px; margin-bottom: 10px;">
                <div class="g-ico" style="font-size: 2.2rem; filter: drop-shadow(0 4px 12px ${g.color}66);">
                  ${g.icon}
                </div>
                <div>
                  <h3 style="font-size: 1.15rem; margin-bottom: 2px;">${g.name}</h3>
                  <span class="small" style="color: ${g.color}; font-weight: 600; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.08em;">
                    ${g.category.toUpperCase()}
                  </span>
                </div>
              </div>

              <p class="small muted" style="line-height: 1.4; margin-bottom: 16px; min-height: 38px;">
                ${g.desc}
              </p>

              <div class="row between" style="margin-top: auto; pt-2; border-top: 1px solid var(--border); padding-top: 10px;">
                <button class="btn sm ghost preview-guitar-btn" data-id="${g.id}">
                  ▶ Probar sonido
                </button>
                <button class="btn sm ${isSelected ? 'primary' : 'ghost'} select-guitar-btn" data-id="${g.id}">
                  ${isSelected ? '✓ En uso' : 'Usar esta guitarra'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="row between" style="border-top: 1px solid var(--border); padding-top: 16px;">
        <span class="small muted">💡 <b>Tip:</b> Prueba "Clásica Nylon" para Juanes y "Rock Crunch" para Jonas Brothers y Soda Stereo.</span>
        <button class="btn primary sm" id="done-gmodal-btn">Listo</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  activeModalEl = backdrop;

  const close = () => {
    backdrop.classList.add('out');
    setTimeout(() => {
      backdrop.remove();
      if (activeModalEl === backdrop) activeModalEl = null;
    }, 200);
  };

  backdrop.querySelector('#close-gmodal-btn')?.addEventListener('click', close);
  backdrop.querySelector('#done-gmodal-btn')?.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  // Preescucha de sonido (preview)
  backdrop.querySelectorAll('.preview-guitar-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      // Guardar preset actual temporalmente y aplicar el elegido para escuchar
      setGuitarPreset(id);
      const testChord = id.includes('electric') ? (getChord('E5') || getChord('Em')) : (getChord('G') || getChord('Em'));
      strum(testChord, { dir: 'D', gain: 0.7 });
    });
  });

  // Selección directa
  const applySelection = (id) => {
    setGuitarPreset(id);
    setSelectedGuitar(id);
    onSelect(getGuitarPreset());

    // Actualizar visual del modal
    backdrop.querySelectorAll('.guitar-card').forEach((card) => {
      const isThis = card.dataset.id === id;
      card.classList.toggle('selected', isThis);
      const radio = card.querySelector('.g-radio');
      if (radio) radio.textContent = isThis ? '✓ Activa' : 'Seleccionar';
      const selectBtn = card.querySelector('.select-guitar-btn');
      if (selectBtn) {
        selectBtn.className = `btn sm ${isThis ? 'primary' : 'ghost'} select-guitar-btn`;
        selectBtn.textContent = isThis ? '✓ En uso' : 'Usar esta guitarra';
      }
    });

    // Pequeño rasgueo de confirmación
    const c = getChord('G') || getChord('Em');
    strum(c, { dir: 'D', gain: 0.65 });
  };

  backdrop.querySelectorAll('.select-guitar-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      applySelection(btn.dataset.id);
    });
  });

  backdrop.querySelectorAll('.guitar-card').forEach((card) => {
    card.addEventListener('click', () => {
      applySelection(card.dataset.id);
    });
  });
}
