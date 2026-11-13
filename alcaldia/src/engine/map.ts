// Mapa de Talca en damero: el Río Claro al poniente, calles cada tres casillas
// y manzanas de 2 × 2. Todo es determinista para que el mapa se reconozca entre partidas.

export const COLS = 12;
export const ROWS = 18;

export type TileKind = 'river' | 'bridge' | 'road' | 'lot' | 'plaza' | 'muni';

export interface Pt {
  x: number;
  y: number;
}

const ROAD_COLS = new Set([1, 4, 7, 10]);
const isRoadRow = (y: number) => y % 3 === 2;

export const PLAZA: Pt[] = [
  { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 5, y: 7 }, { x: 6, y: 7 }
];
export const MUNI: Pt[] = [
  { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 8, y: 7 }, { x: 9, y: 7 }
];
/** Casilla de calle donde parten las cuadrillas: frente a la Municipalidad. */
export const BASE: Pt = { x: 8, y: 8 };

const inSet = (list: Pt[], x: number, y: number) => list.some((p) => p.x === x && p.y === y);

export function tileKind(x: number, y: number): TileKind {
  if (x === 0) return isRoadRow(y) && (y === 5 || y === 11) ? 'bridge' : 'river';
  if (ROAD_COLS.has(x) || isRoadRow(y)) return 'road';
  if (inSet(PLAZA, x, y)) return 'plaza';
  if (inSet(MUNI, x, y)) return 'muni';
  return 'lot';
}

export const isWalkable = (k: TileKind) => k === 'road' || k === 'bridge';

export interface Barrio {
  id: number;
  name: string;
  /** Casilla donde se dibuja el letrero del barrio. */
  sign: Pt;
}

export const BARRIOS: Barrio[] = [
  { id: 0, name: 'La Florida', sign: { x: 2, y: 0 } },
  { id: 1, name: 'Las Américas', sign: { x: 8, y: 0 } },
  { id: 2, name: 'Centro', sign: { x: 2, y: 6 } },
  { id: 3, name: 'Oriente', sign: { x: 11, y: 6 } },
  { id: 4, name: 'Carlos Trupp', sign: { x: 2, y: 12 } },
  { id: 5, name: 'Faustino González', sign: { x: 8, y: 12 } }
];

export function barrioOf(x: number, y: number): number {
  const east = x >= 7 ? 1 : 0;
  const band = y <= 4 ? 0 : y <= 10 ? 1 : 2;
  return band * 2 + east;
}

/** Sitios eriazos donde se puede construir: tres por barrio. */
export const EMPTY_LOTS: Pt[] = [
  { x: 3, y: 1 }, { x: 5, y: 3 }, { x: 2, y: 4 },
  { x: 9, y: 0 }, { x: 11, y: 3 }, { x: 8, y: 4 },
  { x: 3, y: 7 }, { x: 2, y: 9 }, { x: 6, y: 10 },
  { x: 11, y: 7 }, { x: 9, y: 9 }, { x: 11, y: 10 },
  { x: 3, y: 13 }, { x: 5, y: 15 }, { x: 2, y: 16 },
  { x: 8, y: 12 }, { x: 11, y: 13 }, { x: 9, y: 16 }
];

export const isEmptyLot = (x: number, y: number) => inSet(EMPTY_LOTS, x, y);

/** Casas: lotes que no son sitio eriazo. */
export const HOUSES: Pt[] = [];
export const ROADS: Pt[] = [];
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    const k = tileKind(x, y);
    if (k === 'lot' && !isEmptyLot(x, y)) HOUSES.push({ x, y });
    if (k === 'road') ROADS.push({ x, y });
  }
}

/** Calle vecina a una casilla (para atender algo que está en un lote). */
export function roadNear(p: Pt): Pt {
  if (isWalkable(tileKind(p.x, p.y))) return p;
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  for (const [dx, dy] of dirs) {
    const x = p.x + dx;
    const y = p.y + dy;
    if (x >= 0 && y >= 0 && x < COLS && y < ROWS && isWalkable(tileKind(x, y))) return { x, y };
  }
  return BASE;
}

/** Camino más corto por las calles (BFS). Devuelve las casillas sin la de partida. */
export function findPath(from: Pt, to: Pt): Pt[] {
  const start = { x: Math.round(from.x), y: Math.round(from.y) };
  const key = (x: number, y: number) => y * COLS + x;
  const prev = new Map<number, number>();
  const queue: number[] = [key(start.x, start.y)];
  prev.set(queue[0], -1);
  const goal = key(to.x, to.y);
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === goal) break;
    const cx = cur % COLS;
    const cy = Math.floor(cur / COLS);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      if (!isWalkable(tileKind(nx, ny))) continue;
      const k = key(nx, ny);
      if (prev.has(k)) continue;
      prev.set(k, cur);
      queue.push(k);
    }
  }
  if (!prev.has(goal)) return [];
  const path: Pt[] = [];
  for (let k = goal; k !== -1 && k !== key(start.x, start.y); k = prev.get(k)!) {
    path.push({ x: k % COLS, y: Math.floor(k / COLS) });
  }
  return path.reverse();
}
