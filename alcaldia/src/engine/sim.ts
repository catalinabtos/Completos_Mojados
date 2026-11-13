// Reglas del juego, sin DOM: todo el estado es JSON para poder guardarlo y testearlo.

import {
  BUILDINGS, CARDS, CONTRALORIA, CUENTA_OPTIONS, DEPTS, HIRE_COST, KINDS, MAX_CREWS, MAX_UPGRADE, SALARY,
  UPGRADE_COST, buildingById, kindById,
  type BuildingId, type Card, type DeptId, type Effects, type KindId, type Option
} from './content';
import {
  BARRIOS, BASE, EMPTY_LOTS, HOUSES, PLAZA, ROADS, barrioOf, findPath, isEmptyLot, roadNear, type Pt
} from './map';
import { next, pick, weighted, type Rng } from './rng';

export const MONTH_SECONDS = 12;
export const YEARS = 4;
export const MONTHS = YEARS * 12;
export const MAX_OPEN = 20;
/** Segundos entre problemas, por año de mandato. */
export const SPAWN_INTERVAL = [1.9, 1.45, 1.15, 0.95];
export const CREW_SPEED = 2.6;
export const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export type Phase = 'playing' | 'card' | 'yearEnd' | 'ended';

export interface Problem {
  id: number;
  kind: KindId;
  x: number;
  y: number;
  barrio: number;
  age: number;
  status: 'open' | 'queued' | 'assigned' | 'fixing';
  escalated: boolean;
  crew: number | null;
}

export interface Crew {
  id: number;
  dept: DeptId;
  x: number;
  y: number;
  path: Pt[];
  state: 'idle' | 'moving' | 'fixing';
  target: number | null;
  fixLeft: number;
  fixTotal: number;
}

export interface Placed {
  x: number;
  y: number;
  type: BuildingId;
  barrio: number;
}

export interface YearStats {
  fixed: number;
  expired: number;
  built: number;
  hired: number;
  good: number;
  bad: number;
  income: number;
  spent: number;
}

export interface CardState {
  id: string;
  chosen: number | null;
}

export type GameEvent =
  | { type: 'spawn'; id: number }
  | { type: 'fixed'; id: number; kind: KindId; x: number; y: number; gain: number; streak: number }
  | { type: 'expired'; id: number; kind: KindId; x: number; y: number }
  | { type: 'dispatch'; crew: number }
  | { type: 'queued'; id: number }
  | { type: 'nocrew'; dept: DeptId }
  | { type: 'card'; id: string }
  | { type: 'month'; month: number; net: number }
  | { type: 'yearEnd'; year: number }
  | { type: 'election' }
  | { type: 'built'; x: number; y: number; building: BuildingId }
  | { type: 'hired'; dept: DeptId }
  | { type: 'upgraded'; dept: DeptId };

