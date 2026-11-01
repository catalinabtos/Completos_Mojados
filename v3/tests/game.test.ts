import { describe, expect, it } from 'vitest';
import { LEVELS, RECIPES, starsFor } from '../src/engine/data';
import { Game } from '../src/engine/game';
import { simulate } from '../src/engine/bot';
import { DECOR, UPGRADES, applyUpgrades, buyDecor, buyUpgrade, gameOptions, sanitizeCart, toggleDecor, type CartState, type UpgradeLevels } from '../src/engine/upgrades';
import { STORY, STORY_ENDING } from '../src/engine/story';
import { SONG } from '../src/ui/music';
import { parseSave, resetSave } from '../src/ui/storage';

/** Ritmo (segundos por acción) con el que cada nivel debe poder ganarse. */
const TARGET_REACTION = [1.35, 1.25, 1.15, 1.05, 1.0, 0.95, 0.9, 0.9, 0.85, 0.75];

function runUntil(game: Game, cond: () => boolean, max = 60) {
  for (let t = 0; t < max && !cond(); t += 0.05) game.step(0.05);
}

function seatedCustomer(game: Game) {
  runUntil(game, () => game.seats[0] !== null);
  const c = game.customer(game.seats[0]);
  if (!c) throw new Error('no customer seated');
  return c;
}

/** Saca un pan de la vaporera y una vienesa de la olla a la tabla. */
function prepareBase(game: Game) {
  game.tapSlot('vapor', 0);
  game.tapSlot('olla', 0);
  runUntil(game, () => game.vapor[0].state === 'ready' && game.olla[0].state === 'ready');
  game.tapSlot('vapor', 0);
  game.tapSlot('olla', 0);
}

