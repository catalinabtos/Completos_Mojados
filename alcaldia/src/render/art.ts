// Arte del juego en pixel art: íconos de problemas, vehículos, casas, edificios y retratos.
// Grilla de 16 px por casilla; una sola paleta (pixel.ts).

import type { BuildingId, DeptId, KindId, Speaker } from '../engine/content';
import { PAL, drawn, flipX, hash, makeCanvas, outline, px, rect, sprite, type Ctx } from './pixel';

// ── Íconos de problemas (9 × 9) ──────────────────────────────────────────────

const ICON_ROWS: Record<KindId, string[]> = {
  bache: [
    '....k....',
    '...kok...',
    '...kwk...',
    '..kooOk..',
    '..kwwwk..',
    '.kooooOk.',
    '.kwwwwwk.',
    'kkkkkkkkk',
    '.........'
  ],
  agua: [
    '....k....',
    '...kbk...',
    '..kbbbk..',
    '..kbcbk..',
    '.kbbcbbk.',
    '.kbbbbBk.',
    '.kBbbbBk.',
    '..kBBBk..',
    '...kkk...'
  ],
  basura: [
    '...k.k...',
    '....k....',
    '..kkkkk..',
    '.kGGgGGk.',
    'kGggqggGk',
    'kGgggggGk',
    'kGggggGGk',
    '.kGGGGGk.',
    '..kkkkk..'
  ],
  pasto: [
    '..kkkkk..',
    '.kOyoOOk.',
    'kOoOooOOk',
    'kOooOoOOk',
    '.kOOOOOk.',
    '..kkNkk..',
    '....N....',
    '..kNNNk..',
    '.kkkkkkk.'
  ],
  fuego: [
    '....k....',
    '...kek...',
    '..keoek..',
    '..keoek..',
    '.keolok..',
    '.keollek.',
    '.keollek.',
    '..keeek..',
    '...kkk...'
  ],
  luz: [
    '...kkk...',
    '..kZZZk..',
    '.kZwZZzk.',
    '.kZZZZzk.',
    '.kZZZzzk.',
    '..kZzzk..',
    '...kRk...',
    '...kRk...',
    '...kkk...'
  ],
  salud: [
    '.........',
    '...kkk...',
    '...kek...',
    '.kkkekkk.',
    '.keeeeek.',
    '.kkkekkk.',
    '...kek...',
    '...kkk...',
    '.........'
  ],
  vecina: [
    '.........',
    '.kk...kk.',
    'kppk.kppk',
    'kpwppppPk',
    'kpppppppk',
    '.kppppPk.',
    '..kpppk..',
    '...kPk...',
    '....k....'
  ],
  perro: [
    'kk.....kk',
    'kNk...kNk',
    'kNnnnnnNk',
    '.knnnnnk.',
    '.kknnnkk.',
    '.knnnnnk.',
    '..knkknk.',
    '..kkknkk.',
    '...kkk...'
  ]
};

export const ICONS: Record<KindId, HTMLCanvasElement> = Object.fromEntries(
  Object.entries(ICON_ROWS).map(([k, rows]) => [k, sprite(rows)])
) as Record<KindId, HTMLCanvasElement>;

/** Globo con punta (13 × 15) donde va el ícono. */
function pin(fill: string, shade: string): HTMLCanvasElement {
  return drawn(15, 16, (ctx) => {
    rect(ctx, 2, 1, 11, 11, fill);
    rect(ctx, 1, 2, 13, 9, fill);
    rect(ctx, 2, 11, 11, 1, shade);
    rect(ctx, 1, 10, 1, 1, shade);
    rect(ctx, 13, 10, 1, 1, shade);
    rect(ctx, 6, 12, 3, 1, shade);
    rect(ctx, 7, 13, 1, 1, shade);
  });
}

export const PIN = pin('w', 'W');
export const PIN_ALERT = pin('e', 'E');
export const PIN_QUEUED = pin('Z', 'z');

// ── Íconos de interfaz (12 × 12) ─────────────────────────────────────────────

