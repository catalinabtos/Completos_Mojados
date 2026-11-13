// Guardado solo en el dispositivo: Preferences nativo en iOS, con copia en localStorage.

import { Preferences } from '@capacitor/preferences';

export interface Meta {
  lessons: string[];
  bestVote: number;
  games: number;
  wins: number;
  music: boolean;
  sfx: boolean;
  tutorialDone: boolean;
}

const META_KEY = 'talca.meta';
const SAVE_KEY = 'talca.partida';

export const defaultMeta = (): Meta => ({
  lessons: [], bestVote: 0, games: 0, wins: 0, music: true, sfx: true, tutorialDone: false
});

async function read(key: string): Promise<string | null> {
  try {
    const { value } = await Preferences.get({ key });
    if (value !== null) return value;
  } catch {
    /* sin almacenamiento nativo */
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* modo privado */
  }
  try {
    if (value === null) await Preferences.remove({ key });
    else await Preferences.set({ key, value });
  } catch {
    /* sin almacenamiento nativo */
  }
}

export async function loadMeta(): Promise<Meta> {
  const raw = await read(META_KEY);
  if (!raw) return defaultMeta();
  try {
    return { ...defaultMeta(), ...(JSON.parse(raw) as Partial<Meta>) };
  } catch {
    return defaultMeta();
  }
}

export const saveMeta = (m: Meta) => write(META_KEY, JSON.stringify(m));
export const loadGame = () => read(SAVE_KEY);
export const saveGame = (json: string | null) => write(SAVE_KEY, json);
