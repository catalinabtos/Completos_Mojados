// Progreso guardado en el dispositivo (localStorage del WebView).

import { sanitizeCart, type CartState } from '../engine/upgrades';

export interface SaveData extends CartState {
  unlocked: number;
  best: Record<number, number>;
  stars: Record<number, number>;
  sound: boolean;
  tutorialDone: boolean;
  storySeen: number[];
}

const KEY = 'completos-mojados-save-v1';

function defaults(): SaveData {
  return { unlocked: 1, best: {}, stars: {}, sound: true, tutorialDone: false, storySeen: [], wallet: 0, upgrades: {}, decorOwned: [], decorOn: [] };
}

/** Lee un guardado; los de versiones anteriores, sin alcancía, parten con ella vacía. */
export function parseSave(raw: string | null): SaveData {
  if (!raw) return defaults();
  try {
    const data = JSON.parse(raw) as Partial<SaveData>;
    return { ...defaults(), ...data, ...sanitizeCart(data), storySeen: Array.isArray(data.storySeen) ? data.storySeen : [] };
  } catch {
    return defaults();
  }
}

export function loadSave(): SaveData {
  try {
    return parseSave(localStorage.getItem(KEY));
  } catch {
    return defaults();
  }
}

export function writeSave(save: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Sin almacenamiento disponible: el juego sigue funcionando sin guardar.
  }
}

/** Progreso de cero: se conservan solo las preferencias del jugador. */
export function resetSave(save: SaveData): SaveData {
  return { ...defaults(), sound: save.sound, tutorialDone: save.tutorialDone };
}
