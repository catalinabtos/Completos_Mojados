import './ui/styles.css';

import { LEVELS, starsFor, type LevelConfig } from './engine/data';
import type { Game } from './engine/game';
import { play, setSoundEnabled, unlockAudio } from './ui/audio';
import { button } from './ui/dom';
import { GameView } from './ui/gameView';
import { howToScreen, introScreen, levelSelectScreen, overlay, recipesPanel, resultsScreen, titleScreen } from './ui/screens';
import { loadSave, writeSave } from './ui/storage';

const app = document.getElementById('app')!;
let save = loadSave();
setSoundEnabled(save.sound);
let current: GameView | null = null;
let currentOverlay: HTMLElement | null = null;

function show(screen: HTMLElement) {
  current?.destroy();
  current = null;
  closeOverlay();
  app.replaceChildren(screen);
}

function closeOverlay() {
  currentOverlay?.remove();
  currentOverlay = null;
}

function goTitle() {
  show(
    titleScreen(
      save,
      goLevels,
      () => show(howToScreen(goTitle)),
      () => {
        save.sound = !save.sound;
        setSoundEnabled(save.sound);
        writeSave(save);
        goTitle();
      }
    )
  );
}

function goLevels() {
  show(levelSelectScreen(save, goIntro, goTitle));
}

function goIntro(level: LevelConfig) {
  show(introScreen(level, () => startLevel(level), goLevels));
}

function startLevel(level: LevelConfig) {
  const view = new GameView({
    level,
    tutorial: level.id === 1 && !save.tutorialDone,
    onPause: () => pause(view),
    onRecipes: () => showRecipes(view),
    onFinish: (game) => finish(game)
  });
  show(view.root);
  current = view;
  view.start();
}

function pause(view: GameView) {
  if (currentOverlay) return;
  view.setPaused(true);
  currentOverlay = overlay('Pausa', null, [
    button('Continuar', () => resume(view), 'btn primary big'),
    button('Reiniciar nivel', () => startLevel(view.game.level), 'btn'),
    button('Salir', goLevels, 'btn ghost')
  ]);
  view.root.append(currentOverlay);
}

function showRecipes(view: GameView) {
  if (currentOverlay) return;
  view.setPaused(true);
  currentOverlay = overlay('Recetas', recipesPanel(view.game.level), [button('Volver al carrito', () => resume(view), 'btn primary big')]);
  view.root.append(currentOverlay);
}

function resume(view: GameView) {
  closeOverlay();
  view.setPaused(false);
}

function finish(game: Game) {
  const level = game.level;
  const prevBest = save.best[level.id] ?? 0;
  const isRecord = game.money > prevBest && prevBest > 0;
  save.best[level.id] = Math.max(prevBest, game.money);
  save.stars[level.id] = Math.max(save.stars[level.id] ?? 0, starsFor(level, game.money));
  if (game.won) save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, level.id + 1));
  if (level.id === 1 && game.stats.served > 0) save.tutorialDone = true;
  writeSave(save);

  const next = LEVELS.find((l) => l.id === level.id + 1);
  show(
    resultsScreen(
      game,
      isRecord,
      !!next,
      () => next && goIntro(next),
      () => startLevel(level),
      goLevels
    )
  );
}

// El primer toque habilita el audio en iOS.
document.addEventListener('pointerdown', unlockAudio, { capture: true });
document.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('.btn, .level-card')) play('tap');
});

// Pausa automática al salir de la app.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && current && !currentOverlay) pause(current);
});

// Evita el zoom por doble toque y gestos de pellizco en iOS.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());

goTitle();
