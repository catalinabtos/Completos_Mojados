import './styles.css';

import type { LevelsData, RecipesData, RootState } from './core/types';
import { createStore } from './core/store';
import { gameStatsFromSave, loadSave } from './core/save';
import { createPixiApp } from './game/pixiApp';
import { GameScene } from './game/scene';
import { createHUD } from './ui/hud';
import { createBar } from './ui/bar';
import { createEmptyOrder } from './game/order';

async function loadJSON<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json() as Promise<T>;
}

async function bootstrap() {
  const [recipes, levels] = await Promise.all([
    loadJSON<RecipesData>('/data/recipes.json'),
    loadJSON<LevelsData>('/data/levels.json')
  ]);

  const levelConfig = levels.levels[0];
  if (!levelConfig) {
    throw new Error('No level configuration found');
  }

  const save = loadSave();
  const initialState: RootState = {
    game: {
      money: 0,
      combo: 0,
      comboMultiplier: 1,
      stats: gameStatsFromSave(save),
      goal: levelConfig.goal_money,
      feedback: null
    },
    level: {
      config: levelConfig,
      customersSpawned: 0,
      customersCompleted: 0,
      finished: false,
      goalAchieved: false,
      nextSpawn: 0,
      active: true
    },
    order: createEmptyOrder(),
    customers: [],
    settings: save.settings
  };

  const store = createStore(initialState);

  const hudElement = document.querySelector<HTMLDivElement>('#app .hud');
  const barElement = document.querySelector<HTMLDivElement>('#app .bar');
  const canvasContainer = document.getElementById('game-canvas');

  if (!hudElement || !barElement || !canvasContainer) {
    throw new Error('Missing root elements');
  }

  createHUD(hudElement, store);
  createBar(barElement, store, recipes);

  const pixi = await createPixiApp(canvasContainer);
  const scene = new GameScene({
    store,
    recipes,
    level: levelConfig,
    mount: pixi.entities,
    overlay: pixi.overlay
  });
  scene.start();
  pixi.app.ticker.add((delta) => scene.update(delta));

  if (import.meta.env.DEV) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__COMPLETOS_STORE__ = store;
  }
}

bootstrap().catch((error) => {
  console.error('Failed to start game', error);
  const app = document.getElementById('app');
  if (app) {
    app.textContent = 'No se pudo cargar el juego. Revisa la consola.';
  }
});