export const UI_ICONS = {
  money: sprite([
    '...kkkkk....',
    '..kyyyyyk...',
    '.kyylllyyk..',
    '.kylyyyyyOk.',
    '.kylyOOyyOk.',
    '.kyyyOyyyOk.',
    '.kyyyyOyyOk.',
    '.kyyOOyyyOk.',
    '..kyyyyyOk..',
    '...kOOOOk...',
    '....kkkk....',
    '............'
  ]),
  heart: sprite([
    '............',
    '..kkk..kkk..',
    '.keeek.keeek',
    'kewweekeeeek',
    'keweeeeeeeEk',
    'keeeeeeeeeEk',
    '.keeeeeeeEk.',
    '..keeeeeEk..',
    '...keeeEk...',
    '....keEk....',
    '.....kk.....',
    '............'
  ]),
  eye: sprite([
    '............',
    '............',
    '...kkkkkk...',
    '..kwwwwwwk..',
    '.kwwkbbkwwk.',
    'kwwkbckbkwwk',
    'kwwkbbbbkwwk',
    '.kwwkbbkwwk.',
    '..kwwwwwwk..',
    '...kkkkkk...',
    '............',
    '............'
  ]),
  people: sprite([
    '............',
    '..kkk..kkk..',
    '.khhhkkhhhk.',
    '.khhhkkhhhk.',
    '..kkk..kkk..',
    '.kvvvkkiiik.',
    'kvvvvvkiiiik',
    'kvvvvvkiiiik',
    'kvvvvvkiiiik',
    'kkkkkkkkkkkk',
    '............',
    '............'
  ]),
  hammer: sprite([
    '............',
    '..kkkkk.....',
    '.kzZZZzk....',
    '.kzZZZzzk...',
    '..kkknNkk...',
    '.....knNk...',
    '......knNk..',
    '.......knNk.',
    '........knNk',
    '.........knk',
    '..........k.',
    '............'
  ]),
  pause: sprite([
    '............',
    '..kkk..kkk..',
    '..kwk..kwk..',
    '..kwk..kwk..',
    '..kwk..kwk..',
    '..kwk..kwk..',
    '..kwk..kwk..',
    '..kwk..kwk..',
    '..kwk..kwk..',
    '..kkk..kkk..',
    '............',
    '............'
  ]),
  star: sprite([
    '.....kk.....',
    '....kyyk....',
    '....kyyk....',
    'kkkkkyykkkkk',
    'kyyyylyyyyOk',
    '.kyyyyyyyOk.',
    '..kyyyyyOk..',
    '..kyyOOyyk..',
    '.kyyOkkOyyk.',
    '.kyOk..kOyk.',
    '.kkk....kkk.',
    '............'
  ]),
  book: sprite([
    '............',
    '.kkkkk.kkkk.',
    'kwwwwwkwwwwk',
    'kwzzzwkwzzwk',
    'kwwwwwkwwwwk',
    'kwzzzwkwzzwk',
    'kwwwwwkwwwwk',
    'kwzzwwkwzzwk',
    'kwwwwwkwwwwk',
    'kBBBBBkBBBBk',
    '.kkkkk.kkkk.',
    '............'
  ])
};

// ── Vehículos de cuadrilla (12 × 9) ──────────────────────────────────────────

const DEPT_BODY: Record<DeptId, [string, string]> = {
  obras: ['o', 'O'],
  aseo: ['g', 'G'],
  luz: ['y', 'O'],
  salud: ['w', 'Z'],
  social: ['p', 'P']
};

function vehicle(dept: DeptId, beacon: boolean): HTMLCanvasElement {
  const [body, shade] = DEPT_BODY[dept];
  return drawn(13, 10, (ctx) => {
    // carrocería
    rect(ctx, 1, 3, 11, 4, body);
    rect(ctx, 1, 6, 11, 1, shade);
    rect(ctx, 6, 1, 6, 2, body);
    // ventana de la cabina
    rect(ctx, 8, 2, 3, 2, 'c');
    // franja o cruz
    if (dept === 'salud') {
      rect(ctx, 3, 3, 3, 1, 'e');
      rect(ctx, 4, 2, 1, 3, 'e');
    } else {
      rect(ctx, 2, 4, 5, 1, 'w');
    }
    // ruedas
    rect(ctx, 2, 7, 2, 2, 'k');
    rect(ctx, 9, 7, 2, 2, 'k');
    // baliza
    rect(ctx, 7, 0, 2, 1, beacon ? (dept === 'salud' ? 'e' : 'o') : 'z');
  });
}

export const VEHICLES: Record<DeptId, HTMLCanvasElement[]> = Object.fromEntries(
  (['obras', 'aseo', 'luz', 'salud', 'social'] as DeptId[]).map((d) => {
    const a = vehicle(d, false);
    const b = vehicle(d, true);
    return [d, [a, b, flipX(a), flipX(b)]];
  })
) as Record<DeptId, HTMLCanvasElement[]>;

/** Trabajador chiquito (5 × 8) con casco del color del departamento. */
export const WORKERS: Record<DeptId, HTMLCanvasElement[]> = Object.fromEntries(
  (['obras', 'aseo', 'luz', 'salud', 'social'] as DeptId[]).map((d) => {
    const [body] = DEPT_BODY[d];
    const frame = (arm: boolean) =>
      drawn(7, 10, (ctx) => {
        rect(ctx, 2, 1, 3, 1, body);
        rect(ctx, 2, 2, 3, 2, 'h');
        rect(ctx, 2, 4, 3, 3, body);
        rect(ctx, arm ? 5 : 1, arm ? 3 : 5, 1, 2, 'h');
        rect(ctx, 2, 7, 1, 2, 'U');
        rect(ctx, 4, 7, 1, 2, 'U');
      });
    return [d, [frame(false), frame(true)]];
  })
) as Record<DeptId, HTMLCanvasElement[]>;

