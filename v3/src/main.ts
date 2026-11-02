import './ui/styles.css';

import { LEVELS, starsFor, type LevelConfig } from './engine/data';
import type { Game } from './engine/game';
import { STORY, STORY_ENDING } from './engine/story';
import { UPGRADES, applyCalm, applyUpgrades, buyDecor, buyUpgrade, gameOptions, nextUpgradePrice, toggleDecor, type UpgradeId } from './engine/upgrades';
import { MASCOT } from './ui/art';
import { play, setAudioSuspended, setMusic, setMusicEnabled, setSoundEnabled, unlockAudio } from './ui/audio';
import { button } from './ui/dom';
import { GameView } from './ui/gameView';
import type { MusicMode } from './ui/music';
import { applyPixelGrid } from './ui/pixelGrid';
import { cartScreen, confirmBody, howToScreen, introScreen, levelSelectScreen, overlay, recipesPanel, resetBody, resultsScreen, settingsPanel, storyScreen, titleScreen, type SettingId } from './ui/screens';
import { loadSave, resetSave, writeSave } from './ui/storage';

const app = document.getElementById('app')!;
applyPixelGrid(app);
window.addEventListener('resize', () => applyPixelGrid(app));
let save = await loadSave();
setSoundEnabled(save.sound);
setMusicEnabled(save.music);
document.documentElement.toggleAttribute('data-texto-grande', save.bigText);
let current: GameView | null = null;
let currentLevel: LevelConfig | null = null;
let currentOverlay: HTMLElement | null = null;
let cancelOverlay: (() => void) | null = null;

function show(screen: HTMLElement, music: MusicMode = 'menu') {
  current?.destroy();
  current = null;
  closeOverlay();
  app.replaceChildren(screen);
  setMusic(music);
  // Lleva el foco al título para que teclado y lector de pantalla sigan el cambio.
  const target = screen.querySelector<HTMLElement>('h1, h2, button');
  if (target?.matches('h1, h2')) target.tabIndex = -1;
  target?.focus({ preventScroll: true });
}

function closeOverlay() {
  for (const child of currentOverlay?.parentElement?.children ?? []) child.removeAttribute('inert');
  currentOverlay?.remove();
  currentOverlay = null;
  cancelOverlay = null;
}

/** Abre un diálogo sobre `host`; el fondo queda inerte hasta cerrarlo. */
function openOverlay(host: HTMLElement, dialog: HTMLElement, onCancel: () => void) {
  closeOverlay();
  for (const child of host.children) child.setAttribute('inert', '');
  currentOverlay = dialog;
  cancelOverlay = onCancel;
  host.append(dialog);
  dialog.querySelector('button')?.focus({ preventScroll: true });
}

function toggleSetting(id: SettingId) {
  save[id] = !save[id];
  setSoundEnabled(save.sound);
  setMusicEnabled(save.music);
  document.documentElement.toggleAttribute('data-texto-grande', save.bigText);
  writeSave(save);
}

function showSettings(host: HTMLElement, onDone: () => void) {
  openOverlay(host, overlay('Ajustes', settingsPanel(save, toggleSetting), [button('Listo', onDone, 'btn primary big')]), onDone);
}

function goTitle() {
  show(
    titleScreen(
      goLevels,
      () => show(howToScreen(goTitle)),
      () => showSettings(app, closeOverlay)
    )
  );
}

function goLevels() {
  const screen = levelSelectScreen(save, goIntro, goTitle, goCart);
  show(screen);
  [...screen.querySelectorAll('.stop:not(.locked)')].at(-1)?.scrollIntoView({ block: 'center' });
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
  const dialog = overlay('¿Empezar de cero?', resetBody(), [
    button('Sí, borrar mi progreso', () => {
      save = resetSave(save);
      writeSave(save);
      goCart();
    }, 'btn primary big'),
    button('Mejor no', closeOverlay, 'btn secondary')
  ], MASCOT.preocupada);
  openOverlay(app, dialog, closeOverlay);
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
    level: save.calm ? applyCalm(applyUpgrades(level, save.upgrades)) : applyUpgrades(level, save.upgrades),
    options: gameOptions(save.upgrades),
    decor: save.decorOn,
    upgrades: save.upgrades,
    tutorial: level.id === 1 && !save.tutorialDone,
    onPause: () => pause(view, level),
    onRecipes: () => showRecipes(view),
    onFinish: (game) => finish(level, game)
  });
  show(view.root, 'turno');
  current = view;
  currentLevel = level;
  view.start();
}

function pause(view: GameView, level: LevelConfig) {
  if (currentOverlay) return;
  view.setPaused(true);
  setMusic(null);
  showPause(view, level);
}

function showPause(view: GameView, level: LevelConfig) {
  const dialog = overlay('Pausa', null, [
    button('Continuar', () => resume(view), 'btn primary big'),
    button('Ajustes', () => showSettings(view.root, () => showPause(view, level)), 'btn secondary'),
    button('Reiniciar turno', () => confirmLeave(view, level, '¿Reiniciar el turno?', 'Sí, reiniciar', () => startLevel(level)), 'btn secondary'),
    button('Salir a la ruta', () => confirmLeave(view, level, '¿Salir del turno?', 'Sí, salir', goLevels), 'btn ghost')
  ], MASCOT.feliz);
  openOverlay(view.root, dialog, () => resume(view));
}

function confirmLeave(view: GameView, level: LevelConfig, title: string, yes: string, onYes: () => void) {
  const back = () => showPause(view, level);
  const dialog = overlay(title, confirmBody('La plata de este turno no se guarda.'), [button('Mejor no', back, 'btn primary big'), button(yes, onYes, 'btn secondary')], MASCOT.preocupada);
  openOverlay(view.root, dialog, back);
}

function showRecipes(view: GameView) {
  if (currentOverlay) return;
  view.setPaused(true);
  const dialog = overlay('Recetas', recipesPanel(view.game.level), [button('Volver al carrito', () => resume(view), 'btn primary big')]);
  openOverlay(view.root, dialog, () => resume(view));
}

function resume(view: GameView) {
  closeOverlay();
  view.setPaused(false);
  setMusic('turno');
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
  const canUpgrade = (Object.keys(UPGRADES) as UpgradeId[]).some((id) => (nextUpgradePrice(save.upgrades, id) ?? Infinity) <= save.wallet);
  const results = () =>
    show(
      resultsScreen(
        game,
        isRecord,
        !!next,
        save.wallet,
        canUpgrade,
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

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cancelOverlay?.();
});

// Pausa automática al salir de la app.
document.addEventListener('visibilitychange', () => {
  setAudioSuspended(document.hidden);
  if (document.hidden && current && currentLevel && !currentOverlay) pause(current, currentLevel);
});

// Evita el zoom por doble toque y gestos de pellizco en iOS.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());

goTitle();
