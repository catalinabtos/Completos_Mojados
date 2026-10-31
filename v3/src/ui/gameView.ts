// Pantalla de juego: dibuja el estado del motor en el DOM y traduce toques en acciones.

import { DRINKS, RECIPES, TOPPINGS, formatCLP, type LevelConfig } from '../engine/data';
import { Game, type Customer, type GameEvent, type StationId } from '../engine/game';
import type { DecorId, GameOptions } from '../engine/upgrades';
import { play } from './audio';
import { CUSTOMER_ART, DECOR_ART, DRINK_ART, LEVEL_BG, PHOTO_BG, STATION_ART, TOPPING_ART, UPGRADE_ART, img } from './art';
import { completoEl } from './completo';
import { el, svgIcon } from './dom';

const SCENERY: Record<LevelConfig['scene'], string[]> = {
  calle: ['🏠', '🌳', '🏪', '🌳', '🏠'],
  plaza: ['🌳', '⛪', '🌳', '⛲', '🌳'],
  mercado: ['🏪', '🍎', '🥕', '🌽', '🏪'],
  universidad: ['🌳', '🏫', '📚', '🏫', '🌳'],
  estacion: ['🚉', '🚃', '🚃', '🚃', '🌳'],
  estadio: ['🚩', '🏟️', '🚩', '🏟️', '🚩'],
  rio: ['🌳', '🌊', '🛶', '🌊', '🌳'],
  feria: ['🎪', '🇨🇱', '🎡', '🇨🇱', '🎪']
};
const STATION_LABEL: Record<StationId, { title: string; empty: string; item: string }> = {
  olla: { title: 'Olla', empty: '+ vienesa', item: 'Vienesa' },
  vapor: { title: 'Vaporera', empty: '+ pan', item: 'Pan' }
};

export interface GameViewOptions {
  /** Esquina con las mejoras ya aplicadas. */
  level: LevelConfig;
  options: Partial<GameOptions>;
  /** Decoraciones puestas en el carrito. */
  decor: DecorId[];
  /** La radio comprada se ve sobre el mostrador. */
  radio: boolean;
  tutorial: boolean;
  onPause: () => void;
  onRecipes: () => void;
  onFinish: (game: Game) => void;
}

interface SeatView {
  root: HTMLElement;
  person: HTMLElement;
  face: HTMLImageElement;
  bubble: HTMLElement;
  bubbleTitle: HTMLElement;
  bubbleItems: HTMLElement;
  patience: HTMLElement;
  patienceFill: HTMLElement;
  shownId: number | null;
  key: string;
}

export class GameView {
  readonly root: HTMLElement;
  readonly game: Game;
  private paused = false;
  private raf = 0;
  private last = 0;
  private finished = false;
  private tutorialStep = 0;

  private readonly opts: GameViewOptions;
  private readonly moneyEl: HTMLElement;
  private readonly goalFill: HTMLElement;
  private readonly timeEl: HTMLElement;
  private readonly comboEl: HTMLElement;
  private readonly queueEl: HTMLElement;
  private readonly seatViews: SeatView[] = [];
  private readonly slotEls: Record<StationId, HTMLElement[]> = { olla: [], vapor: [] };
  private readonly trayEls: HTMLElement[];
  private readonly trayLabel: HTMLElement;
  private readonly heldDrinkEl: HTMLElement;
  private readonly toastEl: HTMLElement;
  private readonly tutorialEl: HTMLElement;
  private readonly fxLayer: HTMLElement;
  private toastTimer = 0;
  private lastTrayKey = '';

