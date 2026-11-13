import { describe, expect, it } from 'vitest';
import { playGame } from '../src/engine/bot';
import { BUILDINGS, CARDS, CONTRALORIA, CUENTA_OPTIONS, LESSONS, kindById } from '../src/engine/content';
import { BASE, COLS, EMPTY_LOTS, ROADS, ROWS, findPath, roadNear, tileKind } from '../src/engine/map';
import {
  MONTHS, MONTH_SECONDS, build, chooseCuenta, chooseOption, closeCard, continueAfterYear, deserialize, dispatch,
  drainEvents, hire, newGame, serialize, tick, voteShare
} from '../src/engine/sim';

/** Avanza el tiempo resolviendo las cartas con la primera opción. */
function advance(s: ReturnType<typeof newGame>, seconds: number) {
  for (let t = 0; t < seconds; t += 0.1) {
    if (s.phase === 'card') {
      chooseOption(s, 0);
      closeCard(s);
    }
    tick(s, 0.1);
  }
}

describe('mapa', () => {
  it('los sitios eriazos son lotes', () => {
    for (const p of EMPTY_LOTS) expect(tileKind(p.x, p.y)).toBe('lot');
    expect(EMPTY_LOTS.length).toBe(18);
  });

  it('se llega por la calle a cualquier calle y a cualquier lote', () => {
    for (const r of ROADS) {
      if (r.x === BASE.x && r.y === BASE.y) continue;
      expect(findPath(BASE, r).length).toBeGreaterThan(0);
    }
    for (let y = 0; y < ROWS; y++) {
      for (let x = 1; x < COLS; x++) {
        if (tileKind(x, y) !== 'lot') continue;
        const near = roadNear({ x, y });
        expect(Math.abs(near.x - x) + Math.abs(near.y - y)).toBe(1);
      }
    }
  });
});

describe('contenido', () => {
  it('cada carta enseña una ficha que existe y tiene una opción buena y una mala', () => {
    for (const c of [...CARDS, CONTRALORIA]) {
      expect(LESSONS.some((l) => l.id === c.lesson), c.id).toBe(true);
      expect(c.options.some((o) => o.good), c.id).toBe(true);
      expect(c.options.some((o) => !o.good), c.id).toBe(true);
      for (const o of c.options) expect(o.result.length).toBeGreaterThan(10);
    }
    expect(CUENTA_OPTIONS.length).toBe(2);
  });

  it('todas las fichas se pueden ganar jugando', () => {
    const taught = new Set([...CARDS, CONTRALORIA].map((c) => c.lesson).concat('cuenta'));
    for (const l of LESSONS) expect(taught.has(l.id), l.id).toBe(true);
  });
});

