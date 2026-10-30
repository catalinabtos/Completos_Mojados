// Jugador automático usado en los tests para verificar que los niveles se pueden ganar.

import { RECIPES, type LevelConfig } from './data';
import { Game, type Customer, type StationId } from './game';

export interface BotResult {
  money: number;
  won: boolean;
  served: number;
  lost: number;
  ruined: number;
}

export type BotAction =
  | { kind: 'slot'; station: StationId; index: number }
  | { kind: 'topping'; topping: string }
  | { kind: 'drink'; drink: string }
  | { kind: 'serve'; seat: number }
  | { kind: 'trash' };

/** Decide la acción más urgente, o null si no conviene hacer nada. */
export function botDecide(game: Game): BotAction | null {
  for (const station of ['olla', 'vapor'] as const) {
    const ruined = game.slots(station).findIndex((s) => s.state === 'ruined');
    if (ruined >= 0) return { kind: 'slot', station, index: ruined };
  }

  const seated = game.seats
    .map((id) => game.customer(id))
    .filter((c): c is Customer => !!c && c.state === 'seated')
    .sort((a, b) => a.patience - b.patience);

  // Entregar bebidas pendientes de quienes ya tienen su completo.
  for (const c of seated) {
    if (c.gotCompleto && !c.gotDrink && c.drink) {
      return game.heldDrink !== c.drink ? { kind: 'drink', drink: c.drink } : { kind: 'serve', seat: c.seat! };
    }
  }

  const needing = seated.filter((c) => !c.gotCompleto);
  const tray = game.tray;
  const trayRecipe = game.trayRecipe();

  if (trayRecipe) {
    const target = needing.find((c) => c.recipe === trayRecipe);
    if (target) {
      if (target.drink && !target.gotDrink && game.heldDrink !== target.drink) {
        return { kind: 'drink', drink: target.drink };
      }
      return { kind: 'serve', seat: target.seat! };
    }
  }

  const target = needing[0];
  if (target) {
    if (!tray) {
      const pan = game.vapor.findIndex((s) => s.state === 'ready');
      if (pan >= 0) return { kind: 'slot', station: 'vapor', index: pan };
    } else if (!tray.vienesa) {
      const vienesa = game.olla.findIndex((s) => s.state === 'ready');
      if (vienesa >= 0) return { kind: 'slot', station: 'olla', index: vienesa };
    } else {
      const want = RECIPES[target.recipe].toppings;
      if (tray.toppings.some((t) => !want.includes(t))) return { kind: 'trash' };
      const missing = want.find((t) => !tray.toppings.includes(t));
      if (missing) return { kind: 'topping', topping: missing };
    }
  }

  // Mantener la olla y la vaporera al ritmo de la demanda.
  // Se prepara para los clientes sentados sin completo, más uno si hay fila.
  const demand = Math.max(1, needing.length + (game.queue.length > 0 ? 1 : 0));
  for (const station of ['vapor', 'olla'] as const) {
    const slots = game.slots(station);
    const active = slots.filter((s) => s.state === 'cooking' || s.state === 'ready').length;
    const inTray = station === 'vapor' ? (tray ? 1 : 0) : tray?.vienesa ? 1 : 0;
    const empty = slots.findIndex((s) => s.state === 'empty');
    if (empty >= 0 && active + inTray < demand) return { kind: 'slot', station, index: empty };
  }
  return null;
}

export function applyBotAction(game: Game, action: BotAction): void {
  switch (action.kind) {
    case 'slot':
      game.tapSlot(action.station, action.index);
      break;
    case 'topping':
      game.tapTopping(action.topping as never);
      break;
    case 'drink':
      game.tapDrink(action.drink as never);
      break;
    case 'serve':
      game.serve(action.seat);
      break;
    case 'trash':
      game.trashTray();
      break;
  }
}

/** Simula un nivel completo. `reaction` es el tiempo entre acciones del jugador. */
export function simulate(level: LevelConfig, seed: number, reaction: number): BotResult {
  const game = new Game(level, seed);
  const dt = 1 / 30;
  let cooldown = 0;
  while (!game.finished) {
    game.step(dt);
    cooldown -= dt;
    if (cooldown <= 0) {
      const action = botDecide(game);
      if (action) {
        applyBotAction(game, action);
        cooldown = reaction;
      }
    }
    game.drainEvents();
  }
  return {
    money: game.money,
    won: game.won,
    served: game.stats.served,
    lost: game.stats.lost,
    ruined: game.stats.ruined
  };
}