// ── Tráfico y peatones de ambiente ───────────────────────────────────────────

const CAR_COLORS = [['e', 'E'], ['b', 'B'], ['w', 'Z'], ['i', 'I'], ['v', 'V'], ['l', 'y']];
export const CARS = CAR_COLORS.map(([body, shade]) => {
  const c = drawn(10, 7, (ctx) => {
    rect(ctx, 1, 2, 8, 3, body);
    rect(ctx, 2, 1, 5, 1, body);
    rect(ctx, 1, 4, 8, 1, shade);
    rect(ctx, 3, 1, 3, 1, 'c');
    rect(ctx, 2, 5, 2, 1, 'k');
    rect(ctx, 6, 5, 2, 1, 'k');
  });
  return [c, flipX(c)];
});

const SHIRTS = ['e', 'b', 'y', 'p', 'i', 'v', 'o', 'g'];
const SKINS = ['h', 'H', 'j', 'J'];
export const WALKERS = SHIRTS.map((shirt, i) => {
  const skin = SKINS[i % SKINS.length];
  const hair = i % 3 === 0 ? 'N' : i % 3 === 1 ? 'k' : 'O';
  const f = (step: boolean) =>
    drawn(5, 9, (ctx) => {
      rect(ctx, 1, 0, 3, 1, hair);
      rect(ctx, 1, 1, 3, 2, skin);
      rect(ctx, 1, 3, 3, 3, shirt);
      rect(ctx, step ? 1 : 2, 6, 1, 2, 'U');
      rect(ctx, step ? 3 : 2, 6, 1, 2, 'U');
    });
  return [f(false), f(true)];
});

// ── Casillas del mapa (16 × 16) ──────────────────────────────────────────────

export type Season = 'verano' | 'otono' | 'invierno' | 'primavera';

export function seasonOf(monthOfYear: number): Season {
  if (monthOfYear <= 1 || monthOfYear === 11) return 'verano';
  if (monthOfYear <= 4) return 'otono';
  if (monthOfYear <= 7) return 'invierno';
  return 'primavera';
}

const GRASS: Record<Season, [string, string, string]> = {
  verano: ['#86b85a', '#a7cf6c', '#6a9c4b'],
  otono: ['#8aae58', '#c9b65b', '#6f8f47'],
  invierno: ['#5f9f5c', '#7cbd6e', '#4b8250'],
  primavera: ['#6fb35a', '#9bd46b', '#4b8a47']
};

export function grass(ctx: Ctx, ox: number, oy: number, season: Season, tx: number, ty: number) {
  const [base, light, dark] = GRASS[season];
  rect(ctx, ox, oy, 16, 16, base);
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(hash(tx, ty, i) * 16);
    const y = Math.floor(hash(tx, ty, i + 20) * 16);
    rect(ctx, ox + x, oy + y, 1, 1, i % 2 ? light : dark);
  }
  if (season === 'primavera') {
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(hash(tx, ty, i + 40) * 15);
      const y = Math.floor(hash(tx, ty, i + 50) * 15);
      rect(ctx, ox + x, oy + y, 1, 1, i % 2 ? '#ffffff' : '#f6a5c0');
    }
  }
}

const TREE_TOP: Record<Season, [string, string, string]> = {
  verano: ['#4f9a4f', '#6fbf5c', '#357a43'],
  otono: ['#e0902f', '#f2c14b', '#b0582a'],
  invierno: ['#4a8a5a', '#5ea56a', '#336b48'],
  primavera: ['#5fb05a', '#8fd46b', '#3f8f4f']
};

export function tree(ctx: Ctx, ox: number, oy: number, season: Season, size = 1) {
  const [base, light, dark] = TREE_TOP[season];
  const w = 8 + size * 2;
  const x0 = ox - Math.floor(w / 2);
  // sombra
  rect(ctx, x0 + 1, oy + w - 1, w - 1, 2, 'rgba(43,33,53,0.25)');
  rect(ctx, ox - 1, oy + w - 4, 2, 4, 'N');
  rect(ctx, x0 + 1, oy, w - 2, w - 3, base);
  rect(ctx, x0, oy + 1, w, w - 5, base);
  rect(ctx, x0 + 2, oy + 1, 3, 2, light);
  rect(ctx, x0 + 1, oy + w - 5, w - 2, 1, dark);
  rect(ctx, x0 + w - 3, oy + 2, 2, 3, dark);
  // contorno
  ctx.fillStyle = PAL.k;
  ctx.fillRect(x0 + 1, oy - 1, w - 2, 1);
  ctx.fillRect(x0 - 1, oy + 1, 1, w - 5);
  ctx.fillRect(x0 + w, oy + 1, 1, w - 5);
  ctx.fillRect(x0, oy, 1, 1);
  ctx.fillRect(x0 + w - 1, oy, 1, 1);
  ctx.fillRect(x0, oy + w - 4, 1, 1);
  ctx.fillRect(x0 + w - 1, oy + w - 4, 1, 1);
  ctx.fillRect(x0 + 1, oy + w - 3, w - 2, 1);
}

