// Pantallas de menú: inicio, selección de nivel, introducción, recetas, pausa y resultados.

import { DRINKS, LEVELS, RECIPES, TOPPINGS, formatCLP, starsFor, type LevelConfig, type RecipeId } from '../engine/data';
import type { Game } from '../engine/game';
import { button, el } from './dom';
import mascotSvg from './mascot.svg?raw';
import type { SaveData } from './storage';

const LEVEL_HUES = [8, 140, 30, 200, 260, 120, 190, 230, 0, 45];

function starsText(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(3 - n);
}

function titleArt(): HTMLElement {
  const art = el('div', { class: 'title-art' });
  art.innerHTML = mascotSvg;
  return art;
}

export function titleScreen(save: SaveData, onPlay: () => void, onHowTo: () => void, onToggleSound: () => void): HTMLElement {
  const sound = button(save.sound ? '🔊 Sonido' : '🔇 Sin sonido', onToggleSound, 'btn ghost');
  return el(
    'div',
    { class: 'screen title-screen' },
    titleArt(),
    el('h1', {}, 'Completos', el('br'), 'Mojados'),
    el('p', { class: 'tagline' }, 'El carrito más rápido de Talca'),
    el('div', { class: 'menu' }, button('¡Jugar!', onPlay, 'btn primary big'), button('Cómo jugar', onHowTo, 'btn'), sound)
  );
}

export function howToScreen(onBack: () => void): HTMLElement {
  const steps = [
    ['🍞', 'Toca la vaporera para poner un pan sobre la toalla. Cuando esté blandito, tócalo para pasarlo a la tabla. Si lo dejas mucho rato, se agua.'],
    ['💧', 'Toca la olla para echar una vienesa al agua caliente. Cuando esté lista, tócala para ponerla en el pan. Si la olvidas, se revienta.'],
    ['🍅', 'Agrega los ingredientes que muestra el globo del cliente. El orden no importa.'],
    ['🥤', 'Si pide bebida, tócala en la hielera y entrégala también.'],
    ['👆', 'Toca al cliente para servirle. Mientras más rápido, más propina.'],
    ['⭐', 'Junta la meta de plata antes de que termine el turno para pasar de nivel.']
  ];
  return el(
    'div',
    { class: 'screen panel-screen' },
    el('h2', {}, 'Cómo jugar'),
    el('ol', { class: 'howto' }, ...steps.map(([icon, text]) => el('li', {}, el('span', { class: 'howto-icon' }, icon), el('span', {}, text)))),
    button('Volver', onBack, 'btn primary')
  );
}

export function levelSelectScreen(save: SaveData, onPick: (level: LevelConfig) => void, onBack: () => void): HTMLElement {
  const cards = LEVELS.map((level) => {
    const locked = level.id > save.unlocked;
    const stars = save.stars[level.id] ?? 0;
    const best = save.best[level.id];
    const card = button(
      [
        el('div', { class: 'level-num' }, locked ? '🔒' : String(level.id)),
        el(
          'div',
          { class: 'level-info' },
          el('strong', {}, level.name),
          el('span', {}, level.place),
          el('span', { class: 'level-goal' }, `Meta ${formatCLP(level.goal)}${best ? ` · Récord ${formatCLP(best)}` : ''}`)
        ),
        el('div', { class: 'level-stars' }, starsText(stars))
      ],
      () => {
        if (!locked) onPick(level);
      },
      `level-card level-${level.id}${locked ? ' locked' : ''}`
    );
    card.style.setProperty('--h', String(LEVEL_HUES[level.id - 1] ?? 20));
    return card;
  });
  return el(
    'div',
    { class: 'screen panel-screen' },
    el('h2', {}, 'Elige tu esquina'),
    el('div', { class: 'level-list' }, ...cards),
    button('Volver', onBack, 'btn ghost')
  );
}

function recipeCard(id: RecipeId, isNew = false): HTMLElement {
  const r = RECIPES[id];
  return el(
    'div',
    { class: `recipe-card${isNew ? ' new' : ''}` },
    el('div', { class: 'recipe-head' }, el('strong', {}, r.name), el('span', {}, formatCLP(r.price))),
    el('div', { class: 'recipe-items' }, el('span', { class: 'chip' }, '🍞 Pan'), el('span', { class: 'chip' }, '🌭 Vienesa'), ...r.toppings.map((t) => el('span', { class: 'chip', style: `--c:${TOPPINGS[t].color}` }, `${TOPPINGS[t].icon} ${TOPPINGS[t].name}`)))
  );
}