describe('Game', () => {
  it('heats vienesas in the pot until they burst', () => {
    const game = new Game(LEVELS[0], 1);
    game.tapSlot('olla', 0);
    expect(game.olla[0].state).toBe('cooking');
    runUntil(game, () => game.olla[0].state === 'ready');
    expect(game.olla[0].state).toBe('ready');
    runUntil(game, () => game.olla[0].state === 'ruined');
    expect(game.olla[0].state).toBe('ruined');
    expect(game.stats.ruined).toBe(1);
    game.tapSlot('olla', 0);
    expect(game.olla[0].state).toBe('empty');
  });

  it('steams bread that turns soggy if left too long', () => {
    const game = new Game(LEVELS[0], 1);
    game.tapSlot('vapor', 1);
    runUntil(game, () => game.vapor[1].state === 'ruined');
    expect(game.vapor[1].state).toBe('ruined');
    expect(game.stats.ruined).toBe(1);
  });

  it('needs steamed bread before the vienesa and the vienesa before toppings', () => {
    const game = new Game(LEVELS[0], 1);
    game.tapSlot('olla', 0);
    runUntil(game, () => game.olla[0].state === 'ready');
    game.tapSlot('olla', 0);
    expect(game.olla[0].state).toBe('ready');
    expect(game.tray).toBeNull();
    game.tapSlot('vapor', 0);
    runUntil(game, () => game.vapor[0].state === 'ready');
    game.tapSlot('vapor', 0);
    game.tapTopping('tomate');
    expect(game.tray).toEqual({ vienesa: false, toppings: [] });
    game.tapSlot('olla', 0);
    game.tapTopping('tomate');
    expect(game.tray!.toppings).toEqual(['tomate']);
  });

  it('serves a correct order and gets paid', () => {
    const game = new Game(LEVELS[0], 7);
    const c = seatedCustomer(game);
    prepareBase(game);
    for (const t of RECIPES.completo.toppings) game.tapTopping(t);
    expect(game.trayRecipe()).toBe('completo');
    game.serve(c.seat!);
    expect(game.money).toBeGreaterThanOrEqual(RECIPES.completo.price);
    expect(game.stats.served).toBe(1);
    expect(game.tray).toBeNull();
  });

  it('rejects a wrong completo and keeps the tray', () => {
    const game = new Game({ ...LEVELS[1], recipes: { italiano: 1 } }, 3);
    const c = seatedCustomer(game);
    const before = c.patience;
    prepareBase(game);
    for (const t of RECIPES.completo.toppings) game.tapTopping(t);
    game.serve(c.seat!);
    expect(game.money).toBe(0);
    expect(game.tray).not.toBeNull();
    expect(c.patience).toBeLessThan(before);
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
  for (const level of LEVELS) {
    it(`level ${level.id} (${level.name}) has reachable star goals`, () => {
      expect(level.goal).toBeLessThan(level.stars[0]);
      expect(level.stars[0]).toBeLessThan(level.stars[1]);
      const three = Array.from({ length: 40 }, (_, i) => simulate(level, i + 1, 0.7)).filter((r) => starsFor(level, r.money) === 3).length;
      expect(three).toBeGreaterThanOrEqual(16);
    });
  }

  it('has 10 levels with rising goals for the first ones', () => {
    expect(LEVELS).toHaveLength(10);
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  for (const level of LEVELS) {
    it(`level ${level.id} (${level.name}) is winnable at ${TARGET_REACTION[level.id - 1]} s per action`, () => {
      const reaction = TARGET_REACTION[level.id - 1];
      const wins = Array.from({ length: 20 }, (_, i) => simulate(level, i + 1, reaction)).filter((r) => r.won).length;
      expect(wins).toBeGreaterThanOrEqual(18);
    });

    it(`level ${level.id} only asks for toppings that are on the counter`, () => {
      for (const recipe of Object.keys(level.recipes) as (keyof typeof RECIPES)[]) {
        for (const t of RECIPES[recipe].toppings) expect(level.toppings).toContain(t);
      }
    });

    it(`level ${level.id} shows the counter in the same order as the orders`, () => {
      for (const recipe of Object.keys(level.recipes) as (keyof typeof RECIPES)[]) {
        const asked = RECIPES[recipe].toppings;
        expect(level.toppings.filter((t) => asked.includes(t))).toEqual(asked);
      }
    });
  }
});

describe('la música', () => {
  it('keeps every bar of the theme in 6/8', () => {
    for (const [, phrase] of SONG) expect(phrase.reduce((sum, [, length]) => sum + length, 0)).toBe(6);
  });
});

describe('la historia', () => {
  it('has a short card for every level and for the ending', () => {
    for (const id of [...LEVELS.map((l) => l.id), STORY_ENDING]) {
      expect(STORY[id].text.length).toBeGreaterThan(0);
      expect(STORY[id].text.length).toBeLessThanOrEqual(130);
    }
  });

  it('starts unseen in an old save and comes back after a reset', () => {
    expect(parseSave(JSON.stringify({ unlocked: 4 })).storySeen).toEqual([]);
    expect(parseSave(JSON.stringify({ storySeen: 'x' })).storySeen).toEqual([]);
    expect(resetSave({ ...parseSave(null), storySeen: [1, 2] }).storySeen).toEqual([]);
  });
});

describe('el carrito crece', () => {
  const cart = (wallet: number): CartState => ({ wallet, upgrades: {}, decorOwned: [], decorOn: [] });
  const maxed = Object.fromEntries(Object.values(UPGRADES).map((u) => [u.id, u.prices.length])) as UpgradeLevels;

  it('applies upgrades without touching the original level', () => {
    const base = structuredClone(LEVELS[0]);
    const up = applyUpgrades(LEVELS[0], { olla: 2, toalla: 1, fuego: 2, banquitos: 3 });
    expect(LEVELS[0]).toEqual(base);
    expect(up.olla.slots).toBe(base.olla.slots + 2);
    expect(up.vapor.hold).toBe(base.vapor.hold + 1.5);
    expect(up.olla.hold).toBe(base.olla.hold + 3);
    expect(up.patience).toBe(base.patience + 6);
    expect(up.goal).toBe(base.goal);
  });

  it('charges each level once and stops at the maximum', () => {
    const c = cart(UPGRADES.olla.prices[0] + UPGRADES.olla.prices[1] + 1000);
    expect(buyUpgrade(c, 'olla')).toBe(true);
    expect(buyUpgrade(c, 'olla')).toBe(true);
    expect(c.wallet).toBe(1000);
    expect(c.upgrades.olla).toBe(2);
    c.wallet = 1e7;
    expect(buyUpgrade(c, 'olla')).toBe(false);
    expect(c.wallet).toBe(1e7);
  });

  it('does not sell what the wallet cannot pay', () => {
    const c = cart(UPGRADES.toalla.prices[0] - 1);
    expect(buyUpgrade(c, 'toalla')).toBe(false);
    expect(buyDecor(c, 'luces')).toBe(false);
    expect(c).toEqual(cart(UPGRADES.toalla.prices[0] - 1));
  });

  it('keeps one awning at a time and never charges twice for decor', () => {
    const c = cart(DECOR.toldo_verde.price + DECOR.toldo_azul.price);
    buyDecor(c, 'toldo_verde');
    buyDecor(c, 'toldo_azul');
    expect(c.decorOn).toEqual(['toldo_azul']);
    expect(c.wallet).toBe(0);
    toggleDecor(c, 'toldo_verde');
    expect(c.decorOn).toEqual(['toldo_verde']);
    expect(buyDecor(c, 'toldo_verde')).toBe(false);
    toggleDecor(c, 'toldo_verde');
    expect(c.decorOn).toEqual([]);
  });

  it('migrates a save from before the wallet', () => {
    const save = parseSave(JSON.stringify({ unlocked: 4, best: { 1: 30000 }, stars: { 1: 2 }, sound: false, tutorialDone: true }));
    expect(save).toMatchObject({ unlocked: 4, sound: false, wallet: 0, upgrades: {}, decorOwned: [], decorOn: [] });
    expect(save.best[1]).toBe(30000);
  });

  it('survives a damaged save', () => {
    expect(parseSave('{no es json').wallet).toBe(0);
    const c = sanitizeCart({ wallet: Number.NaN, upgrades: { olla: 99, radio: -1, toalla: 'x' as never }, decorOwned: ['macetero', 'toldo_rosado' as never], decorOn: ['macetero', 'luces'] });
    expect(c).toEqual({ wallet: 0, upgrades: { olla: 2 }, decorOwned: ['macetero'], decorOn: ['macetero'] });
  });

  it('resets progress but keeps the preferences', () => {
    const save = { ...parseSave(null), unlocked: 9, wallet: 5000, upgrades: { radio: 1 }, sound: false, tutorialDone: true };
    expect(resetSave(save)).toEqual({ ...parseSave(null), sound: false, tutorialDone: true });
  });

  it('pays more tip with the radio', () => {
    const tips = (upgrades: UpgradeLevels) => {
      const game = new Game(LEVELS[0], 7, gameOptions(upgrades));
      const c = seatedCustomer(game);
      prepareBase(game);
      for (const t of RECIPES.completo.toppings) game.tapTopping(t);
      game.serve(c.seat!);
      return game.stats.tips;
    };
    expect(tips({ radio: 3 })).toBeGreaterThan(tips({}));
  });

  /** Saca dos panes con vienesa a la tabla más grande. */
  function prepareTwo(game: Game) {
    for (const station of ['vapor', 'olla'] as const) {
      game.tapSlot(station, 0);
      game.tapSlot(station, 1);
    }
    runUntil(game, () => game.vapor[1].state === 'ready' && game.olla[1].state === 'ready');
    game.tapSlot('vapor', 0);
    game.tapSlot('olla', 0);
    game.tapSlot('vapor', 1);
    game.tapSlot('olla', 1);
  }

  it('the small board holds a single bread', () => {
    const game = new Game(LEVELS[0], 7);
    prepareTwo(game);
    expect(game.trays.filter(Boolean)).toHaveLength(1);
    expect(game.vapor[1].state).toBe('ready');
  });

  it('the big board builds two completos at once', () => {
    const game = new Game(LEVELS[0], 7, { bigBoard: true });
    prepareTwo(game);
    expect(game.trays).toEqual([{ vienesa: true, toppings: [] }, { vienesa: true, toppings: [] }]);
    expect(game.activeTray).toBe(1);
    game.tapTopping('tomate');
    game.tapTray(0);
    game.tapTopping('palta');
    expect(game.trays[0]!.toppings).toEqual(['palta']);
    expect(game.trays[1]!.toppings).toEqual(['tomate']);
  });

  it('serves the completo that fits from either side and keeps the other', () => {
    const game = new Game(LEVELS[0], 7, { bigBoard: true });
    const c = seatedCustomer(game);
    prepareTwo(game);
    game.tapTopping('palta');
    game.tapTray(0);
    for (const t of RECIPES[c.recipe].toppings) game.tapTopping(t);
    game.tapTray(1);
    game.serve(c.seat!);
    expect(game.stats.served).toBe(1);
    expect(game.trays[0]).toBeNull();
    expect(game.tray!.toppings).toEqual(['palta']);
    game.trashTray();
    expect(game.trays).toEqual([null, null]);
  });

  it('moves on to the waiting completo after serving the active one', () => {
    const game = new Game(LEVELS[0], 7, { bigBoard: true });
    const c = seatedCustomer(game);
    prepareTwo(game);
    for (const t of RECIPES[c.recipe].toppings) game.tapTopping(t);
    game.serve(c.seat!);
    expect(game.tray).toEqual({ vienesa: true, toppings: [] });
  });

  it('the small board ignores taps on a second side', () => {
    const game = new Game(LEVELS[0], 7);
    game.tapTray(1);
    expect(game.activeTray).toBe(0);
  });

  for (const level of LEVELS) {
    it(`level ${level.id} never gets harder with every upgrade`, () => {
      const reaction = TARGET_REACTION[level.id - 1];
      const up = applyUpgrades(level, maxed);
      const wins = Array.from({ length: 20 }, (_, i) => simulate(up, i + 1, reaction)).filter((r) => r.won).length;
      expect(wins).toBeGreaterThanOrEqual(18);
    });
  }
});