const WALLS = ['#f0dcb8', '#f7c9c9', '#c6e2f0', '#fbe7a1', '#cfe8c4', '#e8d0ef', '#f6d2a8', '#ffffff'];
const DOORS = ['#9a6a43', '#3a78b8', '#4b8a47', '#a52f3a'];

/** Casa de fachada continua con techo de tejas, como en el centro de Talca. */
export function house(ctx: Ctx, ox: number, oy: number, tx: number, ty: number, season: Season) {
  const r = hash(tx, ty, 7);
  if (r < 0.14) {
    // patio con árbol
    grass(ctx, ox, oy, season, tx, ty);
    tree(ctx, ox + 8, oy + 3, season, 1);
    return;
  }
  const wall = WALLS[Math.floor(hash(tx, ty, 3) * WALLS.length)];
  const door = DOORS[Math.floor(hash(tx, ty, 4) * DOORS.length)];
  const twoStory = hash(tx, ty, 5) < 0.25;
  const roofH = twoStory ? 4 : 6;
  // techo de tejas
  rect(ctx, ox, oy, 16, roofH, 't');
  for (let y = 1; y < roofH; y += 2) {
    for (let x = (y % 4 === 1 ? 0 : 2); x < 16; x += 4) rect(ctx, ox + x, oy + y, 2, 1, 'T');
  }
  rect(ctx, ox, oy + roofH, 16, 1, 'T');
  rect(ctx, ox, oy + roofH + 1, 16, 1, 'k');
  // muro
  const wallTop = oy + roofH + 2;
  rect(ctx, ox, wallTop, 16, 16 - roofH - 2, wall);
  rect(ctx, ox, oy + 15, 16, 1, 'A');
  rect(ctx, ox, wallTop, 16, 1, 'rgba(43,33,53,0.18)');
  // puerta y ventanas
  const doorX = ox + (hash(tx, ty, 6) < 0.5 ? 2 : 10);
  rect(ctx, doorX, oy + 10, 4, 6, 'k');
  rect(ctx, doorX + 1, oy + 11, 2, 5, door);
  rect(ctx, doorX + 2, oy + 13, 1, 1, 'y');
  const winX = doorX === ox + 2 ? ox + 9 : ox + 2;
  const winY = twoStory ? oy + 7 : oy + 9;
  rect(ctx, winX, winY, 5, 4, 'k');
  rect(ctx, winX + 1, winY + 1, 3, 2, 'c');
  rect(ctx, winX + 1, winY + 1, 1, 1, 'w');
  if (twoStory) {
    rect(ctx, doorX, oy + 6, 4, 3, 'k');
    rect(ctx, doorX + 1, oy + 7, 2, 1, 'c');
    rect(ctx, winX, winY + 5, 5, 3, 'k');
    rect(ctx, winX + 1, winY + 6, 3, 1, 'c');
  }
  // macetero
  if (hash(tx, ty, 8) < 0.4) {
    rect(ctx, winX, winY + 4, 5, 1, 'n');
    rect(ctx, winX + 1, winY + 3, 1, 1, 'p');
    rect(ctx, winX + 3, winY + 3, 1, 1, 'e');
  }
  // separación con la casa vecina
  rect(ctx, ox + 15, wallTop, 1, 16 - roofH - 2, 'rgba(43,33,53,0.2)');
}

export function emptyLot(ctx: Ctx, ox: number, oy: number, tx: number, ty: number) {
  rect(ctx, ox, oy, 16, 16, '#c9a978');
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(hash(tx, ty, i + 60) * 16);
    const y = Math.floor(hash(tx, ty, i + 80) * 16);
    rect(ctx, ox + x, oy + y, 1, 1, i % 3 ? '#b08e5f' : '#8aa04f');
  }
  // pasto seco y una reja caída
  rect(ctx, ox + 3, oy + 5, 1, 2, '#7d9a46');
  rect(ctx, ox + 4, oy + 4, 1, 3, '#7d9a46');
  rect(ctx, ox + 11, oy + 9, 1, 2, '#7d9a46');
  rect(ctx, ox + 12, oy + 8, 1, 3, '#7d9a46');
  rect(ctx, ox, oy + 14, 16, 1, 'N');
  for (let x = 1; x < 16; x += 3) rect(ctx, ox + x, oy + 12, 1, 3, 'N');
}

// ── Edificios que construye el jugador (16 × 16) ────────────────────────────

function pad(ctx: Ctx, col = '#d8d2c4') {
  rect(ctx, 0, 0, 16, 16, col);
  rect(ctx, 0, 15, 16, 1, 'S');
}