export function recipesPanel(level: LevelConfig): HTMLElement {
  const ids = Object.keys(level.recipes) as RecipeId[];
  return el(
    'div',
    { class: 'recipes' },
    ...ids.map((id) => recipeCard(id, level.newThings.includes(RECIPES[id].name))),
    level.drinks.length > 0
      ? el('div', { class: 'recipe-card' }, el('div', { class: 'recipe-head' }, el('strong', {}, 'Bebidas')), el('div', { class: 'recipe-items' }, ...level.drinks.map((d) => el('span', { class: 'chip' }, `${DRINKS[d].icon} ${DRINKS[d].name} ${formatCLP(DRINKS[d].price)}`))))
      : null
  );
}

export function introScreen(level: LevelConfig, onStart: () => void, onBack: () => void): HTMLElement {
  return el(
    'div',
    { class: `screen panel-screen intro level-${level.id}` },
    el('div', { class: 'intro-tag' }, `Nivel ${level.id}`),
    el('h2', {}, level.name),
    el('p', { class: 'intro-place' }, `📍 ${level.place}`),
    el('p', {}, level.intro),
    el('div', { class: 'intro-facts' },
      el('span', {}, `🎯 Meta ${formatCLP(level.goal)}`),
      el('span', {}, `⏱ ${Math.floor(level.duration / 60)}:${String(level.duration % 60).padStart(2, '0')}`),
      el('span', {}, `🪑 ${level.seats} puestos`)
    ),
    el('div', { class: 'new-things' }, ...level.newThings.map((t) => el('span', { class: 'new-badge' }, `Nuevo: ${t}`))),
    recipesPanel(level),
    el('div', { class: 'menu' }, button('¡A trabajar!', onStart, 'btn primary big'), button('Volver', onBack, 'btn ghost'))
  );
}

export function overlay(title: string, body: HTMLElement | null, actions: HTMLButtonElement[]): HTMLElement {
  return el('div', { class: 'overlay' }, el('div', { class: 'overlay-card' }, el('h2', {}, title), body, el('div', { class: 'menu' }, ...actions)));
}

export function resultsScreen(game: Game, isRecord: boolean, hasNext: boolean, onNext: () => void, onRetry: () => void, onLevels: () => void): HTMLElement {
  const level = game.level;
  const stars = starsFor(level, game.money);
  const won = game.won;
  const s = game.stats;
  const actions = [
    won && hasNext ? button('Siguiente nivel ▶', onNext, 'btn primary big') : null,
    button(won ? 'Jugar de nuevo' : 'Reintentar', onRetry, won && hasNext ? 'btn' : 'btn primary big'),
    button('Niveles', onLevels, 'btn ghost')
  ].filter((b): b is HTMLButtonElement => b !== null);
  return el(
    'div',
    { class: `screen panel-screen results ${won ? 'won' : 'lost'}` },
    el('div', { class: 'result-emoji' }, won ? (stars === 3 ? '🏆' : '🌭') : '🌧️'),
    el('h2', {}, won ? (level.id === LEVELS.length ? '¡Rey del completo talquino!' : '¡Turno superado!') : 'No llegaste a la meta'),
    el('div', { class: 'result-stars' }, starsText(stars)),
    el('div', { class: 'result-money' }, formatCLP(game.money), el('small', {}, ` / meta ${formatCLP(level.goal)}`)),
    isRecord ? el('div', { class: 'record' }, '¡Nuevo récord!') : null,
    el(
      'ul',
      { class: 'result-stats' },
      el('li', {}, `🌭 Clientes atendidos: ${s.served}`),
      el('li', {}, `😤 Clientes perdidos: ${s.lost}`),
      el('li', {}, `💸 Propinas: ${formatCLP(s.tips)}`),
      el('li', {}, `🔥 Mejor combo: ×${s.maxCombo}`),
      el('li', {}, `💥 Vienesas reventadas y panes aguados: ${s.ruined}`)
    ),
    el('div', { class: 'menu' }, ...actions)
  );
}
