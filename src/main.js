import './style.css'
import { Game } from './game/Game.js'

document.addEventListener('DOMContentLoaded', () => {
  new Game();

  // UI Logic
  const modal = document.getElementById('help-modal');
  const openBtn = document.getElementById('help-btn');
  const closeBtn = document.getElementById('close-help');

  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
});