const BUILDING_ART: Record<BuildingId, (ctx: Ctx, season: Season) => void> = {
  contenedores: (ctx) => {
    pad(ctx);
    const bins: [string, string][] = [['g', 'G'], ['y', 'O'], ['b', 'B']];
    bins.forEach(([c, d], i) => {
      const x = 1 + i * 5;
      rect(ctx, x, 5, 4, 9, 'k');
      rect(ctx, x + 1, 6, 2, 7, c);
      rect(ctx, x + 1, 12, 2, 1, d);
      rect(ctx, x, 4, 4, 1, d);
      rect(ctx, x + 1, 8, 2, 1, 'w');
    });
    rect(ctx, 5, 1, 6, 2, 'g');
    rect(ctx, 6, 0, 4, 1, 'G');
  },
  led: (ctx, season) => {
    grass(ctx, 0, 0, season, 99, 1);
    rect(ctx, 0, 11, 16, 5, 's');
    for (const x of [3, 12]) {
      rect(ctx, x - 3, 0, 7, 6, 'rgba(255,240,160,0.35)');
      rect(ctx, x, 3, 1, 10, 'k');
      rect(ctx, x - 1, 2, 3, 1, 'k');
      rect(ctx, x - 1, 3, 3, 1, 'l');
      rect(ctx, x - 1, 13, 3, 1, 'k');
    }
  },
  colector: (ctx) => {
    pad(ctx, '#b9c3cc');
    rect(ctx, 2, 3, 12, 9, 'k');
    rect(ctx, 3, 4, 10, 7, 'R');
    for (let x = 4; x < 13; x += 2) rect(ctx, x, 4, 1, 7, 'k');
    rect(ctx, 0, 13, 16, 2, 'B');
    rect(ctx, 0, 13, 16, 1, 'b');
    rect(ctx, 6, 0, 4, 3, 'b');
    rect(ctx, 7, 1, 1, 1, 'c');
  },
  cesfam: (ctx) => {
    rect(ctx, 0, 0, 16, 4, 'm');
    rect(ctx, 0, 3, 16, 1, 'M');
    rect(ctx, 0, 4, 16, 1, 'k');
    rect(ctx, 0, 5, 16, 11, 'w');
    rect(ctx, 0, 15, 16, 1, 'W');
    rect(ctx, 6, 6, 4, 4, 'e');
    rect(ctx, 7, 5, 2, 6, 'e');
    rect(ctx, 5, 7, 6, 2, 'e');
    rect(ctx, 6, 11, 4, 5, 'k');
    rect(ctx, 7, 12, 2, 4, 'c');
    rect(ctx, 1, 7, 3, 3, 'k');
    rect(ctx, 2, 8, 1, 1, 'c');
    rect(ctx, 12, 7, 3, 3, 'k');
    rect(ctx, 13, 8, 1, 1, 'c');
  },
  plaza: (ctx, season) => {
    grass(ctx, 0, 0, season, 98, 2);
    rect(ctx, 1, 10, 7, 5, 'y');
    rect(ctx, 1, 14, 7, 1, 'O');
    // columpio
    rect(ctx, 9, 3, 1, 9, 'e');
    rect(ctx, 15, 3, 1, 9, 'e');
    rect(ctx, 9, 3, 7, 1, 'E');
    rect(ctx, 11, 4, 1, 4, 'z');
    rect(ctx, 13, 4, 1, 4, 'z');
    rect(ctx, 10, 8, 5, 1, 'n');
    tree(ctx, 4, 1, season, 0);
  },
  sede: (ctx) => {
    rect(ctx, 0, 0, 16, 5, 'v');
    for (let x = 0; x < 16; x += 3) rect(ctx, x, 2, 2, 1, 'V');
    rect(ctx, 0, 5, 16, 1, 'k');
    rect(ctx, 0, 6, 16, 10, 'i');
    rect(ctx, 0, 15, 16, 1, 'I');
    rect(ctx, 2, 7, 12, 3, 'w');
    rect(ctx, 3, 8, 2, 1, 'e');
    rect(ctx, 6, 8, 2, 1, 'b');
    rect(ctx, 9, 8, 2, 1, 'y');
    rect(ctx, 12, 8, 1, 1, 'g');
    rect(ctx, 6, 11, 4, 5, 'k');
    rect(ctx, 7, 12, 2, 4, 'n');
  },
  adopcion: (ctx, season) => {
    grass(ctx, 0, 0, season, 97, 3);
    rect(ctx, 0, 13, 16, 1, 'n');
    for (let x = 0; x < 16; x += 3) rect(ctx, x, 11, 1, 4, 'n');
    // casita del perro
    rect(ctx, 2, 4, 8, 7, 'n');
    rect(ctx, 1, 3, 10, 2, 'e');
    rect(ctx, 3, 2, 6, 1, 'e');
    rect(ctx, 5, 7, 3, 4, 'k');
    // perrito
    rect(ctx, 11, 7, 4, 3, 'a');
    rect(ctx, 13, 5, 3, 3, 'a');
    rect(ctx, 14, 6, 1, 1, 'k');
    rect(ctx, 11, 10, 1, 1, 'A');
    rect(ctx, 14, 10, 1, 1, 'A');
    rect(ctx, 10, 6, 1, 2, 'a');
  }
};

