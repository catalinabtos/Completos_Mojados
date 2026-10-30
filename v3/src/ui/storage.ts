// Progreso guardado en el dispositivo (localStorage del WebView).

export interface SaveData {
  unlocked: number;
  best: Record<number, number>;
  stars: Record<number, number>;
  sound: boolean;
  tutorialDone: boolean;
}

const KEY = 'completos-mojados-save-v1';

const DEFAULTS: SaveData = { unlocked: 1, best: {}, stars: {}, sound: true, tutorialDone: false };

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    return { ...structuredClone(DEFAULTS), ...(JSON.parse(raw) as Partial<SaveData>) };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export function writeSave(save: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Sin almacenamiento disponible: el juego sigue funcionando sin guardar.
  }
}
