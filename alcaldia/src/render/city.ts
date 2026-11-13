// Dibuja la ciudad: una capa fija (calles, casas, obras) y una capa animada (río, tráfico,
// cuadrillas, problemas, clima y partículas). Todo en coordenadas de arte: 1 unidad = 1 píxel.

import { kindById, type DeptId } from '../engine/content';
import { BARRIOS, COLS, EMPTY_LOTS, ROWS, isWalkable, tileKind, type Pt } from '../engine/map';
import { monthOfYear, type GameState } from '../engine/sim';
import {
  CARS, FACES, ICONS, PIN, PIN_ALERT, PIN_QUEUED, VEHICLES, WALKERS, WORKERS,
  buildingArt, emptyLot, house, muni, plazaDeArmas, seasonOf, type Season
} from './art';
import { PAL, makeCanvas, rect, type Ctx } from './pixel';

export const T = 16;
export const ART_W = COLS * T;
export const ART_H = ROWS * T;

interface Mover {
  x: number;
  y: number;
  dx: number;
  dy: number;
  sprite: number;
  car: boolean;
  speed: number;
  side: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  kind: 'heart' | 'spark' | 'cloud' | 'confetti' | 'drop';
  col: string;
}

const walk = (x: number, y: number) =>
  x < 0 || y < 0 || x >= COLS || y >= ROWS ? false : isWalkable(tileKind(x, y));

function road(ctx: Ctx, ox: number, oy: number, x: number, y: number) {
  rect(ctx, ox, oy, T, T, 'r');
  const edge = (nx: number, ny: number) => nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && !walk(nx, ny);
  const up = edge(x, y - 1), down = edge(x, y + 1), left = edge(x - 1, y), right = edge(x + 1, y);
  // veredas con solera
  if (up) { rect(ctx, ox, oy, T, 3, 's'); rect(ctx, ox, oy + 3, T, 1, 'S'); }
  if (down) { rect(ctx, ox, oy + 12, T, 1, 'S'); rect(ctx, ox, oy + 13, T, 3, 's'); }
  if (left) { rect(ctx, ox, oy, 3, T, 's'); rect(ctx, ox + 3, oy, 1, T, 'S'); }
  if (right) { rect(ctx, ox + 12, oy, 1, T, 'S'); rect(ctx, ox + 13, oy, 3, T, 's'); }
  if (up && left) rect(ctx, ox, oy, 3, 3, 's');
  // esquinas de vereda en los cruces
  const corner = (cx: number, cy: number, nx: number, ny: number) => {
    if (edge(nx, ny)) rect(ctx, ox + cx, oy + cy, 3, 3, 's');
  };
  corner(0, 0, x - 1, y - 1);
  corner(13, 0, x + 1, y - 1);
  corner(0, 13, x - 1, y + 1);
  corner(13, 13, x + 1, y + 1);
  // líneas de pista
  if (up && down) for (let i = 1; i < T; i += 6) rect(ctx, ox + i, oy + 7, 3, 1, 'W');
  if (left && right) for (let i = 1; i < T; i += 6) rect(ctx, ox + 7, oy + i, 1, 3, 'W');
  // pasos de cebra junto a los cruces
  if (up && down && !left && walk(x - 1, y) && !(walk(x - 1, y - 1))) {
    for (let i = 4; i < 12; i += 2) rect(ctx, ox + 1, oy + i, 2, 1, 'W');
  }
  if (left && right && !up && walk(x, y - 1) && !(walk(x - 1, y - 1))) {
    for (let i = 4; i < 12; i += 2) rect(ctx, ox + i, oy + 1, 1, 2, 'W');
  }
}

export class CityRenderer {
  readonly canvas: HTMLCanvasElement;
  private ctx: Ctx;
  private layer: HTMLCanvasElement;
  private layerCtx: Ctx;
  private layerKey = '';
  private movers: Mover[] = [];
  private particles: Particle[] = [];
  private facing = new Map<number, { x: number; y: number; left: boolean }>();
  private weather: Particle[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.width = ART_W;
    canvas.height = ART_H;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    [this.layer, this.layerCtx] = makeCanvas(ART_W, ART_H);
    this.spawnMovers();
  }