export interface GameState {
  version: 1;
  rng: Rng;
  t: number;
  month: number;
  monthT: number;
  phase: Phase;
  money: number;
  approval: number[];
  transparency: number;
  participation: number;
  risk: number;
  problems: Problem[];
  crews: Crew[];
  nextId: number;
  buildings: Placed[];
  upgrades: Record<DeptId, number>;
  spawnT: number;
  seenCards: string[];
  card: CardState | null;
  lessons: string[];
  flags: Record<string, number>;
  years: YearStats[];
  streak: number;
  lastFixT: number;
  avatar: number;
  title: 'Alcaldesa' | 'Alcalde';
  cuentaChosen: number | null;
  events: GameEvent[];
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const emptyYear = (): YearStats => ({ fixed: 0, expired: 0, built: 0, hired: 0, good: 0, bad: 0, income: 0, spent: 0 });

export function newGame(seed: number, avatar = 0, title: 'Alcaldesa' | 'Alcalde' = 'Alcaldesa'): GameState {
  const s: GameState = {
    version: 1,
    rng: { s: seed | 0 },
    t: 0,
    month: 0,
    monthT: 0,
    phase: 'playing',
    money: 100,
    approval: BARRIOS.map(() => 50),
    transparency: 50,
    participation: 30,
    risk: 0,
    problems: [],
    crews: [],
    nextId: 1,
    buildings: [],
    upgrades: { obras: 0, aseo: 0, luz: 0, salud: 0, social: 0 },
    spawnT: 1.5,
    seenCards: [],
    card: null,
    lessons: [],
    flags: {},
    years: [emptyYear()],
    streak: 0,
    lastFixT: -99,
    avatar,
    title,
    cuentaChosen: null,
    events: []
  };
  for (const d of DEPTS) for (let i = 0; i < d.startCrews; i++) addCrew(s, d.id);
  // El primer mes empieza con un bache frente a la muni, para aprender a jugar.
  spawnAt(s, 'bache', { x: 7, y: 9 });
  return s;
}

function addCrew(s: GameState, dept: DeptId) {
  s.crews.push({
    id: s.nextId++, dept, x: BASE.x, y: BASE.y, path: [], state: 'idle', target: null, fixLeft: 0, fixTotal: 0
  });
}

// ── Consultas ────────────────────────────────────────────────────────────────

export const year = (s: GameState) => Math.min(YEARS, Math.floor(s.month / 12) + 1);
export const monthOfYear = (s: GameState) => s.month % 12;
export const avgApproval = (s: GameState) => s.approval.reduce((a, b) => a + b, 0) / s.approval.length;
export const crewsOf = (s: GameState, dept: DeptId) => s.crews.filter((c) => c.dept === dept);
export const idleCrews = (s: GameState, dept: DeptId) => crewsOf(s, dept).filter((c) => c.state === 'idle');
export const freeLots = (s: GameState) =>
  EMPTY_LOTS.filter((p) => !s.buildings.some((b) => b.x === p.x && b.y === p.y));

export function upkeep(s: GameState): number {
  let u = s.crews.length * SALARY;
  for (const b of s.buildings) u += buildingById(b.type).upkeep;
  if (s.flags.ruedaMantencion) u += 4;
  return Math.round(u * 10) / 10;
}

export function income(s: GameState): number {
  return 32 + Math.round(avgApproval(s) / 10);
}

/** Porcentaje de votos si la elección fuera hoy. */
export function voteShare(s: GameState): number {
  return clamp(avgApproval(s) * trustFactor(s) + 0.12 * s.participation);
}

/** La confianza multiplica la aprobación: con transparencia 0 se pierde el 40 % de los votos. */
export const trustFactor = (s: GameState) => 0.6 + 0.4 * (s.transparency / 100);

/** Aprobación a la que vuelve cada barrio con el tiempo: sube con las obras que tiene. */
export function baseApproval(s: GameState, barrio: number): number {
  const n = s.buildings.filter((b) => b.barrio === barrio).length;
  return BASE_APPROVAL + BUILDING_BASE * Math.min(6, n);
}
export const BASE_APPROVAL = 28;
export const BUILDING_BASE = 3.5;
/** Fracción por segundo con que la aprobación vuelve a su base (las expectativas suben). */
export const RETURN_RATE = 0.012;

export function problemAt(s: GameState, x: number, y: number) {
  return s.problems.find((p) => p.x === x && p.y === y);
}

// ── Aparición de problemas ───────────────────────────────────────────────────

function kindMultiplier(s: GameState, barrio: number, kind: KindId): number {
  let m = 1;
  for (const b of s.buildings) {
    if (b.barrio !== barrio) continue;
    const r = buildingById(b.type).reduce[kind];
    if (r !== undefined) m *= r;
    if (kind === 'pasto' && b.type === 'plaza') m *= 1.35;
  }
  const f = s.flags;
  if (f.mantencion && (kind === 'bache' || kind === 'pasto')) m *= 0.7;
  if (f.menosBaches && kind === 'bache') m *= 0.6;
  if (f.fondasOk && kind === 'basura') m *= 0.5;
  if (f.fondasMal && kind === 'basura') m *= 2.2;
  if (f.prevencion && kind === 'fuego') m *= 0.3;
  if (f.calor && kind === 'fuego') m *= 2;
  return Math.max(0.12, m);
}

function placesFor(s: GameState, kind: KindId, barrio: number): Pt[] {
  const k = kindById(kind);
  let list: Pt[];
  if (k.place === 'road') list = ROADS;
  else if (k.place === 'house') list = HOUSES;
  else {
    list = [
      ...PLAZA,
      ...s.buildings.filter((b) => b.type === 'plaza').map((b) => ({ x: b.x, y: b.y })),
      ...EMPTY_LOTS.filter((p) => !s.buildings.some((b) => b.x === p.x && b.y === p.y))
    ];
  }
  return list.filter((p) => barrioOf(p.x, p.y) === barrio && !problemAt(s, p.x, p.y));
}

function spawnAt(s: GameState, kind: KindId, p: Pt): Problem {
  const pr: Problem = {
    id: s.nextId++, kind, x: p.x, y: p.y, barrio: barrioOf(p.x, p.y), age: 0,
    status: 'open', escalated: false, crew: null
  };
  s.problems.push(pr);
  s.events.push({ type: 'spawn', id: pr.id });
  return pr;
}

function trySpawn(s: GameState) {
  if (s.problems.length >= MAX_OPEN) return;
  const m = monthOfYear(s);
  const barrio = Math.floor(next(s.rng) * BARRIOS.length);
  const kind = weighted(s.rng, KINDS, (k) => k.season[m]);
  if (!kind) return;
  if (next(s.rng) > kindMultiplier(s, barrio, kind.id)) return;
  const places = placesFor(s, kind.id, barrio);
  if (!places.length) return;
  spawnAt(s, kind.id, pick(s.rng, places));
}

function seasonLoad(m: number): number {
  const sum = (mm: number) => KINDS.reduce((a, k) => a + k.season[mm], 0);
  let avg = 0;
  for (let i = 0; i < 12; i++) avg += sum(i);
  avg /= 12;
  return sum(m) / avg;
}
const SEASON_LOAD = Array.from({ length: 12 }, (_, i) => seasonLoad(i));

function spawnInterval(s: GameState): number {
  const base = s.month === 0 ? 4.2 : SPAWN_INTERVAL[year(s) - 1];
  return base / Math.sqrt(SEASON_LOAD[monthOfYear(s)]);
}

// ── Cuadrillas ───────────────────────────────────────────────────────────────

function targetTile(p: Problem): Pt {
  return roadNear({ x: p.x, y: p.y });
}

function sendCrew(s: GameState, crew: Crew, p: Problem) {
  const goal = targetTile(p);
  crew.path = findPath({ x: crew.x, y: crew.y }, goal);
  // Se ajusta a la casilla entera antes de caminar, para no cortar por los lotes.
  crew.x = Math.round(crew.x);
  crew.y = Math.round(crew.y);
  crew.state = 'moving';
  crew.target = p.id;
  p.status = 'assigned';
  p.crew = crew.id;
  s.events.push({ type: 'dispatch', crew: crew.id });
}

function nearestIdle(s: GameState, p: Problem): Crew | null {
  const goal = targetTile(p);
  let best: Crew | null = null;
  let bestLen = Infinity;
  for (const c of idleCrews(s, kindById(p.kind).dept)) {
    const len = findPath({ x: c.x, y: c.y }, goal).length;
    if (len < bestLen) {
      bestLen = len;
      best = c;
    }
  }
  return best;
}

/** El jugador toca un problema. Devuelve qué pasó. */
export function dispatch(s: GameState, id: number): 'sent' | 'queued' | 'busy' | 'none' {
  if (s.phase !== 'playing') return 'none';
  const p = s.problems.find((q) => q.id === id);
  if (!p || p.status === 'assigned' || p.status === 'fixing') return 'busy';
  const crew = nearestIdle(s, p);
  if (crew) {
    sendCrew(s, crew, p);
    return 'sent';
  }
  if (p.status === 'open') {
    p.status = 'queued';
    s.events.push({ type: 'queued', id: p.id });
    s.events.push({ type: 'nocrew', dept: kindById(p.kind).dept });
  }
  return 'queued';
}

function crewSpeed(s: GameState, c: Crew) {
  return CREW_SPEED * (1 + 0.3 * s.upgrades[c.dept]);
}

function finishFix(s: GameState, crew: Crew) {
  const p = s.problems.find((q) => q.id === crew.target);
  crew.state = 'idle';
  crew.target = null;
  if (p) {
    const k = kindById(p.kind);
    s.streak = s.t - s.lastFixT < 4 ? s.streak + 1 : 1;
    s.lastFixT = s.t;
    const base = p.escalated ? 0.6 * k.weight : 1.5 * k.weight;
    const gain = base * (1 + 0.15 * Math.min(s.streak - 1, 4));
    s.approval[p.barrio] = clamp(s.approval[p.barrio] + gain);
    s.problems = s.problems.filter((q) => q !== p);
    s.years[s.years.length - 1].fixed++;
    s.events.push({ type: 'fixed', id: p.id, kind: p.kind, x: p.x, y: p.y, gain, streak: s.streak });
  }
  // Toma el siguiente problema en espera de su departamento.
  const waiting = s.problems.filter((q) => q.status === 'queued' && kindById(q.kind).dept === crew.dept);
  if (waiting.length) sendCrew(s, crew, waiting[0]);
}

function moveCrew(s: GameState, c: Crew, dt: number) {
  if (c.state === 'moving') {
    let step = crewSpeed(s, c) * dt;
    while (step > 0 && c.path.length) {
      const n = c.path[0];
      const dx = n.x - c.x;
      const dy = n.y - c.y;
      const d = Math.abs(dx) + Math.abs(dy);
      if (d <= step) {
        c.x = n.x;
        c.y = n.y;
        c.path.shift();
        step -= d;
      } else {
        c.x += (dx / d) * step;
        c.y += (dy / d) * step;
        step = 0;
      }
    }
    if (!c.path.length) {
      const p = s.problems.find((q) => q.id === c.target);
      if (!p) {
        c.state = 'idle';
        c.target = null;
        return;
      }
      const k = kindById(p.kind);
      c.state = 'fixing';
      c.fixTotal = c.fixLeft = k.fix * (p.escalated ? 1.4 : 1);
      p.status = 'fixing';
    }
  } else if (c.state === 'fixing') {
    c.fixLeft -= dt;
    if (c.fixLeft <= 0) finishFix(s, c);
  }
}

// ── Construcción y equipo ────────────────────────────────────────────────────

export function canBuild(s: GameState, x: number, y: number, type: BuildingId): boolean {
  return s.phase === 'playing' && isEmptyLot(x, y) && !s.buildings.some((b) => b.x === x && b.y === y) &&
    s.money >= buildingById(type).cost;
}

export function build(s: GameState, x: number, y: number, type: BuildingId): boolean {
  if (!canBuild(s, x, y, type)) return false;
  placeBuilding(s, x, y, type);
  s.money -= buildingById(type).cost;
  s.years[s.years.length - 1].spent += buildingById(type).cost;
  return true;
}

function placeBuilding(s: GameState, x: number, y: number, type: BuildingId) {
  // Un problema en el sitio eriazo desaparece con la obra.
  const p = problemAt(s, x, y);
  if (p) {
    for (const c of s.crews) if (c.target === p.id) { c.state = 'idle'; c.target = null; c.path = []; }
    s.problems = s.problems.filter((q) => q !== p);
  }
  const barrio = barrioOf(x, y);
  s.buildings.push({ x, y, type, barrio });
  s.approval[barrio] = clamp(s.approval[barrio] + 2);
  s.years[s.years.length - 1].built++;
  s.events.push({ type: 'built', x, y, building: type });
}

export const canHire = (s: GameState, dept: DeptId) =>
  s.phase === 'playing' && crewsOf(s, dept).length < MAX_CREWS && s.money >= HIRE_COST;

export function hire(s: GameState, dept: DeptId): boolean {
  if (!canHire(s, dept)) return false;
  s.money -= HIRE_COST;
  s.years[s.years.length - 1].spent += HIRE_COST;
  s.years[s.years.length - 1].hired++;
  addCrew(s, dept);
  s.events.push({ type: 'hired', dept });
  const waiting = s.problems.find((q) => q.status === 'queued' && kindById(q.kind).dept === dept);
  if (waiting) sendCrew(s, s.crews[s.crews.length - 1], waiting);
  return true;
}

export const upgradeCost = (s: GameState, dept: DeptId) =>
  s.upgrades[dept] >= MAX_UPGRADE ? null : UPGRADE_COST[s.upgrades[dept]];

export function upgrade(s: GameState, dept: DeptId): boolean {
  const cost = upgradeCost(s, dept);
  if (cost === null || s.money < cost || s.phase !== 'playing') return false;
  s.money -= cost;
  s.years[s.years.length - 1].spent += cost;
  s.upgrades[dept]++;
  s.events.push({ type: 'upgraded', dept });
  return true;
}

// ── Cartas ───────────────────────────────────────────────────────────────────

export function currentCard(s: GameState): Card | null {
  if (!s.card) return null;
  if (s.card.id === CONTRALORIA.id) return CONTRALORIA;
  return CARDS.find((c) => c.id === s.card!.id) ?? null;
}

function openCard(s: GameState, card: Card) {
  s.card = { id: card.id, chosen: null };
  s.phase = 'card';
  if (card.id !== CONTRALORIA.id) s.seenCards.push(card.id);
  s.events.push({ type: 'card', id: card.id });
}

function eligible(s: GameState, c: Card) {
  return !s.seenCards.includes(c.id) && (c.minYear ?? 1) <= year(s);
}

function openSeasonalCard(s: GameState): boolean {
  const m = monthOfYear(s);
  const seasonal = CARDS.filter((c) => c.months?.includes(m) && eligible(s, c));
  if (seasonal.length) {
    openCard(s, seasonal[0]);
    return true;
  }
  return false;
}

function maybeOpenCard(s: GameState) {
  if (s.risk > 0 && next(s.rng) < 0.05 * s.risk) {
    openCard(s, CONTRALORIA);
    return;
  }
  if (openSeasonalCard(s)) return;
  if (s.month % 2 !== 1) return;
  const pool = CARDS.filter((c) => !c.months && eligible(s, c));
  if (pool.length) openCard(s, pick(s.rng, pool));
}

function applyEffects(s: GameState, e: Effects) {
  const y = s.years[s.years.length - 1];
  if (e.money) {
    s.money += e.money;
    if (e.money < 0) y.spent -= e.money;
  }
  if (e.approval) s.approval = s.approval.map((a) => clamp(a + e.approval!));
  if (e.worstBarrio) {
    const i = s.approval.indexOf(Math.min(...s.approval));
    s.approval[i] = clamp(s.approval[i] + e.worstBarrio);
  }
  if (e.transparency) s.transparency = clamp(s.transparency + e.transparency);
  if (e.participation) s.participation = clamp(s.participation + e.participation);
  if (e.risk) s.risk += e.risk;
  if (e.flag) s.flags[e.flag[0]] = e.flag[1];
  if (e.crew && crewsOf(s, e.crew).length < MAX_CREWS) addCrew(s, e.crew);
  if (e.freeBuilding) {
    const lots = freeLots(s);
    if (lots.length) {
      // El barrio con menos aprobación que todavía tenga sitio.
      lots.sort((a, b) => s.approval[barrioOf(a.x, a.y)] - s.approval[barrioOf(b.x, b.y)]);
      placeBuilding(s, lots[0].x, lots[0].y, e.freeBuilding);
    }
  }
}

export function chooseOption(s: GameState, index: number): Option | null {
  const card = currentCard(s);
  if (!card || !s.card || s.card.chosen !== null) return null;
  const opt = card.options[index];
  if (!opt) return null;
  s.card.chosen = index;
  applyEffects(s, opt.effects);
  if (card.id === CONTRALORIA.id) s.risk = opt.good ? 0 : Math.ceil(s.risk / 2);
  const y = s.years[s.years.length - 1];
  if (opt.good) y.good++;
  else y.bad++;
  if (!s.lessons.includes(card.lesson)) s.lessons.push(card.lesson);
  return opt;
}

export function closeCard(s: GameState) {
  if (s.phase !== 'card' || !s.card || s.card.chosen === null) return;
  s.card = null;
  s.phase = 'playing';
}

// ── Fin de año y elección ────────────────────────────────────────────────────

export function chooseCuenta(s: GameState, index: number): Option | null {
  if (s.phase !== 'yearEnd' || s.cuentaChosen !== null) return null;
  const opt = CUENTA_OPTIONS[index];
  if (!opt) return null;
  s.cuentaChosen = index;
  applyEffects(s, opt.effects);
  const y = s.years[s.years.length - 1];
  if (opt.good) y.good++;
  else y.bad++;
  if (!s.lessons.includes('cuenta')) s.lessons.push('cuenta');
  return opt;
}

/** Cierra la cuenta pública: sigue el mandato o vienen las elecciones. */
export function continueAfterYear(s: GameState) {
  if (s.phase !== 'yearEnd' || s.cuentaChosen === null) return;
  s.cuentaChosen = null;
  if (s.month >= MONTHS) {
    s.phase = 'ended';
    s.events.push({ type: 'election' });
    return;
  }
  s.years.push(emptyYear());
  s.phase = 'playing';
  maybeOpenCard(s);
}

function endMonth(s: GameState) {
  const inc = income(s);
  const cost = upkeep(s);
  const net = inc - cost;
  s.money = Math.round((s.money + net) * 10) / 10;
  const y = s.years[s.years.length - 1];
  y.income += inc;
  y.spent += cost;
  // Los edificios suman aprobación mes a mes; la participación baja si nadie la cuida.
  for (const b of s.buildings) {
    const def = buildingById(b.type);
    s.approval[b.barrio] = clamp(s.approval[b.barrio] + def.monthly);
    if (def.participation) s.participation = clamp(s.participation + def.participation);
  }
  s.participation = clamp(s.participation - 0.4);
  // Deuda: sin plata, los vecinos lo notan.
  if (s.money < 0) s.approval = s.approval.map((a) => clamp(a - 1.5));
  for (const k of Object.keys(s.flags)) {
    if (s.flags[k] >= 99) continue;
    s.flags[k]--;
    if (s.flags[k] <= 0) delete s.flags[k];
  }
  s.month++;
  s.monthT = 0;
  s.events.push({ type: 'month', month: s.month, net });
  if (s.month % 12 === 0) {
    s.phase = 'yearEnd';
    s.events.push({ type: 'yearEnd', year: s.month / 12 });
    return;
  }
  maybeOpenCard(s);
}

// ── Paso de simulación ───────────────────────────────────────────────────────

export function tick(s: GameState, dt: number) {
  if (s.phase !== 'playing') return;
  s.t += dt;
  s.monthT += dt;

  s.spawnT -= dt;
  if (s.spawnT <= 0) {
    trySpawn(s);
    s.spawnT += spawnInterval(s);
  }

  for (const c of s.crews) moveCrew(s, c, dt);

  for (let b = 0; b < s.approval.length; b++) {
    s.approval[b] += (baseApproval(s, b) - s.approval[b]) * RETURN_RATE * dt;
  }

  for (const p of [...s.problems]) {
    if (p.status === 'assigned' || p.status === 'fixing') continue;
    const k = kindById(p.kind);
    p.age += dt;
    if (!p.escalated) {
      s.approval[p.barrio] = clamp(s.approval[p.barrio] - 0.05 * k.weight * dt);
      if (p.age >= k.ttl) {
        p.escalated = true;
        s.approval[p.barrio] = clamp(s.approval[p.barrio] - 4 * k.weight);
        s.years[s.years.length - 1].expired++;
        s.events.push({ type: 'expired', id: p.id, kind: p.kind, x: p.x, y: p.y });
      }
    } else {
      s.approval[p.barrio] = clamp(s.approval[p.barrio] - 0.1 * k.weight * dt);
    }
  }

  if (s.monthT >= MONTH_SECONDS) endMonth(s);
}

export function drainEvents(s: GameState): GameEvent[] {
  const e = s.events;
  s.events = [];
  return e;
}

export function serialize(s: GameState): string {
  return JSON.stringify({ ...s, events: [] });
}

export function deserialize(json: string): GameState | null {
  try {
    const s = JSON.parse(json) as GameState;
    if (s.version !== 1 || !Array.isArray(s.problems)) return null;
    s.events = [];
    return s;
  } catch {
    return null;
  }
}

export { BUILDINGS };
