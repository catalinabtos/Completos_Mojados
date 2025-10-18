import type { GameStats, SaveData } from './types';

const SAVE_KEY = 'cr_save';

const defaultSave: SaveData = {
  progress: { world: 1, level: 1 },
  stats: {
    money_total: 0,
    perfect_orders: 0,
    orders_total: 0,
    max_combo: 0,
    abandoned: 0
  },
  settings: { audio: 0.8, contrast: 'normal', lang: 'es-CL' }
};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function loadSave(): SaveData {
  if (!isBrowser()) {
    return clone(defaultSave);
  }

  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return clone(defaultSave);
    }
    const parsed = JSON.parse(raw) as SaveData;
    return {
      progress: parsed.progress ?? clone(defaultSave.progress),
      stats: { ...defaultSave.stats, ...parsed.stats },
      settings: { ...defaultSave.settings, ...parsed.settings }
    };
  } catch (error) {
    console.warn('Failed to parse save data', error);
    return clone(defaultSave);
  }
}

export function persistSave(save: SaveData): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (error) {
    console.warn('Failed to persist save data', error);
  }
}

export function gameStatsFromSave(save: SaveData): GameStats {
  return {
    moneyTotal: save.stats.money_total,
    perfectOrders: save.stats.perfect_orders,
    ordersTotal: save.stats.orders_total,
    maxCombo: save.stats.max_combo,
    abandoned: save.stats.abandoned
  };
}

export function mergeStatsIntoSave(save: SaveData, stats: GameStats): SaveData {
  const next: SaveData = {
    ...save,
    stats: {
      money_total: stats.moneyTotal,
      perfect_orders: stats.perfectOrders,
      orders_total: stats.ordersTotal,
      max_combo: stats.maxCombo,
      abandoned: stats.abandoned
    }
  };
  persistSave(next);
  return next;
}

export function updateProgress(save: SaveData, world: number, level: number): SaveData {
  const next: SaveData = {
    ...save,
    progress: { world, level }
  };
  persistSave(next);
  return next;
}
