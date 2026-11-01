// Pantallas de menú: portada, cómo jugar, la ruta de niveles, Mi carrito, introducción, recetas, pausa y resultados.

import { DRINKS, LEVELS, RECIPES, TOPPINGS, formatCLP, starsFor, type LevelConfig, type RecipeId } from '../engine/data';
import type { Game } from '../engine/game';
import { SPEAKERS, type StoryCard } from '../engine/story';
import { DECOR, UPGRADES, nextUpgradePrice, upgradeLevel, type DecorId, type UpgradeId } from '../engine/upgrades';
import { DECOR_ART, DRINK_ART, MASCOT, SPEAKER_ART, TOPPING_ART, UPGRADE_ART, img } from './art';
import { button, el, svgIcon } from './dom';
import type { SaveData } from './storage';

function starsEl(n: number, cls = 'stars', size = 20): HTMLElement {
  const stars = [1, 2, 3].map((i) => {
    const star = svgIcon('star', size);
    if (i <= n) star.classList.add('star-on');
    return star;
  });
  return el('span', { class: cls, role: 'img', 'aria-label': `${n} de 3 estrellas` }, ...stars);
}

function awning(): HTMLElement {
  return el('div', { class: 'awning big' });
}

export function titleScreen(save: SaveData, onPlay: () => void, onHowTo: () => void, onToggleSound: () => void): HTMLElement {
  const sound = button([svgIcon(save.sound ? 'sound' : 'mute'), save.sound ? 'Sonido' : 'Sin sonido'], onToggleSound, 'btn secondary');
  return el(
    'div',
    { class: 'screen title-screen' },
    awning(),
    el(
      'div',
      { class: 'title-body' },
      img(MASCOT.feliz, 'Mascota: un completo talquino sonriente', 'title-art'),
      el('h1', {}, 'Completos Mojados'),
      el('p', { class: 'tagline' }, 'El carrito más rápido de Talca'),
      el(
        'div',
        { class: 'menu' },
        button('¡Jugar!', onPlay, 'btn primary big'),
        el('div', { class: 'menu-row' }, button('Cómo jugar', onHowTo, 'btn secondary'), sound)
      )
    ),
    el('p', { class: 'made-in' }, 'Hecho en el Maule')
  );
}

export function howToScreen(onBack: () => void): HTMLElement {
  const steps: [string, string][] = [
    ['Vaporera', 'Toca la vaporera para poner un pan sobre la toalla. Cuando esté blandito, tócalo para pasarlo a la tabla. Si lo dejas mucho rato, se agua.'],
    ['Olla', 'Toca la olla para echar una vienesa al agua caliente. Cuando esté lista, tócala para ponerla en el pan. Si la olvidas, se revienta.'],
    ['Ingredientes', 'Agrega lo que muestra el globo del cliente. El orden no importa.'],
    ['Hielera', 'Si pide bebida, tócala en la hielera y entrégala también.'],
    ['Servir', 'Toca al cliente para entregarle su pedido. Mientras más rápido, más propina.'],
    ['Meta', 'Junta la plata de la meta antes de que termine el turno para pasar a la siguiente esquina.']
  ];
  return el(
    'div',
    { class: 'screen panel-screen' },
    header('Cómo jugar', onBack),
    el(
      'div',
      { class: 'panel-body' },
      el('ol', { class: 'howto' }, ...steps.map(([title, text], i) => el('li', {}, el('span', { class: 'howto-num' }, String(i + 1)), el('div', {}, el('strong', {}, title), el('p', {}, text))))),
      el('h3', { class: 'shop-title' }, 'Ingredientes'),
      el('div', { class: 'recipe-items' }, ...LEVELS[LEVELS.length - 1].toppings.map((t) => el('span', { class: 'chip' }, img(TOPPING_ART[t]), TOPPINGS[t].name))),
      el('h3', { class: 'shop-title' }, 'Bebidas'),
      el('div', { class: 'recipe-items' }, ...Object.values(DRINKS).map((d) => el('span', { class: 'chip' }, img(DRINK_ART[d.id]), d.name))),
      button('¡Entendido!', onBack, 'btn primary big')
    )
  );
}

function header(title: string, onBack: () => void): HTMLElement {
  const back = button(svgIcon('back'), onBack, 'back-btn');
  back.setAttribute('aria-label', 'Volver');
  return el('header', { class: 'screen-header' }, back, el('h2', {}, title));
}