const buildingCache = new Map<string, HTMLCanvasElement>();
export function buildingArt(id: BuildingId, season: Season): HTMLCanvasElement {
  const key = `${id}-${season}`;
  let c = buildingCache.get(key);
  if (!c) {
    const [cv, ctx] = makeCanvas(16, 16);
    BUILDING_ART[id](ctx, season);
    c = cv;
    buildingCache.set(key, c);
  }
  return c;
}

// ── Municipalidad y Plaza de Armas (32 × 32) ────────────────────────────────

export function muni(ctx: Ctx, ox: number, oy: number) {
  rect(ctx, ox, oy, 32, 32, '#d8d2c4');
  // techo
  rect(ctx, ox + 1, oy + 6, 30, 5, 't');
  for (let x = 2; x < 30; x += 4) rect(ctx, ox + x, oy + 8, 2, 1, 'T');
  rect(ctx, ox + 1, oy + 10, 30, 1, 'T');
  rect(ctx, ox + 1, oy + 11, 30, 1, 'k');
  // frontón
  rect(ctx, ox + 11, oy + 3, 10, 3, 'w');
  rect(ctx, ox + 13, oy + 2, 6, 1, 'w');
  rect(ctx, ox + 15, oy + 4, 2, 1, 'y');
  // muro con columnas
  rect(ctx, ox + 1, oy + 12, 30, 16, 'w');
  for (let x = 3; x < 30; x += 5) rect(ctx, ox + x, oy + 12, 2, 16, 'W');
  // ventanas
  for (const x of [5, 10, 20, 25]) {
    rect(ctx, ox + x, oy + 15, 3, 5, 'k');
    rect(ctx, ox + x + 1, oy + 16, 1, 3, 'c');
  }
  // puerta
  rect(ctx, ox + 13, oy + 18, 6, 10, 'k');
  rect(ctx, ox + 14, oy + 19, 4, 9, 'n');
  rect(ctx, ox + 16, oy + 19, 1, 9, 'N');
  // escalinata
  rect(ctx, ox + 10, oy + 28, 12, 2, 'Z');
  rect(ctx, ox + 9, oy + 30, 14, 1, 'z');
  // bandera de Chile
  rect(ctx, ox + 26, oy, 1, 7, 'k');
  rect(ctx, ox + 27, oy, 3, 2, 'B');
  px(ctx, ox + 28, oy, 'w');
  rect(ctx, ox + 30, oy, 3, 1, 'w');
  rect(ctx, ox + 27, oy + 2, 6, 1, 'e');
  rect(ctx, ox + 30, oy + 1, 3, 1, 'w');
}

export function plazaDeArmas(ctx: Ctx, ox: number, oy: number, season: Season) {
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) grass(ctx, ox + x * 16, oy + y * 16, season, 50 + x, 50 + y);
  // senderos en cruz y diagonales
  rect(ctx, ox + 14, oy, 4, 32, 's');
  rect(ctx, ox, oy + 14, 32, 4, 's');
  for (let i = 0; i < 32; i++) {
    rect(ctx, ox + i, oy + i, 2, 2, 's');
    rect(ctx, ox + 31 - i - 1, oy + i, 2, 2, 's');
  }
  // pileta
  rect(ctx, ox + 10, oy + 10, 12, 12, 'k');
  rect(ctx, ox + 11, oy + 11, 10, 10, 'Z');
  rect(ctx, ox + 12, oy + 12, 8, 8, 'b');
  rect(ctx, ox + 13, oy + 13, 3, 1, 'c');
  rect(ctx, ox + 15, oy + 15, 2, 2, 'w');
  // árboles en las esquinas
  tree(ctx, ox + 5, oy + 1, season, 0);
  tree(ctx, ox + 27, oy + 1, season, 0);
  tree(ctx, ox + 5, oy + 22, season, 0);
  tree(ctx, ox + 27, oy + 22, season, 0);
  // bancas
  rect(ctx, ox + 2, oy + 12, 4, 1, 'N');
  rect(ctx, ox + 26, oy + 19, 4, 1, 'N');
}

// ── Retratos (24 × 24) ───────────────────────────────────────────────────────

interface Look {
  skin: string;
  hair: string;
  style: 'short' | 'long' | 'bun' | 'curly' | 'cap' | 'helmet' | 'bald';
  shirt: string;
  shirtShade: string;
  bg: string;
  glasses?: boolean;
  tie?: string;
  mustache?: boolean;
  beard?: boolean;
  earrings?: boolean;
  collar?: boolean;
  mic?: boolean;
  hatColor?: string;
}

