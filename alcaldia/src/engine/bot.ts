// Jugador automático para calibrar la dificultad: reacciona con retraso, construye y contrata.

import { BUILDINGS, DEPTS, HIRE_COST, kindById, type BuildingId, type DeptId } from './content';
import { barrioOf } from './map';
import {
  avgApproval, build, chooseCuenta, chooseOption, closeCard, continueAfterYear, crewsOf, currentCard,
  dispatch, drainEvents, freeLots, hire, newGame, tick, upgrade, upgradeCost, voteShare, type GameState
} from './sim';
import { CUENTA_OPTIONS } from './content';

export interface BotOptions {
  /** Segundos que tarda en tocar un problema nuevo. */
  reaction: number;
  /** Elige la opción honesta en las cartas. */
  honest: boolean;
  /** Construye y contrata. */
  manage: boolean;
  /** No toca nada (para comprobar que así se pierde). */
  idle?: boolean;
}

export interface BotResult {
  vote: number;
  approval: number;
  transparency: number;
  participation: number;
  fixed: number;
  expired: number;
  buildings: number;
  money: number;
}

const PRIORITY: BuildingId[] = ['contenedores', 'led', 'plaza', 'sede', 'colector', 'cesfam', 'adopcion'];

function manage(s: GameState) {
  // Contrata donde hay fila.
  for (const d of DEPTS) {
    const queued = s.problems.filter((p) => p.status === 'queued' && kindById(p.kind).dept === d.id).length;
    if (queued >= 2 && s.money > HIRE_COST + 30) hire(s, d.id);
  }
  // Construye en el barrio más descontento que tenga sitio.
  const lots = freeLots(s).sort((a, b) => s.approval[barrioOf(a.x, a.y)] - s.approval[barrioOf(b.x, b.y)]);
  for (const lot of lots.slice(0, 1)) {
    const barrio = barrioOf(lot.x, lot.y);
    const have = new Set(s.buildings.filter((b) => b.barrio === barrio).map((b) => b.type));
    const type = PRIORITY.find((t) => !have.has(t));
    if (!type) continue;
    const def = BUILDINGS.find((b) => b.id === type)!;
    if (s.money > def.cost + 25) build(s, lot.x, lot.y, type);
  }
  // Mejora vehículos del departamento con más trabajo.
  const busiest = DEPTS.map((d) => d.id as DeptId).sort(
    (a, b) => crewsOf(s, b).filter((c) => c.state !== 'idle').length - crewsOf(s, a).filter((c) => c.state !== 'idle').length
  )[0];
  const cost = upgradeCost(s, busiest);
  if (cost !== null && s.money > cost + 80) upgrade(s, busiest);
}

export function playGame(seed: number, o: BotOptions): BotResult {
  const s = newGame(seed);
  const seenAt = new Map<number, number>();
  const dt = 0.1;
  let guard = 0;
  while (s.phase !== 'ended' && guard++ < 200000) {
    if (s.phase === 'card') {
      const card = currentCard(s)!;
      const idx = card.options.findIndex((op) => op.good === o.honest);
      chooseOption(s, idx < 0 ? 0 : idx);
      closeCard(s);
      continue;
    }
    if (s.phase === 'yearEnd') {
      chooseCuenta(s, CUENTA_OPTIONS.findIndex((op) => op.good === o.honest));
      continueAfterYear(s);
      continue;
    }
    tick(s, dt);
    drainEvents(s);
    if (o.idle) continue;
    for (const p of s.problems) {
      if (!seenAt.has(p.id)) seenAt.set(p.id, s.t);
      if (p.status === 'open' && s.t - seenAt.get(p.id)! >= o.reaction) dispatch(s, p.id);
    }
    if (o.manage && Math.round(s.t * 10) % 10 === 0) manage(s);
  }
  const fixed = s.years.reduce((a, y) => a + y.fixed, 0);
  const expired = s.years.reduce((a, y) => a + y.expired, 0);
  return {
    vote: voteShare(s), approval: avgApproval(s), transparency: s.transparency, participation: s.participation,
    fixed, expired, buildings: s.buildings.length, money: s.money
  };
}
