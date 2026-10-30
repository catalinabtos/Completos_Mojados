// Jugador automático usado en los tests para verificar que los niveles se pueden ganar.

import { RECIPES, type LevelConfig } from './data';
import { Game, type Customer } from './game';

export interface BotResult {
  money: number;
  won: boolean;
  served: number;
  lost: number;
  burnt: number;
}

/** Ejecuta una sola acción, la que el bot considera más urgente. Devuelve false si no hizo nada. */
export function botAct(game: Game): boolean {
  const burnt = game.grill.findIndex((s) => s.state === 'burnt');
  if (burnt >= 0) {
    game.tapGrill(burnt);
    return true;
  }

  const seated = game.seats
    .map((id) => game.customer(id))
    .filter((c): c is Customer => !!c && c.state === 'seated')
    .sort((a, b) => a.patience - b.patience);

  // Entregar bebidas pendientes de quienes ya tienen su completo.
  for (const c of seated) {
    if (c.gotCompleto && !c.gotDrink && c.drink) {
      if (game.heldDrink !== c.drink) game.tapDrink(c.drink);
      else game.serve(c.seat!);
      return true;
    }
  }

  const needing = seated.filter((c) => !c.gotCompleto);
  const tray = game.tray;
  const trayRecipe = game.trayRecipe();

  if (trayRecipe) {
    const target = needing.find((c) => c.recipe === trayRecipe);
    if (target) {
      if (target.drink && !target.gotDrink && game.heldDrink !== target.drink) {
        game.tapDrink(target.drink);
      } else {
        game.serve(target.seat!);
      }
      return true;
    }
  }

  const target = needing[0];
  const active = game.grill.filter((s) => s.state === 'cooking' || s.state === 'ready').length;
  const empty = game.grill.findIndex((s) => s.state === 'empty');
  const demand = needing.length + game.queue.length;

  if (target) {
    if (!tray) {
      game.tapPan();
      return true;
    }
    if (!tray.vienesa) {
      const ready = game.grill.findIndex((s) => s.state === 'ready');
      if (ready >= 0) {
        game.tapGrill(ready);
        return true;
      }
    } else {
      const missing = RECIPES[target.recipe].toppings.find((t) => !tray.toppings.includes(t));
      const wrong = tray.toppings.some((t) => !RECIPES[target.recipe].toppings.includes(t));
      if (wrong) {
        game.trashTray();
        return true;
      }
      if (missing) {
        game.tapTopping(missing);
        return true;
      }
    }
  }

  if (empty >= 0 && active < Math.max(1, demand)) {
    game.tapGrill(empty);
    return true;
  }
  return false;
}

/** Simula un nivel completo. `reaction` es el tiempo entre acciones del jugador. */
export function simulate(level: LevelConfig, seed: number, reaction: number): BotResult {
  const game = new Game(level, seed);
  const dt = 1 / 30;
  let cooldown = 0;
  while (!game.finished) {
    game.step(dt);
    cooldown -= dt;
    if (cooldown <= 0 && botAct(game)) cooldown = reaction;
    game.drainEvents();
  }
  return {
    money: game.money,
    won: game.won,
    served: game.stats.served,
    lost: game.stats.lost,
    burnt: game.stats.burnt
  };
}
