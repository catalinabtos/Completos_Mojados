// Meta-progresión "El carrito crece": mejoras permanentes y decoración que se compran con la plata de la alcancía.
// Cada esquina se puede ganar sin mejoras; ellas solo hacen el turno más cómodo.

import type { LevelConfig } from './data';

export type UpgradeId = 'olla' | 'toalla' | 'fuego' | 'banquitos' | 'radio' | 'repisa';
export type DecorId = 'toldo_verde' | 'toldo_azul' | 'banderitas' | 'macetero' | 'luces';

export interface UpgradeInfo {
  id: UpgradeId;
  name: string;
  /** Qué hace cada nivel de la mejora. */
  effect: string;
  /** Precio de cada nivel; su largo es el nivel máximo. */
  prices: number[];
}

export interface DecorInfo {
  id: DecorId;
  name: string;
  price: number;
  /** Las decoraciones del mismo grupo se excluyen entre sí (por ejemplo, un solo color de toldo). */
  group?: 'toldo';
}

export const UPGRADES: Record<UpgradeId, UpgradeInfo> = {
  olla: { id: 'olla', name: 'Olla más grande', effect: '+1 vienesa en la olla', prices: [15000, 40000] },
  toalla: { id: 'toalla', name: 'Toalla gruesa', effect: 'El pan aguanta 1,5 s más antes de aguarse', prices: [10000, 25000, 50000] },
  fuego: { id: 'fuego', name: 'Fuego parejo', effect: 'La vienesa aguanta 1,5 s más antes de reventarse', prices: [10000, 25000, 50000] },
  banquitos: { id: 'banquitos', name: 'Banquitos', effect: 'Los clientes esperan 2 s más', prices: [12000, 30000, 60000] },
  radio: { id: 'radio', name: 'Radio del carrito', effect: '+5 % de propina', prices: [20000, 45000, 80000] },
  repisa: { id: 'repisa', name: 'Repisa', effect: 'Guarda un completo armado mientras preparas otro', prices: [30000] }
};

export const DECOR: Record<DecorId, DecorInfo> = {
  toldo_verde: { id: 'toldo_verde', name: 'Toldo verde', price: 8000, group: 'toldo' },
  toldo_azul: { id: 'toldo_azul', name: 'Toldo azul', price: 8000, group: 'toldo' },
  banderitas: { id: 'banderitas', name: 'Banderitas', price: 5000 },
  macetero: { id: 'macetero', name: 'Macetero con cardenales', price: 12000 },
  luces: { id: 'luces', name: 'Guirnalda de luces', price: 20000 }
};

export type UpgradeLevels = Partial<Record<UpgradeId, number>>;

export interface GameOptions {
  /** Repisa para guardar un completo armado. */
  shelf: boolean;
  /** Fracción extra de propina (0,05 = +5 %). */
  tipBonus: number;
}

export function upgradeLevel(levels: UpgradeLevels, id: UpgradeId): number {
  return Math.max(0, Math.min(UPGRADES[id].prices.length, levels[id] ?? 0));
}

/** Precio del siguiente nivel de una mejora, o null si ya está al máximo. */
export function nextUpgradePrice(levels: UpgradeLevels, id: UpgradeId): number | null {
  return UPGRADES[id].prices[upgradeLevel(levels, id)] ?? null;
}

/** Devuelve la esquina con las mejoras aplicadas, sin modificar la original. */
export function applyUpgrades(level: LevelConfig, levels: UpgradeLevels): LevelConfig {
  const lv = (id: UpgradeId) => upgradeLevel(levels, id);
  return {
    ...level,
    olla: { ...level.olla, slots: level.olla.slots + lv('olla'), hold: level.olla.hold + 1.5 * lv('fuego') },
    vapor: { ...level.vapor, hold: level.vapor.hold + 1.5 * lv('toalla') },
    patience: level.patience + 2 * lv('banquitos')
  };
}

export function gameOptions(levels: UpgradeLevels): GameOptions {
  return { shelf: upgradeLevel(levels, 'repisa') > 0, tipBonus: 0.05 * upgradeLevel(levels, 'radio') };
}