export function levelSelectScreen(save: SaveData, onPick: (level: LevelConfig) => void, onBack: () => void, onCart: () => void): HTMLElement {
  const stops = LEVELS.map((level) => {
    const locked = level.id > save.unlocked;
    const current = level.id === save.unlocked;
    const stars = save.stars[level.id] ?? 0;
    const best = save.best[level.id];
    const state = locked ? 'locked' : current && stars === 0 ? 'current' : 'done';
    const detail = locked ? `Meta ${formatCLP(level.goal)}` : best ? `Récord ${formatCLP(best)}` : `Meta ${formatCLP(level.goal)} · ¡te toca!`;
    return button(
      [
        el('span', { class: 'stop-badge' }, locked ? svgIcon('lock', 22) : String(level.id)),
        el('span', { class: 'stop-card' }, el('span', { class: 'stop-info' }, el('strong', {}, level.name), el('span', {}, detail)), starsEl(stars))
      ],
      () => {
        if (!locked) onPick(level);
      },
      `stop ${state}`
    );
  });
  const cart = button([el('span', {}, 'Mi carrito'), el('span', { class: 'cart-link-money' }, formatCLP(save.wallet))], onCart, 'btn secondary cart-link');
  return el(
    'div',
    { class: 'screen panel-screen route-screen' },
    header('La ruta del carrito', onBack),
    el('div', { class: 'route' }, ...stops),
    el('div', { class: 'route-footer' }, cart)
  );
}

const SHOP_UPGRADES: UpgradeId[] = ['olla', 'toalla', 'fuego', 'banquitos', 'radio', 'tabla'];

export interface CartActions {
  onBuyUpgrade: (id: UpgradeId) => void;
  onBuyDecor: (id: DecorId) => void;
  onToggleDecor: (id: DecorId) => void;
  onReset: () => void;
  onBack: () => void;
}

function upgradeRow(save: SaveData, id: UpgradeId, onBuy: () => void): HTMLElement {
  const info = UPGRADES[id];
  const level = upgradeLevel(save.upgrades, id);
  const price = nextUpgradePrice(save.upgrades, id);
  const pips = info.prices.map((_, i) => el('i', { class: i < level ? 'on' : '' }));
  const buy = button(price === null ? 'Al máximo' : formatCLP(price), onBuy, 'btn primary buy-btn');
  buy.disabled = price === null || save.wallet < price;
  return el(
    'div',
    { class: 'shop-row' },
    UPGRADE_ART[id] ? img(UPGRADE_ART[id], '', 'shop-art') : null,
    el('div', { class: 'shop-info' }, el('strong', {}, info.name), el('span', {}, info.effect), el('div', { class: 'pips', 'aria-label': `Nivel ${level} de ${info.prices.length}` }, ...pips)),
    buy
  );
}

function decorRow(save: SaveData, id: DecorId, art: string, actions: CartActions): HTMLElement {
  const info = DECOR[id];
  const owned = save.decorOwned.includes(id);
  const on = save.decorOn.includes(id);
  const action = owned
    ? button(on ? 'Puesto' : 'Poner', () => actions.onToggleDecor(id), `btn ${on ? 'secondary' : 'primary'} buy-btn`)
    : button(formatCLP(info.price), () => actions.onBuyDecor(id), 'btn primary buy-btn');
  action.disabled = !owned && save.wallet < info.price;
  return el('div', { class: 'shop-row' }, img(art, '', 'shop-art'), el('div', { class: 'shop-info' }, el('strong', {}, info.name)), action);
}

export function cartScreen(save: SaveData, actions: CartActions): HTMLElement {
  const decor = (Object.entries(DECOR_ART) as [DecorId, string][]).map(([id, art]) => decorRow(save, id, art, actions));
  return el(
    'div',
    { class: 'screen panel-screen cart-screen' },
    header('Mi carrito', actions.onBack),
    el(
      'div',
      { class: 'panel-body' },
      el('div', { class: 'piggy' }, el('small', {}, 'En la alcancía'), el('span', { class: 'money-big' }, formatCLP(save.wallet))),
      el('h3', { class: 'shop-title' }, 'Mejoras'),
      ...SHOP_UPGRADES.map((id) => upgradeRow(save, id, () => actions.onBuyUpgrade(id))),
      el('h3', { class: 'shop-title' }, 'Decoración'),
      ...decor,
      button('Empezar de cero', actions.onReset, 'btn ghost')
    )
  );
}

export function resetBody(): HTMLElement {
  return el('p', { class: 'reset-text' }, 'Se borran las esquinas ganadas, los récords, la alcancía y las mejoras. No se puede deshacer.');
}

function recipeCard(id: RecipeId, isNew = false): HTMLElement {
  const r = RECIPES[id];
  return el(
    'div',
    { class: `recipe-card${isNew ? ' new' : ''}` },
    el('div', { class: 'recipe-head' }, el('strong', {}, r.name), isNew ? el('span', { class: 'new-badge' }, 'Nuevo') : null, el('span', { class: 'price' }, formatCLP(r.price))),
    el('div', { class: 'recipe-items' }, ...r.toppings.map((t) => el('span', { class: 'chip' }, img(TOPPING_ART[t]), TOPPINGS[t].name)))
  );
}

