// Herramientas de pixel art: paleta única, sprites desde texto y contorno automático.

export const PAL: Record<string, string> = {
  k: '#2b2135', K: '#4a3b52',
  w: '#fff8ec', W: '#e6d9c6',
  g: '#6fb35a', G: '#4b8a47', q: '#9bd46b',
  m: '#3f8f5f', M: '#2c6a49',
  r: '#6e6a78', R: '#5a5664',
  y: '#f4d25a', l: '#fff0a0',
  s: '#d8c7ae', S: '#b3a089',
  t: '#cf5a3e', T: '#9b3a2c',
  a: '#f0dcb8', A: '#d2b78f',
  b: '#5fb0e0', B: '#3a78b8', c: '#b4e4f6',
  o: '#ec8f35', O: '#b9662a',
  p: '#ee93b8', P: '#c0618e',
  v: '#8f73c0', V: '#64509a',
  n: '#9a6a43', N: '#6a442b',
  e: '#e04a4a', E: '#a52f3a',
  h: '#f6cfa6', H: '#e0a77c', j: '#b97a4d', J: '#7c4e33',
  i: '#7fc6c0', I: '#4f9a96',
  u: '#5a6fa8', U: '#3d4c7c',
  z: '#8d8d9b', Z: '#c9c9d3',
  d: '#3b3346'
};

export type Ctx = CanvasRenderingContext2D;

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

export function rect(ctx: Ctx, x: number, y: number, w: number, h: number, col: string) {
  ctx.fillStyle = PAL[col] ?? col;
  ctx.fillRect(x, y, w, h);
}

export const px = (ctx: Ctx, x: number, y: number, col: string) => rect(ctx, x, y, 1, 1, col);

/** Sprite desde filas de texto; '.' es transparente. */
export function sprite(rows: string[]): HTMLCanvasElement {
  const w = Math.max(...rows.map((r) => r.length));
  const [c, ctx] = makeCanvas(w, rows.length);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] !== '.' && row[x] !== ' ') px(ctx, x, y, row[x]);
  });
  return c;
}

/** Agrega contorno de 1 px alrededor de lo pintado (en el borde interior del lienzo). */
export function outline(c: HTMLCanvasElement, col = 'k'): HTMLCanvasElement {
  const ctx = c.getContext('2d')!;
  const { width: w, height: h } = c;
  const data = ctx.getImageData(0, 0, w, h).data;
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && data[(y * w + x) * 4 + 3] > 0;
  const marks: [number, number][] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (solid(x, y)) continue;
      if (solid(x + 1, y) || solid(x - 1, y) || solid(x, y + 1) || solid(x, y - 1)) marks.push([x, y]);
    }
  }
  for (const [x, y] of marks) px(ctx, x, y, col);
  return c;
}

/** Sprite dibujado con código, con contorno automático opcional. */
export function drawn(w: number, h: number, fn: (ctx: Ctx) => void, withOutline = true): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h);
  fn(ctx);
  return withOutline ? outline(c) : c;
}

/** Ruido determinista por casilla, para variar casas y pasto sin azar. */
export function hash(x: number, y: number, salt = 0): number {
  let h = (x * 374761393 + y * 668265263 + salt * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function flipX(src: HTMLCanvasElement): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(src.width, src.height);
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return c;
}

export function toDataUrl(c: HTMLCanvasElement, scale = 1): string {
  if (scale === 1) return c.toDataURL();
  const [big, ctx] = makeCanvas(c.width * scale, c.height * scale);
  ctx.drawImage(c, 0, 0, big.width, big.height);
  return big.toDataURL();
}