  private spawnMovers() {
    const roads: Pt[] = [];
    for (let y = 0; y < ROWS; y++) for (let x = 1; x < COLS; x++) if (walk(x, y)) roads.push({ x, y });
    for (let i = 0; i < 11; i++) {
      const p = roads[(i * 37) % roads.length];
      const car = i < 5;
      this.movers.push({
        x: p.x, y: p.y, dx: 0, dy: 0, sprite: i, car, speed: car ? 1.6 + (i % 3) * 0.3 : 0.55,
        side: i % 2 ? 1 : -1
      });
    }
  }

  // ── Capa fija ──────────────────────────────────────────────────────────────

  private drawLayer(s: GameState, season: Season) {
    const ctx = this.layerCtx;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const k = tileKind(x, y);
        const ox = x * T, oy = y * T;
        if (k === 'road') road(ctx, ox, oy, x, y);
        else if (k === 'lot') {
          const b = s.buildings.find((q) => q.x === x && q.y === y);
          if (b) ctx.drawImage(buildingArt(b.type, season), ox, oy);
          else if (EMPTY_LOTS.some((p) => p.x === x && p.y === y)) emptyLot(ctx, ox, oy, x, y);
          else house(ctx, ox, oy, x, y, season);
        }
      }
    }
    plazaDeArmas(ctx, 5 * T, 6 * T, season);
    muni(ctx, 8 * T, 6 * T);
  }

  private ensureLayer(s: GameState, season: Season) {
    const key = season + '|' + s.buildings.map((b) => `${b.x},${b.y},${b.type}`).join(';');
    if (key !== this.layerKey) {
      this.layerKey = key;
      this.drawLayer(s, season);
    }
  }

  // ── Efectos ────────────────────────────────────────────────────────────────

  burst(tx: number, ty: number, kind: Particle['kind'], n: number) {
    const cx = tx * T + 8, cy = ty * T + 6;
    const cols = ['e', 'y', 'b', 'g', 'p', 'v', 'o'];
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const sp = kind === 'cloud' ? 4 : 10 + Math.random() * 14;
      this.particles.push({
        x: cx, y: cy,
        vx: Math.cos(a) * sp * (kind === 'heart' ? 0.4 : 1),
        vy: kind === 'heart' ? -14 - Math.random() * 8 : Math.sin(a) * sp - (kind === 'confetti' ? 10 : 0),
        life: 0, max: kind === 'cloud' ? 1.4 : 0.9 + Math.random() * 0.4,
        kind, col: kind === 'confetti' ? cols[i % cols.length] : kind === 'spark' ? 'l' : 'e'
      });
    }
  }

  private stepParticles(dt: number) {
    for (const p of this.particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'confetti') p.vy += 40 * dt;
      if (p.kind === 'heart') p.vx *= 0.96;
    }
    this.particles = this.particles.filter((p) => p.life < p.max);
  }

  private drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const x = Math.round(p.x), y = Math.round(p.y);
      const fade = 1 - p.life / p.max;
      ctx.globalAlpha = Math.min(1, fade * 1.6);
      if (p.kind === 'heart') {
        rect(ctx, x - 2, y, 2, 1, 'e'); rect(ctx, x + 1, y, 2, 1, 'e');
        rect(ctx, x - 2, y + 1, 5, 1, 'e'); rect(ctx, x - 1, y + 2, 3, 1, 'e'); rect(ctx, x, y + 3, 1, 1, 'e');
        rect(ctx, x - 1, y + 1, 1, 1, 'w');
      } else if (p.kind === 'cloud') {
        rect(ctx, x - 4, y - 1, 9, 3, 'z'); rect(ctx, x - 2, y - 3, 5, 2, 'z');
        rect(ctx, x - 1, y + 2, 1, 2, 'b'); rect(ctx, x + 2, y + 2, 1, 2, 'b');
      } else {
        rect(ctx, x, y, p.kind === 'spark' ? 1 : 2, p.kind === 'spark' ? 1 : 2, p.col);
      }
    }
    ctx.globalAlpha = 1;
  }

  private stepWeather(dt: number, season: Season) {
    const want = season === 'invierno' ? 46 : season === 'otono' ? 12 : season === 'primavera' ? 8 : 0;
    while (this.weather.length < want) {
      const rain = season === 'invierno';
      this.weather.push({
        x: Math.random() * ART_W, y: Math.random() * ART_H - (rain ? 0 : 20),
        vx: rain ? -18 : 6 + Math.random() * 6, vy: rain ? 120 + Math.random() * 40 : 10 + Math.random() * 8,
        life: 0, max: 99, kind: 'drop',
        col: rain ? 'c' : season === 'otono' ? (Math.random() < 0.5 ? 'o' : 'y') : 'p'
      });
    }
    if (this.weather.length > want) this.weather.length = want;
    for (const w of this.weather) {
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      w.life += dt;
      if (w.y > ART_H || w.x < -4 || w.x > ART_W + 4) {
        w.y = -4;
        w.x = Math.random() * (ART_W + 40);
      }
    }
  }

  private drawWeather(season: Season, time: number) {
    const ctx = this.ctx;
    if (season === 'invierno') {
      ctx.fillStyle = 'rgba(40,60,110,0.12)';
      ctx.fillRect(0, 0, ART_W, ART_H);
    } else if (season === 'verano') {
      ctx.fillStyle = 'rgba(255,200,90,0.06)';
      ctx.fillRect(0, 0, ART_W, ART_H);
    }
    for (const w of this.weather) {
      const x = Math.round(w.x), y = Math.round(w.y);
      if (season === 'invierno') {
        ctx.globalAlpha = 0.6;
        rect(ctx, x, y, 1, 3, 'c');
      } else {
        ctx.globalAlpha = 0.9;
        const wob = Math.round(Math.sin(time * 3 + w.x) * 1);
        rect(ctx, x + wob, y, 2, 1, w.col);
      }
    }
    ctx.globalAlpha = 1;
  }

  // ── Elementos animados ─────────────────────────────────────────────────────

  private drawRiver(time: number) {
    const ctx = this.ctx;
    rect(ctx, 0, 0, T, ART_H, 'b');
    const off = Math.floor(time * 8);
    for (let y = -16; y < ART_H; y += 6) {
      const yy = (y + off) % (ART_H + 16);
      const x = 2 + ((y * 7) % 9);
      rect(ctx, x, yy, 3, 1, 'c');
      rect(ctx, (x + 6) % 12, yy + 3, 2, 1, 'B');
    }
    // ribera
    rect(ctx, 13, 0, 3, ART_H, 'n');
    rect(ctx, 13, 0, 1, ART_H, 'N');
    for (let y = 0; y < ART_H; y += 5) rect(ctx, 14, y, 2, 2, 'G');
    // puentes
    for (const by of [5, 11]) {
      const oy = by * T;
      rect(ctx, 0, oy + 2, T, 12, 'R');
      rect(ctx, 0, oy + 3, T, 10, 'r');
      rect(ctx, 0, oy + 1, T, 1, 'Z');
      rect(ctx, 0, oy + 14, T, 1, 'Z');
      for (let x = 1; x < T; x += 4) {
        rect(ctx, x, oy, 1, 2, 'Z');
        rect(ctx, x, oy + 14, 1, 2, 'Z');
      }
    }
  }

  private stepMovers(dt: number, s: GameState) {
    for (const m of this.movers) {
      if (m.dx === 0 && m.dy === 0) this.chooseDir(m);
      m.x += m.dx * m.speed * dt;
      m.y += m.dy * m.speed * dt;
      const tx = Math.round(m.x), ty = Math.round(m.y);
      const reached = Math.abs(m.x - tx) < 0.04 * m.speed && Math.abs(m.y - ty) < 0.04 * m.speed;
      const next = { x: tx + m.dx, y: ty + m.dy };
      if (reached && (!walk(next.x, next.y) || next.x === 0 || Math.random() < 0.25)) {
        m.x = tx;
        m.y = ty;
        this.chooseDir(m);
      }
      // los autos esperan si hay una cuadrilla trabajando en su casilla
      if (m.car && s.crews.some((c) => c.state === 'fixing' && Math.round(c.x) === tx && Math.round(c.y) === ty)) {
        m.x -= m.dx * m.speed * dt;
        m.y -= m.dy * m.speed * dt;
      }
    }
  }

  private chooseDir(m: Mover) {
    const x = Math.round(m.x), y = Math.round(m.y);
    const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => walk(x + dx, y + dy) && x + dx > 0);
    const forward = opts.filter(([dx, dy]) => !(dx === -m.dx && dy === -m.dy));
    const pool = forward.length ? forward : opts;
    const [dx, dy] = pool[Math.floor(Math.random() * pool.length)] ?? [0, 0];
    m.dx = dx;
    m.dy = dy;
  }

  private drawMovers(time: number) {
    const ctx = this.ctx;
    for (const m of this.movers) {
      const cx = m.x * T + 8, cy = m.y * T + 8;
      if (m.car) {
        // mano derecha: el auto va desplazado hacia su derecha
        const ox = m.dy !== 0 ? -m.dy * 3 : 0;
        const oy = m.dx !== 0 ? m.dx * 3 : 0;
        const [right, left] = CARS[m.sprite % CARS.length];
        ctx.drawImage(m.dx < 0 ? left : right, Math.round(cx + ox - 5), Math.round(cy + oy - 4));
      } else {
        const ox = m.dy !== 0 ? m.side * 6 : 0;
        const oy = m.dx !== 0 ? m.side * 6 : 0;
        const f = WALKERS[m.sprite % WALKERS.length][Math.floor(time * 4 + m.sprite) % 2];
        ctx.drawImage(f, Math.round(cx + ox - 2), Math.round(cy + oy - 7));
      }
    }
  }

  private drawCrews(s: GameState, time: number) {
    const ctx = this.ctx;
    const sorted = [...s.crews].sort((a, b) => a.y - b.y);
    // Las cuadrillas libres en la misma casilla se ordenan en fila para que se vean todas.
    const idleAt = new Map<string, number[]>();
    for (const c of sorted) {
      if (c.state !== 'idle') continue;
      const key = `${Math.round(c.x)},${Math.round(c.y)}`;
      idleAt.set(key, [...(idleAt.get(key) ?? []), c.id]);
    }
    for (const c of sorted) {
      const prev = this.facing.get(c.id) ?? { x: c.x, y: c.y, left: false };
      const left = c.x < prev.x - 0.001 ? true : c.x > prev.x + 0.001 ? false : prev.left;
      this.facing.set(c.id, { x: c.x, y: c.y, left });
      let cx = Math.round(c.x * T + 8), cy = Math.round(c.y * T + 8);
      if (c.state === 'idle') {
        const group = idleAt.get(`${Math.round(c.x)},${Math.round(c.y)}`)!;
        if (group.length > 1) {
          const i = group.indexOf(c.id);
          const horizontal = !walk(Math.round(c.x), Math.round(c.y) - 1);
          const off = Math.round((i - (group.length - 1) / 2) * (horizontal ? 5 : 4));
          if (horizontal) cx += off;
          else cy += off;
        }
      }
      const blink = c.state !== 'idle' && Math.floor(time * 4) % 2 === 0;
      const frames = VEHICLES[c.dept as DeptId];
      const spr = frames[(left ? 2 : 0) + (blink ? 1 : 0)];
      ctx.drawImage(spr, cx - 6, cy - 6);
      if (c.state === 'fixing') {
        const w = WORKERS[c.dept][Math.floor(time * 5) % 2];
        ctx.drawImage(w, cx + (left ? -11 : 5), cy - 7);
        // barra de avance
        const frac = 1 - c.fixLeft / c.fixTotal;
        rect(ctx, cx - 7, cy - 11, 14, 3, 'k');
        rect(ctx, cx - 6, cy - 10, Math.max(1, Math.round(12 * frac)), 1, 'l');
        if (Math.random() < 0.3) this.particles.push({
          x: cx + (Math.random() * 10 - 5), y: cy - 4, vx: 0, vy: -10, life: 0, max: 0.4, kind: 'spark', col: 'l'
        });
      } else if (c.state === 'idle') {
        rect(ctx, cx - 1, cy + 4, 3, 1, 'rgba(43,33,53,0.25)');
      }
    }
  }

  private drawProblems(s: GameState, time: number) {
    const ctx = this.ctx;
    const sorted = [...s.problems].sort((a, b) => a.y - b.y);
    for (const p of sorted) {
      if (p.status === 'fixing') continue;
      const k = kindById(p.kind);
      const bob = Math.round(Math.sin(time * 4 + p.id) * 1.2);
      const ox = p.x * T + 1, oy = p.y * T - 6 + bob;
      // marca en el suelo
      rect(ctx, p.x * T + 5, p.y * T + 11, 7, 2, 'rgba(43,33,53,0.3)');
      const pin = p.escalated ? PIN_ALERT : p.status === 'queued' ? PIN_QUEUED : PIN;
      if (p.escalated && Math.floor(time * 3) % 2 === 0) {
        ctx.globalAlpha = 0.5;
        rect(ctx, ox - 1, oy, 17, 14, 'e');
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(pin, ox, oy);
      ctx.drawImage(ICONS[p.kind], ox + 3, oy + 2);
      // tiempo restante
      if (!p.escalated && p.status !== 'assigned') {
        const frac = Math.max(0, 1 - p.age / k.ttl);
        const col = frac > 0.5 ? 'g' : frac > 0.25 ? 'y' : 'e';
        rect(ctx, ox + 1, oy + 15, 13, 3, 'k');
        rect(ctx, ox + 2, oy + 16, Math.max(1, Math.round(11 * frac)), 1, col);
      }
      // cuadrilla en camino
      if (p.status === 'assigned') {
        const dots = Math.floor(time * 3) % 3;
        for (let i = 0; i <= dots; i++) rect(ctx, ox + 4 + i * 3, oy + 15, 2, 2, 'w');
      }
      if (p.status === 'queued') {
        rect(ctx, ox + 11, oy - 1, 5, 5, 'k');
        rect(ctx, ox + 12, oy, 3, 3, 'y');
        rect(ctx, ox + 13, oy + 1, 1, 1, 'k');
      }
    }
  }

  private drawFaces(s: GameState) {
    const ctx = this.ctx;
    for (const b of BARRIOS) {
      const a = s.approval[b.id];
      const face = a >= 60 ? FACES.feliz : a >= 40 ? FACES.neutral : FACES.triste;
      ctx.drawImage(face, b.sign.x * T + 2, b.sign.y * T + 2);
    }
  }

  private drawBuildMode(s: GameState, time: number, selected: Pt | null) {
    const ctx = this.ctx;
    const on = Math.floor(time * 3) % 2 === 0;
    for (const p of EMPTY_LOTS) {
      if (s.buildings.some((b) => b.x === p.x && b.y === p.y)) continue;
      const sel = selected && selected.x === p.x && selected.y === p.y;
      ctx.fillStyle = sel ? PAL.w : on ? PAL.y : PAL.o;
      const ox = p.x * T, oy = p.y * T;
      ctx.fillRect(ox, oy, T, 1);
      ctx.fillRect(ox, oy + T - 1, T, 1);
      ctx.fillRect(ox, oy, 1, T);
      ctx.fillRect(ox + T - 1, oy, 1, T);
      if (sel) {
        ctx.fillRect(ox + 1, oy + 1, T - 2, 1);
        ctx.fillRect(ox + 1, oy + T - 2, T - 2, 1);
        ctx.fillRect(ox + 1, oy + 1, 1, T - 2);
        ctx.fillRect(ox + T - 2, oy + 1, 1, T - 2);
      }
      // signo +
      rect(ctx, ox + 6, oy + 7, 5, 1, 'k');
      rect(ctx, ox + 8, oy + 5, 1, 5, 'k');
    }
    ctx.fillStyle = 'rgba(43,33,53,0.25)';
    ctx.fillRect(0, 0, ART_W, ART_H);
  }

  // ── Cuadro completo ────────────────────────────────────────────────────────

  draw(s: GameState, time: number, dt: number, opts: { build: boolean; selected: Pt | null; paused: boolean; faces?: boolean }) {
    const season = seasonOf(monthOfYear(s));
    this.ensureLayer(s, season);
    const stepDt = opts.paused ? 0 : dt;
    this.stepMovers(stepDt, s);
    this.stepParticles(dt);
    this.stepWeather(stepDt, season);

    const ctx = this.ctx;
    ctx.drawImage(this.layer, 0, 0);
    this.drawRiver(time);
    this.drawMovers(time);
    if (opts.faces !== false) this.drawFaces(s);
    this.drawCrews(s, time);
    if (opts.build) this.drawBuildMode(s, time, opts.selected);
    else this.drawProblems(s, time);
    this.drawParticles();
    this.drawWeather(season, time);
  }

  /** Problema tocado en coordenadas de arte (con un radio generoso para dedos). */
  problemAt(s: GameState, ax: number, ay: number): number | null {
    let best: number | null = null;
    let bestD = 15;
    for (const p of s.problems) {
      if (p.status === 'fixing' || p.status === 'assigned') continue;
      const cx = p.x * T + 8, cy = p.y * T + 2;
      const d = Math.hypot(ax - cx, ay - cy);
      if (d < bestD) {
        bestD = d;
        best = p.id;
      }
    }
    return best;
  }
}