export function recipesPanel(level: LevelConfig): HTMLElement {
  const ids = Object.keys(level.recipes) as RecipeId[];
  return el(
    'div',
    { class: 'recipes' },
    ...ids.map((id) => recipeCard(id, level.newThings.includes(RECIPES[id].name))),
    level.drinks.length > 0
      ? el(
          'div',
          { class: 'recipe-card drinks-card' },
          el('div', { class: 'recipe-head' }, el('strong', {}, 'Hielera')),
          el('div', { class: 'recipe-items' }, ...level.drinks.map((d) => el('span', { class: 'chip' }, img(DRINK_ART[d]), `${DRINKS[d].name} ${formatCLP(DRINKS[d].price)}`)))
        )
      : null
  );
}

export function storyScreen(card: StoryCard, onContinue: () => void): HTMLElement {
  return el(
    'div',
    { class: 'screen story-screen' },
    awning(),
    el(
      'div',
      { class: 'story-body' },
      el('div', { class: 'story-bubble' }, el('strong', {}, SPEAKERS[card.speaker]), el('p', {}, card.text)),
      img(SPEAKER_ART[card.speaker], '', `story-art${card.speaker === 'teresa' ? ' mascota' : ''}`),
      button('Seguir', onContinue, 'btn primary big')
    )
  );
}

export function introScreen(level: LevelConfig, onStart: () => void, onBack: () => void): HTMLElement {
  const mins = `${Math.floor(level.duration / 60)}:${String(level.duration % 60).padStart(2, '0')}`;
  return el(
    'div',
    { class: `screen panel-screen intro` },
    header(`Esquina ${level.id}`, onBack),
    el(
      'div',
      { class: 'panel-body' },
      el('div', { class: 'intro-hero' }, el('h2', {}, level.name), el('p', { class: 'intro-place' }, level.place)),
      el('p', { class: 'intro-text' }, level.intro),
      el(
        'div',
        { class: 'intro-facts' },
        el('span', {}, el('small', {}, 'Meta'), formatCLP(level.goal)),
        el('span', {}, el('small', {}, 'Turno'), mins),
        el('span', {}, el('small', {}, 'Puestos'), String(level.seats))
      ),
      recipesPanel(level),
      button('¡A trabajar!', onStart, 'btn primary big')
    )
  );
}

export function overlay(title: string, body: HTMLElement | null, actions: HTMLButtonElement[], art?: string): HTMLElement {
  return el(
    'div',
    { class: 'overlay' },
    el('div', { class: 'overlay-card' }, art ? img(art, '', 'overlay-art') : null, el('h2', {}, title), body, el('div', { class: 'menu' }, ...actions))
  );
}

export function resultsScreen(game: Game, isRecord: boolean, hasNext: boolean, wallet: number, onNext: () => void, onRetry: () => void, onLevels: () => void): HTMLElement {
  const level = game.level;
  const stars = starsFor(level, game.money);
  const won = game.won;
  const s = game.stats;
  const primary = won && hasNext ? button('Siguiente esquina', onNext, 'btn primary big') : button(won ? 'Jugar de nuevo' : 'Reintentar', onRetry, 'btn primary big');
  const secondary = [
    won && hasNext ? button('Otra vez', onRetry, 'btn secondary') : null,
    button('La ruta', onLevels, 'btn secondary')
  ].filter((b): b is HTMLButtonElement => b !== null);
  const row = (label: string, value: string) => [el('span', {}, label), el('span', { class: 'num' }, value)];
  return el(
    'div',
    { class: `screen results ${won ? 'won' : 'lost'}` },
    el(
      'div',
      { class: 'results-body' },
      img(won ? MASCOT.celebra : MASCOT.preocupada, '', 'result-art'),
      el('h2', {}, won ? (level.id === LEVELS.length ? '¡Rey del completo talquino!' : '¡Turno superado!') : 'No llegaste a la meta'),
      starsEl(stars, 'stars result-stars', 44),
      el(
        'div',
        { class: 'result-card' },
        el('div', { class: 'result-money' }, el('span', { class: 'money-big' }, formatCLP(game.money)), el('span', {}, `meta ${formatCLP(level.goal)}`)),
        isRecord ? el('div', { class: 'record' }, '¡Nuevo récord!') : null,
        el('div', { class: 'result-piggy' }, `A la alcancía: +${formatCLP(game.money)} · Total ${formatCLP(wallet)}`),
        el(
          'div',
          { class: 'result-stats' },
          ...row('Atendidos', String(s.served)),
          ...row('Se fueron enojados', String(s.lost)),
          ...row('Propinas', formatCLP(s.tips)),
          ...row('Mejor combo', `×${s.maxCombo}`),
          ...row('Reventadas y aguados', String(s.ruined))
        )
      )
    ),
    el('div', { class: 'menu' }, primary, secondary.length > 1 ? el('div', { class: 'menu-row' }, ...secondary) : secondary[0])
  );
}
