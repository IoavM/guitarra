// Punto de entrada principal y enrutador SPA para Traste.
import './style.css';

import { getState, subscribe, getUserLevel } from './lib/state.js';
import { renderHome } from './views/home.js';
import { renderRuta } from './views/ruta.js';
import { renderLesson } from './views/lesson.js';
import { renderCamara } from './views/camara.js';
import { renderAcordes } from './views/acordes.js';
import { renderCanciones } from './views/canciones.js';
import { renderSongPlayer } from './views/songPlayer.js';
import { renderHerramientas } from './views/herramientas.js';

const viewContainer = document.getElementById('view');
const sidebarStats = document.getElementById('sidebar-stats');
const navLinks = document.querySelectorAll('#main-nav a');

// Enrutador de Hash
function parseHash() {
  const hash = window.location.hash || '#/';
  const [path, queryString] = hash.slice(1).split('?');
  const params = Object.fromEntries(new URLSearchParams(queryString || ''));
  const segments = path.split('/').filter(Boolean);
  return { path, segments, params };
}

function handleRoute() {
  const { segments, params } = parseHash();
  const rootSeg = segments[0] || '';

  // Actualizar clase activa en la navegación del sidebar
  navLinks.forEach((link) => {
    const route = link.dataset.route;
    const isActive = (route === 'home' && rootSeg === '') || (route && route === rootSeg);
    link.classList.toggle('active', isActive);
  });

  // Limpiar vista y renderizar página correspondiente
  viewContainer.innerHTML = '';
  window.scrollTo({ top: 0, behavior: 'instant' });

  if (rootSeg === '' || rootSeg === 'home') {
    renderHome(viewContainer);
  } else if (rootSeg === 'ruta') {
    renderRuta(viewContainer);
  } else if (rootSeg === 'leccion' && segments[1]) {
    renderLesson(viewContainer, segments[1]);
  } else if (rootSeg === 'camara') {
    renderCamara(viewContainer, params);
  } else if (rootSeg === 'acordes') {
    renderAcordes(viewContainer);
  } else if (rootSeg === 'canciones') {
    renderCanciones(viewContainer);
  } else if (rootSeg === 'cancion' && segments[1]) {
    renderSongPlayer(viewContainer, segments[1]);
  } else if (rootSeg === 'herramientas') {
    renderHerramientas(viewContainer);
  } else {
    // Redirigir a inicio si no coincide
    window.location.hash = '#/';
  }
}

// Actualizar barra de estado / XP en el footer del sidebar
function updateSidebarStats() {
  if (!sidebarStats) return;
  const state = getState();
  const userLevel = getUserLevel();

  sidebarStats.innerHTML = `
    <div class="side-stats">
      <div class="lvl">
        <b>Nivel ${userLevel.level}</b>
        <span>${state.xp} XP</span>
      </div>
      <div class="progress" style="margin-bottom: 8px;">
        <span style="width: ${Math.round(userLevel.progress * 100)}%;"></span>
      </div>
      <div class="mini">
        <span>🔥 <b>${state.streak}</b> ${state.streak === 1 ? 'día' : 'días'}</span>
        <span>🎯 <b>${state.masteredChords.length}</b> acordes</span>
      </div>
    </div>
  `;
}

// Inicialización
window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', () => {
  subscribe(updateSidebarStats);
  updateSidebarStats();
  handleRoute();
});

// Sistema global de toasts
export function showToast(msg, icon = '🎸') {
  const toastsEl = document.getElementById('toasts');
  if (!toastsEl) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span class="t-ico">${icon}</span><span>${msg}</span>`;
  toastsEl.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 400);
  }, 3200);
}