  constructor(opts: GameViewOptions, seed = Date.now()) {
    this.opts = opts;
    const level = opts.level;
    this.game = new Game(level, seed, opts.options);

    // ── HUD
    const pauseBtn = el('button', { class: 'icon-btn', 'aria-label': 'Pausa' }, svgIcon('pause'));
    pauseBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      opts.onPause();
    });
    this.moneyEl = el('span', { class: 'money' }, formatCLP(0));
    this.goalFill = el('div', { class: 'goal-fill' });
    this.timeEl = el('span', { class: 'time' }, '');
    this.comboEl = el('span', { class: 'combo' }, '');
    const recipesBtn = el('button', { class: 'icon-btn', 'aria-label': 'Recetas' }, svgIcon('book'));
    recipesBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      opts.onRecipes();
    });
    const hud = el(
      'header',
      { class: 'hud' },
      pauseBtn,
      el(
        'div',
        { class: 'hud-money' },
        el('div', { class: 'hud-money-row' }, this.moneyEl, el('span', { class: 'goal' }, `meta ${formatCLP(level.goal)}`)),
        el('div', { class: 'goal-bar' }, this.goalFill, el('div', { class: 'goal-mark' }))
      ),
      el('div', { class: 'hud-time' }, this.timeEl),
      recipesBtn
    );

    // ── Calle con clientes
    this.queueEl = el('div', { class: 'queue' });
    const seatsEl = el('div', { class: 'seats', style: `--seats:${level.seats}` });
    for (let s = 0; s < level.seats; s += 1) {
      const view = this.createSeat(s);
      this.seatViews.push(view);
      seatsEl.append(view.root);
    }
    const street = el(
      'section',
      { class: `street scene-${level.scene} weather-${level.weather}${LEVEL_BG[level.id] ? ' has-bg' : ''}${PHOTO_BG.has(level.id) ? ' has-foto' : ''}${this.toldoClass}` },
      el('div', { class: 'awning' }),
      el('div', { class: 'cart-post left' }),
      el('div', { class: 'cart-post right' }),
      ...this.createDecor(),
      LEVEL_BG[level.id] ? null : el('div', { class: 'scenery' }, ...SCENERY[level.scene].map((icon) => el('span', {}, icon))),
      this.comboEl,
      this.queueEl,
      seatsEl,
      el('div', { class: 'counter' }, el('span', {}, level.name))
    );
    if (LEVEL_BG[level.id]) street.style.backgroundImage = `url("${LEVEL_BG[level.id]}")`;
    if (this.rainy) street.append(this.createRain());

    // ── Cocina: olla (vienesas en agua), tabla y vaporera (panes sobre la toalla)
    const big = !!opts.options.bigBoard;
    const sides = big ? [0, 1] : [0];
    this.trayEls = sides.map(() => el('div', { class: 'tray-food' }));
    const trayArea = big
      ? el(
          'div',
          { class: 'tray-sides' },
          ...this.trayEls.map((food, i) => {
            const side = el('button', { class: 'tray-side', 'aria-label': `Lado ${i + 1} de la tabla` }, food);
            this.tap(side, () => this.game.tapTray(i));
            return side;
          })
        )
      : this.trayEls[0];
    this.trayLabel = el('div', { class: 'tray-label' }, '');
    this.heldDrinkEl = el('div', { class: 'held-drink' });
    const trashBtn = el('button', { class: 'trash-btn', 'aria-label': 'Botar lo que hay en la tabla' }, 'Botar');
    this.tap(trashBtn, () => this.game.trashTray());
    const board = el('div', { class: `board${big ? ' big' : ''}` }, el('div', { class: 'station-title' }, 'Tabla'), trayArea, this.trayLabel, this.heldDrinkEl, trashBtn);
    const toppings = el('div', { class: 'toppings' });
    for (const id of level.toppings) {
      const t = TOPPINGS[id];
      const btn = el('button', { class: 'topping', style: `--c:${t.color}` }, img(TOPPING_ART[id], '', 'big-icon'), t.name);
      btn.dataset.topping = id;
      this.tap(btn, () => this.game.tapTopping(id));
      toppings.append(btn);
    }

    const kitchenChildren: HTMLElement[] = [
      el('div', { class: 'kitchen-top' }, this.createStation('olla'), board, this.createStation('vapor')),
      toppings
    ];
    if (level.drinks.length > 0) {
      const cooler = el('div', { class: 'cooler' }, el('div', { class: 'station-title' }, 'Bebidas'));
      for (const id of level.drinks) {
        const d = DRINKS[id];
        const btn = el('button', { class: 'drink' }, img(DRINK_ART[id], '', 'big-icon'), d.name);
        this.tap(btn, () => this.game.tapDrink(id));
        cooler.append(btn);
      }
      kitchenChildren.push(cooler);
    }
    const kitchen = el('section', { class: 'kitchen' }, ...kitchenChildren);

    this.toastEl = el('div', { class: 'toast' });
    this.tutorialEl = el('div', { class: 'tutorial' });
    this.tutorialEl.hidden = !opts.tutorial;
    this.fxLayer = el('div', { class: 'fx-layer' });

    this.root = el('div', { class: 'screen game-screen' }, hud, street, kitchen, this.tutorialEl, this.toastEl, this.fxLayer);
    // Acceso para las pruebas automatizadas de la interfaz.
    (window as unknown as { __cmGame?: Game }).__cmGame = this.game;
    this.render();
  }

  private tap(target: HTMLElement, action: () => void) {
    target.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.paused || this.finished) return;
      action();
      this.handleEvents();
      this.render();
    });
  }

  private get rainy(): boolean {
    return this.opts.level.weather === 'lluvia' || this.opts.level.weather === 'tormenta';
  }

  private createStation(station: StationId): HTMLElement {
    const label = STATION_LABEL[station];
    const count = this.opts.level[station].slots;
    const slots = el('div', { class: 'slots' });
    for (let i = 0; i < count; i += 1) {
      const slot = el(
        'button',
        { class: 'slot empty', 'aria-label': `${label.title} ${i + 1}` },
        el('div', { class: station === 'olla' ? 'item vienesa' : 'item pan' }),
        el('div', { class: 'steam' }, el('i'), el('i'), el('i')),
        el('div', { class: 'progress' })
      );
      slot.dataset.empty = label.empty;
      this.tap(slot, () => this.game.tapSlot(station, i));
      slots.append(slot);
      this.slotEls[station].push(slot);
    }
    const title = el('div', { class: 'station-title' }, img(STATION_ART[station], '', 'station-art'), label.title);
    return el('div', { class: `station station-${station}${count >= 4 ? ' wide' : ''}` }, title, slots);
  }

  private createSeat(seat: number): SeatView {
    const face = img(CUSTOMER_ART[0].normal, '', 'face');
    const bubbleTitle = el('div', { class: 'bubble-title' });
    const bubbleItems = el('div', { class: 'bubble-items' });
    const bubble = el('div', { class: 'bubble' }, bubbleTitle, bubbleItems);
    const patienceFill = el('div', { class: 'patience-fill' });
    const patience = el('div', { class: 'patience' }, patienceFill);
    const person = el('div', { class: 'person' }, face);
    const root = el('button', { class: 'seat empty', 'aria-label': `Cliente ${seat + 1}` }, bubble, person, patience);
    this.tap(root, () => this.game.serve(seat));
    return { root, person, face, bubble, bubbleTitle, bubbleItems, patience, patienceFill, shownId: null, key: '' };
  }

  private get toldoClass(): string {
    const toldo = this.opts.decor.find((d) => d.startsWith('toldo_'));
    return toldo ? ` ${toldo.replace('_', '-')}` : '';
  }

  /** Lo que se compró en Mi carrito y se ve durante el turno. */
  private createDecor(): HTMLElement[] {
    const has = (id: DecorId) => this.opts.decor.includes(id) && DECOR_ART[id];
    const strip = (id: DecorId) => (has(id) ? [el('div', { class: `decor decor-strip decor-${id}`, style: `background-image:url("${DECOR_ART[id]}")` })] : []);
    const piece = (id: DecorId) => (has(id) ? [img(DECOR_ART[id]!, '', `decor decor-${id}`)] : []);
    const radio = this.opts.radio && UPGRADE_ART.radio ? [img(UPGRADE_ART.radio, '', 'decor decor-radio')] : [];
    const sign = has('letrero') ? [el('div', { class: 'decor decor-letrero' }, img(DECOR_ART.letrero!), el('span', {}, 'Completos Mojados'))] : [];
    const photo = has('foto') ? [el('div', { class: 'decor decor-foto' }, img(DECOR_ART.foto!))] : [];
    return [...strip('luces'), ...strip('banderitas'), ...sign, ...piece('macetero'), ...photo, ...radio];
  }

  private createRain(): HTMLElement {
    const rain = el('div', { class: 'rain' });
    for (let i = 0; i < 40; i += 1) {
      const drop = el('i', {
        style: `left:${(i * 37) % 100}%;animation-delay:${((i * 0.137) % 1).toFixed(2)}s;animation-duration:${(0.55 + ((i * 7) % 5) * 0.08).toFixed(2)}s`
      });
      rain.append(drop);
    }
    return rain;
  }

  // ───────────────────────── Loop ─────────────────────────

  start() {
    this.last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      if (!this.paused && !this.finished) {
        this.game.step(dt);
        this.handleEvents();
        this.render();
        if (this.game.finished) {
          this.finished = true;
          window.setTimeout(() => this.opts.onFinish(this.game), 900);
        }
      }
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  setPaused(value: boolean) {
    this.paused = value;
    this.last = performance.now();
    this.root.classList.toggle('paused', value);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.root.remove();
  }

  // ───────────────────────── Eventos ─────────────────────────

  private handleEvents() {
    for (const ev of this.game.drainEvents()) this.onEvent(ev);
  }

  private onEvent(ev: GameEvent) {
    switch (ev.type) {
      case 'cook':
        play(ev.station === 'olla' ? 'splash' : 'sizzle');
        break;
      case 'ready':
        play('ready');
        break;
      case 'ruined':
        play('burnt');
        this.toast(ev.station === 'olla' ? '¡Se reventó una vienesa! Tócala para botarla' : '¡Se aguó un pan! Tócalo para botarlo');
        break;
      case 'pickup':
      case 'topping':
      case 'drink':
      case 'switchTray':
        play('tap');
        break;
      case 'trash':
        play('trash');
        break;
      case 'serve':
        play('tap');
        break;
      case 'paid':
        play('cash');
        this.floatAt(ev.seat, `+${formatCLP(ev.amount)}`, 'money-pop');
        if (ev.combo >= 3) this.floatAt(ev.seat, `Combo ×${ev.combo}`, 'combo-pop');
        if (this.tutorialStep >= 0 && this.opts.tutorial) this.tutorialStep = -1;
        break;
      case 'reject':
        play('error');
        if (ev.seat >= 0) this.floatAt(ev.seat, ev.reason, 'reject-pop');
        break;
      case 'angry':
        play('angry');
        if (ev.seat !== null) this.floatAt(ev.seat, '¡Me voy!', 'reject-pop');
        else this.toast('Un cliente se aburrió en la fila');
        break;
      case 'hint':
        play('error');
        this.toast(ev.message);
        break;
      case 'end':
        play(ev.won ? 'win' : 'lose');
        this.toast(ev.won ? '¡Se acabó el turno! Llegaste a la meta' : 'Se acabó el turno');
        break;
      default:
        break;
    }
  }

  private toast(message: string) {
    this.toastEl.textContent = message;
    this.toastEl.classList.add('show');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('show'), 1600);
  }

  private floatAt(seat: number, text: string, cls: string) {
    const view = this.seatViews[seat];
    if (!view) return;
    const rect = view.root.getBoundingClientRect();
    const hostRect = this.root.getBoundingClientRect();
    const pop = el('div', { class: `pop ${cls}` }, text);
    pop.style.left = `${rect.left - hostRect.left + rect.width / 2}px`;
    pop.style.top = `${rect.top - hostRect.top + rect.height * 0.3}px`;
    this.fxLayer.append(pop);
    window.setTimeout(() => pop.remove(), 1300);
  }

  // ───────────────────────── Render ─────────────────────────

  private render() {
    const g = this.game;
    this.moneyEl.textContent = formatCLP(g.money);
    this.goalFill.style.width = `${Math.min(100, (g.money / (g.level.goal * 1.5)) * 100)}%`;
    this.goalFill.classList.toggle('reached', g.money >= g.level.goal);
    const left = Math.ceil(g.timeLeft);
    this.timeEl.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    this.timeEl.parentElement!.classList.toggle('hurry', left <= 15);
    this.comboEl.textContent = g.combo >= 2 ? `Combo ×${g.combo}` : '';

    const q = g.queue.length;
    this.queueEl.textContent = q > 0 ? `En la fila: ${q}` : '';

    this.renderSeats();
    this.renderStations();
    this.renderTray();
    this.renderTutorial();
  }

  private renderSeats() {
    const g = this.game;
    this.seatViews.forEach((view, s) => {
      let c: Customer | undefined = g.customer(g.seats[s]);
      if (!c) c = g.customers.find((x) => x.state === 'leaving' && x.seat === s);
      if (!c) {
        if (view.shownId !== null) {
          view.root.className = 'seat empty';
          view.shownId = null;
          view.key = '';
        }
        return;
      }

      const key = `${c.id}|${c.state}|${c.mood}|${c.gotCompleto}|${c.gotDrink}`;
      if (key !== view.key) {
        view.key = key;
        if (view.shownId !== c.id) view.shownId = c.id;
        view.root.className = `seat ${c.state}${c.mood ? ' ' + c.mood : ''}`;

        const recipe = RECIPES[c.recipe];
        view.bubbleTitle.textContent = recipe.name;
        view.bubbleItems.replaceChildren(
          el('span', { class: `want completo${c.gotCompleto ? ' done' : ''}` }, ...recipe.toppings.map((t) => img(TOPPING_ART[t], TOPPINGS[t].name))),
          ...(c.drink ? [el('span', { class: `want want-drink${c.gotDrink ? ' done' : ''}` }, img(DRINK_ART[c.drink], DRINKS[c.drink].name))] : [])
        );
      }

      const ratio = c.patience / c.patienceMax;
      view.patienceFill.style.width = `${Math.max(0, ratio * 100)}%`;
      view.patienceFill.style.background = `var(--${ratio > 0.6 ? 'palta' : ratio > 0.3 ? 'mostaza' : 'tomate'})`;
      const impatient = c.state === 'seated' && ratio < 0.35;
      view.root.classList.toggle('impatient', impatient);
      const art = CUSTOMER_ART[c.face % CUSTOMER_ART.length];
      const src = c.mood === 'angry' ? art.enojado : impatient ? art.impaciente : art.normal;
      if (view.face.getAttribute('src') !== src) view.face.src = src;
    });
  }

  private renderStations() {
    const g = this.game;
    for (const station of ['olla', 'vapor'] as const) {
      const { cook, hold } = g.level[station];
      g.slots(station).forEach((slot, i) => {
        const elSlot = this.slotEls[station][i];
        const cls = `slot ${slot.state}`;
        if (elSlot.className !== cls) elSlot.className = cls;
        let progress = 0;
        if (slot.state === 'cooking') progress = slot.t / cook;
        else if (slot.state === 'ready') progress = (slot.t - cook) / hold;
        elSlot.style.setProperty('--p', `${Math.min(1, progress) * 100}%`);
      });
    }
  }

  private renderTray() {
    const g = this.game;
    const tray = g.tray;
    const key = `${JSON.stringify(g.trays)}|${g.activeTray}|${g.heldDrink}`;
    if (key === this.lastTrayKey) return;
    this.lastTrayKey = key;

    this.trayEls.forEach((food, i) => {
      const t = g.trays[i];
      food.parentElement!.classList.toggle('active', i === g.activeTray);
      food.replaceChildren(t ? completoEl(t) : el('div', { class: 'tray-empty' }, this.trayEls.length > 1 ? '+ pan' : 'Saca un pan de la vaporera'));
    });
    const recipe = g.trayRecipe();
    if (!tray) this.trayLabel.textContent = '';
    else this.trayLabel.textContent = recipe ? `Listo: ${RECIPES[recipe].name}` : tray.vienesa ? (tray.toppings.length ? tray.toppings.map((t) => TOPPINGS[t].name).join(' + ') : 'Agrega ingredientes') : 'Falta la vienesa';
    this.trayLabel.classList.toggle('ok', !!recipe);
    this.heldDrinkEl.replaceChildren(...(g.heldDrink ? [img(DRINK_ART[g.heldDrink], DRINKS[g.heldDrink].name)] : []));
    this.heldDrinkEl.hidden = !g.heldDrink;
  }

  private renderTutorial() {
    if (!this.opts.tutorial || this.tutorialStep < 0) {
      this.tutorialEl.hidden = true;
      return;
    }
    const g = this.game;
    const seated = g.seats.map((id) => g.customer(id)).find((c) => c && c.state === 'seated');
    let text: string;
    const anyCooking = (station: StationId) => g.slots(station).some((x) => x.state !== 'empty');
    if (!seated) text = 'Mientras llega tu primer cliente, toca la vaporera para poner un pan y la olla para poner una vienesa';
    else if (!g.tray && !anyCooking('vapor')) text = '1. Toca la vaporera para calentar un pan al vapor';
    else if (!g.tray?.vienesa && !anyCooking('olla')) text = '2. Toca la olla para echar una vienesa al agua';
    else if (!g.tray) text = g.vapor.some((x) => x.state === 'ready') ? '3. ¡El pan está blandito! Tócalo para pasarlo a la tabla' : '3. Espera a que el pan se caliente…';
    else if (!g.tray.vienesa) text = g.olla.some((x) => x.state === 'ready') ? '4. ¡La vienesa está caliente! Tócala para ponerla en el pan' : '4. Espera a que la vienesa se caliente…';
    else if (g.trayRecipe() !== seated.recipe) text = `5. Agrega ${RECIPES[seated.recipe].toppings.map((t) => TOPPINGS[t].name.toLowerCase()).join(', ')}`;
    else text = '6. ¡Listo! Toca al cliente para entregarle su completo';
    this.tutorialEl.hidden = false;
    if (this.tutorialEl.textContent !== text) this.tutorialEl.textContent = text;
  }
}
