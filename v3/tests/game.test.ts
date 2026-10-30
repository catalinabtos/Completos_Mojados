import { describe, expect, it } from 'vitest';
import { LEVELS, RECIPES, starsFor } from '../src/engine/data';
import { Game } from '../src/engine/game';
import { simulate } from '../src/engine/bot';

function runUntil(game: Game, cond: () => boolean, max = 60) {
  for (let t = 0; t < max && !cond(); t += 0.05) game.step(0.05);
}

function seatedCustomer(game: Game) {
  runUntil(game, () => game.seats[0] !== null);
  const c = game.customer(game.seats[0]);
  if (!c) throw new Error('no customer seated');
  return c;
}

describe('Game', () => {
  it('cooks, burns and clears vienesas on the grill', () => {
    const level = LEVELS[0];
    const game = new Game(level, 1);
    game.tapGrill(0);
    expect(game.grill[0].state).toBe('cooking');
    runUntil(game, () => game.grill[0].state === 'ready');
    expect(game.grill[0].state).toBe('ready');
    runUntil(game, () => game.grill[0].state === 'burnt');
    expect(game.grill[0].state).toBe('burnt');
    expect(game.stats.burnt).toBe(1);
    game.tapGrill(0);
    expect(game.grill[0].state).toBe('empty');
  });

  it('serves a correct order and gets paid', () => {
    const game = new Game({ ...LEVELS[0], recipes: { italiano: 1 } }, 7);
    const c = seatedCustomer(game);
    game.tapGrill(0);
    game.tapPan();
    runUntil(game, () => game.grill[0].state === 'ready');
    game.tapGrill(0);
    for (const t of RECIPES.italiano.toppings) game.tapTopping(t);
    expect(game.trayRecipe()).toBe('italiano');
    game.serve(c.seat!);
    expect(game.money).toBeGreaterThanOrEqual(RECIPES.italiano.price);
    expect(game.stats.served).toBe(1);
    expect(game.tray).toBeNull();
  });

  it('rejects a wrong completo and keeps the tray', () => {
    const game = new Game({ ...LEVELS[0], recipes: { italiano: 1 } }, 3);
    const c = seatedCustomer(game);
    const before = c.patience;
    game.tapGrill(0);
    game.tapPan();
    runUntil(game, () => game.grill[0].state === 'ready');
    game.tapGrill(0);
    for (const t of RECIPES.completo.toppings) game.tapTopping(t);
    game.serve(c.seat!);
    expect(game.money).toBe(0);
    expect(game.tray).not.toBeNull();
    expect(c.patience).toBeLessThan(before);
  });

  it('needs pan and vienesa before toppings', () => {
    const game = new Game(LEVELS[0], 1);
    game.tapTopping('tomate');
    expect(game.tray).toBeNull();
    game.tapPan();
    game.tapTopping('tomate');
    expect(game.tray!.toppings).toEqual([]);
  });

  it('customers leave angry when patience runs out', () => {
    const game = new Game(LEVELS[0], 5);
    runUntil(game, () => game.stats.lost > 0, 120);
    expect(game.stats.lost).toBeGreaterThan(0);
  });

  it('an idle player loses every level', () => {
    for (const level of LEVELS) {
      const game = new Game(level, 11);
      while (!game.finished) game.step(0.1);
      expect(game.won).toBe(false);
      expect(starsFor(level, game.money)).toBe(0);
    }
  });
});

describe('levels are playable', () => {
  it('has 3 levels', () => {
    expect(LEVELS).toHaveLength(3);
  });

  for (const level of LEVELS) {
    it(`level ${level.id} (${level.name}) is winnable by a skilled player on every seed`, () => {
      for (let seed = 1; seed <= 20; seed += 1) {
        const result = simulate(level, seed, 0.6);
        expect(result.won, `seed ${seed}: ${result.money}`).toBe(true);
      }
    });

    it(`level ${level.id} only uses toppings and drinks that are available`, () => {
      for (const recipe of Object.keys(level.recipes) as (keyof typeof RECIPES)[]) {
        for (const t of RECIPES[recipe].toppings) expect(level.toppings).toContain(t);
      }
    });
  }
});