function portrait(l: Look): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(24, 24);
  rect(ctx, 0, 0, 24, 24, l.bg);
  // pelo largo por detrás
  const fig = drawn(24, 24, (f) => {
    if (l.style === 'long') rect(f, 5, 6, 14, 13, l.hair);
    if (l.style === 'curly') {
      rect(f, 5, 3, 14, 9, l.hair);
      for (const [x, y] of [[4, 5], [19, 5], [4, 9], [19, 9], [6, 2], [10, 2], [14, 2], [17, 3]]) rect(f, x, y, 2, 2, l.hair);
    }
    // cuerpo
    rect(f, 3, 19, 18, 5, l.shirt);
    rect(f, 4, 18, 16, 1, l.shirt);
    rect(f, 3, 23, 18, 1, l.shirtShade);
    // cuello
    rect(f, 10, 15, 4, 4, l.skin);
    // cabeza
    rect(f, 7, 5, 10, 11, l.skin);
    rect(f, 6, 7, 12, 7, l.skin);
    // orejas
    rect(f, 5, 9, 1, 3, l.skin);
    rect(f, 18, 9, 1, 3, l.skin);
    // peinados
    if (l.style === 'short' || l.style === 'bun') {
      rect(f, 7, 3, 10, 3, l.hair);
      rect(f, 6, 4, 12, 3, l.hair);
      rect(f, 6, 7, 1, 3, l.hair);
      rect(f, 17, 7, 1, 3, l.hair);
    }
    if (l.style === 'bun') rect(f, 9, 0, 6, 3, l.hair);
    if (l.style === 'long') {
      rect(f, 7, 3, 10, 3, l.hair);
      rect(f, 6, 4, 12, 3, l.hair);
      rect(f, 6, 7, 1, 6, l.hair);
      rect(f, 17, 7, 1, 6, l.hair);
    }
    if (l.style === 'cap' || l.style === 'helmet') {
      rect(f, 7, 2, 10, 4, l.hatColor ?? 'e');
      rect(f, 6, 4, 12, 2, l.hatColor ?? 'e');
      rect(f, l.style === 'cap' ? 14 : 5, 6, l.style === 'cap' ? 6 : 14, 1, l.hatColor ?? 'e');
      rect(f, 6, 7, 1, 2, l.hair);
      rect(f, 17, 7, 1, 2, l.hair);
    }
    if (l.style === 'bald') {
      rect(f, 6, 7, 1, 3, l.hair);
      rect(f, 17, 7, 1, 3, l.hair);
    }
  });
  ctx.drawImage(fig, 0, 0);
  // detalles (sin contorno extra)
  const skinShade = l.skin === 'h' ? 'H' : l.skin === 'H' ? 'j' : l.skin === 'j' ? 'J' : 'k';
  rect(ctx, 7, 15, 10, 1, skinShade);
  rect(ctx, 9, 9, 1, 2, 'k');
  rect(ctx, 14, 9, 1, 2, 'k');
  rect(ctx, 8, 12, 1, 1, 'p');
  rect(ctx, 15, 12, 1, 1, 'p');
  rect(ctx, 11, 13, 2, 1, 'E');
  rect(ctx, 10, 12, 1, 1, 'E');
  rect(ctx, 13, 12, 1, 1, 'E');
  if (l.style === 'helmet') {
    rect(ctx, 11, 3, 2, 2, 'y');
  }
  if (l.glasses) {
    rect(ctx, 8, 8, 3, 1, 'k');
    rect(ctx, 13, 8, 3, 1, 'k');
    rect(ctx, 8, 8, 1, 3, 'k');
    rect(ctx, 10, 8, 1, 3, 'k');
    rect(ctx, 13, 8, 1, 3, 'k');
    rect(ctx, 15, 8, 1, 3, 'k');
    rect(ctx, 8, 10, 3, 1, 'k');
    rect(ctx, 13, 10, 3, 1, 'k');
    rect(ctx, 11, 9, 2, 1, 'k');
    rect(ctx, 9, 9, 1, 1, 'c');
    rect(ctx, 14, 9, 1, 1, 'c');
  }
  if (l.mustache) rect(ctx, 10, 12, 4, 1, l.hair);
  if (l.beard) {
    rect(ctx, 7, 12, 1, 3, l.hair);
    rect(ctx, 16, 12, 1, 3, l.hair);
    rect(ctx, 8, 14, 8, 2, l.hair);
    rect(ctx, 11, 13, 2, 1, 'E');
  }
  if (l.earrings) {
    rect(ctx, 5, 12, 1, 1, 'y');
    rect(ctx, 18, 12, 1, 1, 'y');
  }
  if (l.collar) {
    rect(ctx, 9, 18, 2, 2, 'w');
    rect(ctx, 13, 18, 2, 2, 'w');
  }
  if (l.tie) {
    rect(ctx, 11, 19, 2, 1, l.tie);
    rect(ctx, 11, 20, 2, 4, l.tie);
  }
  if (l.mic) {
    rect(ctx, 18, 15, 3, 3, 'k');
    rect(ctx, 19, 16, 1, 1, 'z');
    rect(ctx, 19, 18, 1, 5, 'k');
  }
  return c;
}

