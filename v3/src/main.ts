import '@fontsource/lilita-one/latin-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import './ui/styles.css';

import { LEVELS, starsFor, type LevelConfig } from './engine/data';
import type { Game } from './engine/game';
import { STORY, STORY_ENDING } from './engine/story';
import { applyUpgrades, buyDecor, buyUpgrade, gameOptions, toggleDecor } from './engine/upgrades';
import { MASCOT } from './ui/art';
import { play, setSoundEnabled, unlockAudio } from './ui/audio';
import { button } from './ui/dom';
import { GameView } from './ui/gameView';
import { cartScreen, howToScreen, introScreen, levelSelectScreen, overlay, recipesPanel, resetBody, resultsScreen, storyScreen, titleScreen } from './ui/screens';
import { loadSave, resetSave, writeSave } from './ui/storage';

const app = document.getElementById('app')!;
let save = loadSave();
setSoundEnabled(save.sound);
let current: GameView | null = null;
let currentLevel: LevelConfig | null = null;
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
  show(levelSelectScreen(save, goIntro, goTitle, goCart));
}

function goCart() {
  const buy = (done: boolean) => {
    if (!done) return;
    play('cash');
    writeSave(save);
    goCart();
  };
  show(
    cartScreen(save, {
      onBuyUpgrade: (id) => buy(buyUpgrade(save, id)),
      onBuyDecor: (id) => buy(buyDecor(save, id)),
      onToggleDecor: (id) => {
        toggleDecor(save, id);
        writeSave(save);
        goCart();
      },
      onReset: confirmReset,
      onBack: goLevels
    })
  );
}

function confirmReset() {
  if (currentOverlay) return;
  currentOverlay = overlay('¿Empezar de cero?', resetBody(), [
    button('Sí, borrar mi progreso', () => {
      save = resetSave(save);
      writeSave(save);
      goCart();
    }, 'btn primary big'),
    button('Mejor no', closeOverlay, 'btn secondary')
  ], MASCOT.preocupada);
  app.append(currentOverlay);
}

/** Cada tarjeta de historia sale una sola vez; después sigue directo a `next`. */
function withStory(id: number, next: () => void) {
  if (save.storySeen.includes(id)) return next();
  save.storySeen.push(id);
  writeSave(save);
  show(storyScreen(STORY[id], next));
}

function goIntro(level: LevelConfig) {
  withStory(level.id, () => show(introScreen(level, () => startLevel(level), goLevels)));
}

/** Parte un turno. `level` es siempre la esquina base: las mejoras se aplican solo aquí. */
function startLevel(level: LevelConfig) {
  const view = new GameView({
    level: applyUpgrades(level, save.upgrades),
    options: gameOptions(save.upgrades),
    decor: save.decorOn,
    radio: save.upgrades.radio !== undefined,
    tutorial: level.id === 1 && !save.tutorialDone,
    onPause: () => pause(view, level),
    onRecipes: () => showRecipes(view),
    onFinish: (game) => finish(level, game)
  });
  show(view.root);
  current = view;
  currentLevel = level;
  view.start();
}

function pause(view: GameView, level: LevelConfig) {
  if (currentOverlay) return;
  view.setPaused(true);
  currentOverlay = overlay('Pausa', null, [
    button('Continuar', () => resume(view), 'btn primary big'),
    button('Reiniciar turno', () => startLevel(level), 'btn secondary'),
    button('Salir a la ruta', goLevels, 'btn ghost')
  ], MASCOT.feliz);
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

function finish(level: LevelConfig, game: Game) {
  const prevBest = save.best[level.id] ?? 0;
  const isRecord = game.money > prevBest && prevBest > 0;
  save.best[level.id] = Math.max(prevBest, game.money);
  save.stars[level.id] = Math.max(save.stars[level.id] ?? 0, starsFor(level, game.money));
  if (game.won) save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, level.id + 1));
  if (level.id === 1 && game.stats.served > 0) save.tutorialDone = true;
  // Toda la plata del turno va a la alcancía, se gane o se pierda, también al repetir una esquina.
  save.wallet += game.money;
  writeSave(save);

  const next = LEVELS.find((l) => l.id === level.id + 1);
  const results = () =>
    show(
      resultsScreen(
        game,
        isRecord,
        !!next,
        save.wallet,
        () => next && goIntro(next),
        () => startLevel(level),
        goLevels
      )
    );
  if (game.won && !next) withStory(STORY_ENDING, results);
  else results();
}

// El primer toque habilita el audio en iOS.
document.addEventListener('pointerdown', unlockAudio, { capture: true });
document.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('.btn, .level-card')) play('tap');
});

// Pausa automática al salir de la app.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && current && currentLevel && !currentOverlay) pause(current, currentLevel);
});

// Evita el zoom por doble toque y gestos de pellizco en iOS.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());

goTitle();