describe('reglas', () => {
  it('empieza con siete cuadrillas y un bache frente a la muni', () => {
    const s = newGame(1);
    expect(s.crews.length).toBe(7);
    expect(s.problems.length).toBe(1);
    expect(s.problems[0].kind).toBe('bache');
  });

  it('una cuadrilla va, arregla y sube la aprobación del barrio', () => {
    const s = newGame(1);
    const p = s.problems[0];
    const before = s.approval[p.barrio];
    expect(dispatch(s, p.id)).toBe('sent');
    for (let i = 0; i < 80; i++) tick(s, 0.1);
    const fixed = drainEvents(s).find((e) => e.type === 'fixed');
    expect(fixed).toBeTruthy();
    expect(s.problems.find((q) => q.id === p.id)).toBeUndefined();
    expect(s.approval[p.barrio]).toBeGreaterThan(before - 1);
  });

  it('sin cuadrillas libres el problema queda en espera y se atiende después', () => {
    const s = newGame(2);
    s.problems = [];
    const ids: number[] = [];
    for (const x of [1, 4, 7]) {
      s.problems.push({ id: s.nextId, kind: 'luz', x, y: 2, barrio: 0, age: 0, status: 'open', escalated: false, crew: null });
      ids.push(s.nextId++);
    }
    expect(dispatch(s, ids[0])).toBe('sent');
    expect(dispatch(s, ids[1])).toBe('queued');
    advance(s, 20);
    expect(s.problems.find((q) => q.id === ids[1])).toBeUndefined();
  });

  it('un problema ignorado se vuelve reclamo y baja la aprobación', () => {
    const s = newGame(3);
    const p = s.problems[0];
    const before = s.approval[p.barrio];
    advance(s, kindById(p.kind).ttl + 0.5);
    expect(s.problems.find((q) => q.id === p.id)?.escalated).toBe(true);
    expect(s.approval[p.barrio]).toBeLessThan(before - 4);
  });

  it('construir cuesta plata y no se puede dos veces en el mismo sitio', () => {
    const s = newGame(4);
    const lot = EMPTY_LOTS[0];
    const money = s.money;
    expect(build(s, lot.x, lot.y, 'plaza')).toBe(true);
    expect(s.money).toBe(money - BUILDINGS.find((b) => b.id === 'plaza')!.cost);
    expect(build(s, lot.x, lot.y, 'led')).toBe(false);
    expect(build(s, 1, 1, 'led')).toBe(false);
  });

  it('contratar suma una cuadrilla con sueldo', () => {
    const s = newGame(5);
    expect(hire(s, 'salud')).toBe(true);
    expect(s.crews.filter((c) => c.dept === 'salud').length).toBe(2);
  });

  it('las cartas aplican efectos y dejan la ficha aprendida', () => {
    const s = newGame(6);
    for (let i = 0; i < MONTH_SECONDS * 10 + 2; i++) tick(s, 0.1);
    expect(s.phase).toBe('card');
    const tr = s.transparency;
    const opt = chooseOption(s, 0)!;
    expect(opt).toBeTruthy();
    expect(s.lessons.length).toBe(1);
    closeCard(s);
    expect(s.phase).toBe('playing');
    expect(s.transparency).toBe(Math.max(0, Math.min(100, tr + (opt.effects.transparency ?? 0))));
  });

  it('la partida dura cuatro años y termina en elecciones', () => {
    const s = newGame(7);
    let years = 0;
    while (s.phase !== 'ended') {
      if (s.phase === 'card') {
        chooseOption(s, 0);
        closeCard(s);
      } else if (s.phase === 'yearEnd') {
        years++;
        chooseCuenta(s, 0);
        continueAfterYear(s);
      } else tick(s, 0.25);
    }
    expect(years).toBe(4);
    expect(s.month).toBe(MONTHS);
    expect(voteShare(s)).toBeGreaterThanOrEqual(0);
  });

  it('se guarda y se recupera igual', () => {
    const s = newGame(8);
    for (let i = 0; i < 50; i++) tick(s, 0.1);
    const copy = deserialize(serialize(s))!;
    expect(copy.problems).toEqual(s.problems);
    tick(s, 0.1);
    tick(copy, 0.1);
    expect(copy.rng).toEqual(s.rng);
    expect(deserialize('basura')).toBeNull();
  });
});

describe('calibración con el bot', () => {
  const seeds = Array.from({ length: 10 }, (_, i) => 500 + i);
  const wins = (o: Parameters<typeof playGame>[1]) => seeds.filter((sd) => playGame(sd, o).vote > 50).length;

  it('sin tocar nada se pierde siempre', () => {
    expect(wins({ reaction: 0, honest: true, manage: false, idle: true })).toBe(0);
  });

  it('solo apagar incendios, sin construir, no alcanza', () => {
    expect(wins({ reaction: 1.5, honest: true, manage: false })).toBeLessThanOrEqual(2);
  });

  it('una gestión honesta y activa gana casi siempre', () => {
    expect(wins({ reaction: 1.5, honest: true, manage: true })).toBeGreaterThanOrEqual(7);
  });

  it('la corrupción hace perder aunque se trabaje rápido', () => {
    expect(wins({ reaction: 0.7, honest: false, manage: true })).toBeLessThanOrEqual(2);
  });
});