export const SPEAKERS: Record<Speaker, HTMLCanvasElement> = {
  vecina: portrait({ skin: 'H', hair: 'Z', style: 'bun', shirt: 'v', shirtShade: 'V', bg: '#f6e3c2', glasses: true, earrings: true }),
  concejal: portrait({ skin: 'h', hair: 'k', style: 'short', shirt: 'I', shirtShade: 'U', bg: '#cfe3ef', collar: true }),
  empresario: portrait({ skin: 'h', hair: 'N', style: 'short', shirt: 'd', shirtShade: 'k', bg: '#e5d6c9', tie: 'e', mustache: true, collar: true }),
  asesora: portrait({ skin: 'j', hair: 'N', style: 'long', shirt: 'g', shirtShade: 'G', bg: '#e2efd6', glasses: true }),
  periodista: portrait({ skin: 'H', hair: 'O', style: 'curly', shirt: 'o', shirtShade: 'O', bg: '#fbe2c3', mic: true }),
  fiscal: portrait({ skin: 'h', hair: 'K', style: 'short', shirt: 'U', shirtShade: 'k', bg: '#dcdcea', glasses: true, collar: true, tie: 'B' }),
  bombero: portrait({ skin: 'j', hair: 'k', style: 'helmet', hatColor: 'e', shirt: 'y', shirtShade: 'O', bg: '#f7d7c7', mustache: true }),
  joven: portrait({ skin: 'J', hair: 'k', style: 'curly', shirt: 'b', shirtShade: 'B', bg: '#d6ebf5', earrings: true }),
  primo: portrait({ skin: 'H', hair: 'k', style: 'cap', hatColor: 'b', shirt: 'e', shirtShade: 'E', bg: '#f5e0d0', mustache: true })
};

export interface Avatar {
  title: 'Alcaldesa' | 'Alcalde';
  art: HTMLCanvasElement;
}

export const AVATARS: Avatar[] = [
  { title: 'Alcaldesa', art: portrait({ skin: 'h', hair: 'k', style: 'long', shirt: 'e', shirtShade: 'E', bg: '#fde6b0', earrings: true, collar: true }) },
  { title: 'Alcalde', art: portrait({ skin: 'j', hair: 'k', style: 'short', shirt: 'u', shirtShade: 'U', bg: '#cfe8f5', beard: true, collar: true }) },
  { title: 'Alcaldesa', art: portrait({ skin: 'J', hair: 'k', style: 'curly', shirt: 'm', shirtShade: 'M', bg: '#dff1d0', glasses: true }) },
  { title: 'Alcalde', art: portrait({ skin: 'H', hair: 'Z', style: 'short', shirt: 'n', shirtShade: 'N', bg: '#f6d9e6', mustache: true, glasses: true, collar: true }) }
];

/** Candidatura rival: una silueta, sin rasgos de nadie real. */
export const RIVAL = portrait({ skin: 'Z', hair: 'z', style: 'short', shirt: 'z', shirtShade: 'R', bg: '#e6e2ea' });

/** Letrero del barrio con carita según aprobación (13 × 9). */
export function barrioFace(mood: 'feliz' | 'neutral' | 'triste'): HTMLCanvasElement {
  const col = mood === 'feliz' ? 'g' : mood === 'neutral' ? 'y' : 'e';
  return outline(
    (() => {
      const [c, ctx] = makeCanvas(11, 11);
      rect(ctx, 2, 1, 7, 9, col);
      rect(ctx, 1, 2, 9, 7, col);
      px(ctx, 3, 4, 'k');
      px(ctx, 7, 4, 'k');
      if (mood === 'feliz') {
        rect(ctx, 3, 6, 5, 1, 'k');
        px(ctx, 2, 5, 'k');
        px(ctx, 8, 5, 'k');
        rect(ctx, 4, 7, 3, 1, 'k');
      } else if (mood === 'neutral') {
        rect(ctx, 3, 7, 5, 1, 'k');
      } else {
        rect(ctx, 4, 6, 3, 1, 'k');
        px(ctx, 3, 7, 'k');
        px(ctx, 7, 7, 'k');
      }
      return c;
    })()
  );
}

export const FACES = { feliz: barrioFace('feliz'), neutral: barrioFace('neutral'), triste: barrioFace('triste') };

export const DEPT_ICONS: Record<DeptId, HTMLCanvasElement> = {
  obras: ICONS.bache,
  aseo: ICONS.basura,
  luz: sprite([
    '...kkk...',
    '..klllk..',
    '.klwllyk.',
    '.kllllyk.',
    '.kllyyyk.',
    '..klyyk..',
    '...kzk...',
    '...kzk...',
    '...kkk...'
  ]),
  salud: ICONS.salud,
  social: ICONS.vecina
};
