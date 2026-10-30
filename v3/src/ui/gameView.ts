// Pantalla de juego: dibuja el estado del motor en el DOM y traduce toques en acciones.

import { DRINKS, RECIPES, TOPPINGS, formatCLP, type LevelConfig } from '../engine/data';
import { Game, type Customer, type GameEvent } from '../engine/game';
import { play } from './audio';
import { el } from './dom';

const FACES = ['👩', '👨', '👵', '👴', '🧑‍🦱', '👩‍🦰', '🧔', '👱‍♀️', '🧑‍🎓', '👷', '👩‍🔧', '🧑‍🍳', '👨‍🦳', '👧'];
const RAIN_EXTRAS = ['☂️', '🧣', '⚽'];
const SCENERY: Record<number, string[]> = {
  1: ['🌳', '⛪', '🌳', '⛲', '🌳'],
  2: ['🏪', '🍎', '🥕', '🌽', '🏪'],
  3: ['🚩', '🏟️', '🚩', '🏟️', '🚩']
};

export interface GameViewOptions {
  level: LevelConfig;
  tutorial: boolean;
  onPause: () => void;
  onRecipes: () => void;
  onFinish: (game: Game) => void;
}

interface SeatView {
  root: HTMLElement;
  person: HTMLElement;
  face: HTMLElement;
  extra: HTMLElement;
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
  private readonly grillEls: HTMLElement[] = [];
  private readonly trayEl: HTMLElement;
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
    this.game = new Game(level, seed);

    // ── HUD
    const pauseBtn = el('button', { class: 'icon-btn', 'aria-label': 'Pausa' }, '⏸');
    pauseBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      opts.onPause();
    });
    this.moneyEl = el('span', { class: 'money' }, formatCLP(0));
    this.goalFill = el('div', { class: 'goal-fill' });
    this.timeEl = el('span', { class: 'time' }, '');
    this.comboEl = el('span', { class: 'combo' }, '');
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
      el('div', { class: 'hud-time' }, '⏱ ', this.timeEl)
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
      { class: `street level-${level.id}` },
      el('div', { class: 'awning' }),
      el('div', { class: 'scenery' }, ...(SCENERY[level.id] ?? []).map((icon) => el('span', {}, icon))),
      el('div', { class: 'place' }, `📍 ${level.name}`),
      this.comboEl,
      this.queueEl,
      seatsEl,
      el('div', { class: 'counter' }, el('span', {}, 'COMPLETOS MOJADOS · TALCA'))
    );
    if (level.rain) street.append(this.createRain());

    // ── Cocina
    const grill = el('div', { class: 'grill' }, el('div', { class: 'station-title' }, 'Plancha'));
    const slots = el('div', { class: 'grill-slots' });
    for (let i = 0; i < level.grillSlots; i += 1) {
      const slot = el('button', { class: 'grill-slot empty', 'aria-label': `Plancha ${i + 1}` },
        el('div', { class: 'vienesa' }),
        el('div', { class: 'steam' }, '♨️'),
        el('div', { class: 'cook-ring' })
      );
      this.tap(slot, () => this.game.tapGrill(i));
      slots.append(slot);
      this.grillEls.push(slot);
    }
    grill.append(slots);

    this.trayEl = el('div', { class: 'tray-food' });
    this.trayLabel = el('div', { class: 'tray-label' }, '');
    this.heldDrinkEl = el('div', { class: 'held-drink' });
    const board = el('div', { class: 'board' }, el('div', { class: 'station-title' }, 'Tabla'), this.trayEl, this.trayLabel, this.heldDrinkEl);

    const panBtn = el('button', { class: 'pan-btn' }, el('span', { class: 'big-icon' }, '🍞'), 'Pan');
    this.tap(panBtn, () => this.game.tapPan());
    const trashBtn = el('button', { class: 'trash-btn' }, el('span', { class: 'big-icon' }, '🗑️'), 'Botar');
    this.tap(trashBtn, () => this.game.trashTray());
    const recipesBtn = el('button', { class: 'recipes-btn' }, el('span', { class: 'big-icon' }, '📖'), 'Recetas');
    recipesBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      opts.onRecipes();
    });
    const side = el('div', { class: 'side-buttons' }, panBtn, trashBtn, recipesBtn);

    const toppings = el('div', { class: 'toppings' });
    for (const id of level.toppings) {
      const t = TOPPINGS[id];
      const btn = el('button', { class: 'topping', style: `--c:${t.color}` }, el('span', { class: 'big-icon' }, t.icon), t.name);
      btn.dataset.topping = id;
      this.tap(btn, () => this.game.tapTopping(id));
      toppings.append(btn);
    }

    const kitchenChildren: HTMLElement[] = [el('div', { class: 'kitchen-top' }, grill, board, side), toppings];
    if (level.drinks.length > 0) {
      const cooler = el('div', { class: 'cooler' }, el('div', { class: 'station-title' }, 'Bebidas'));
      for (const id of level.drinks) {
        const d = DRINKS[id];
        const btn = el('button', { class: 'drink' }, el('span', { class: 'big-icon' }, d.icon), d.name);
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

  private createSeat(seat: number): SeatView {
    const face = el('div', { class: 'face' });
    const extra = el('div', { class: 'extra' });
    const bubbleTitle = el('div', { class: 'bubble-title' });
    const bubbleItems = el('div', { class: 'bubble-items' });
    const bubble = el('div', { class: 'bubble' }, bubbleTitle, bubbleItems);
    const patienceFill = el('div', { class: 'patience-fill' });
    const patience = el('div', { class: 'patience' }, patienceFill);
    const person = el('div', { class: 'person' }, face, extra);
    const root = el('button', { class: 'seat empty', 'aria-label': `Cliente ${seat + 1}` }, bubble, person, patience, el('div', { class: 'stool' }));
    this.tap(root, () => this.game.serve(seat));
    return { root, person, face, extra, bubble, bubbleTitle, bubbleItems, patience, patienceFill, shownId: null, key: '' };
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
      case 'grill':
        play('sizzle');
        break;
      case 'ready':
        play('ready');
        break;
      case 'burnt':
        play('burnt');
        this.toast('¡Se quemó una vienesa! Tócala para botarla');
        break;
      case 'pickup':
      case 'pan':
      case 'topping':
      case 'drink':
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
        if (ev.seat !== null) this.floatAt(ev.seat, '😤 ¡Me voy!', 'reject-pop');
        else this.toast('Un cliente se aburrió en la fila');
        break;
      case 'hint':
        play('error');
        this.toast(ev.message);
        break;
      case 'end':
        play(ev.won ? 'win' : 'lose');
        this.toast(ev.won ? '¡Se acabó el turno! 🎉' : 'Se acabó el turno');
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
    this.comboEl.textContent = g.combo >= 2 ? `🔥 Combo ×${g.combo}` : '';

    const q = g.queue.length;
    this.queueEl.textContent = q > 0 ? `En la fila: ${'🧍'.repeat(q)}` : '';

    this.renderSeats();
    this.renderGrill();
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
        if (view.shownId !== c.id) {
          view.shownId = c.id;
          view.face.textContent = FACES[c.face % FACES.length];
          view.extra.textContent = g.level.rain ? RAIN_EXTRAS[c.face % RAIN_EXTRAS.length] : '';
        }
        view.root.className = `seat ${c.state}${c.mood ? ' ' + c.mood : ''}`;
        if (c.mood === 'angry') view.face.textContent = '😠';
        if (c.mood === 'happy') view.face.textContent = '😋';

        const recipe = RECIPES[c.recipe];
        view.bubbleTitle.textContent = recipe.name;
        view.bubbleItems.replaceChildren(
          el('span', { class: `want completo${c.gotCompleto ? ' done' : ''}` }, '🌭', ...recipe.toppings.map((t) => el('small', {}, TOPPINGS[t].icon))),
          ...(c.drink ? [el('span', { class: `want drink${c.gotDrink ? ' done' : ''}` }, DRINKS[c.drink].icon)] : [])
        );
      }

      const ratio = c.patience / c.patienceMax;
      view.patienceFill.style.width = `${Math.max(0, ratio * 100)}%`;
      view.patienceFill.style.background = ratio > 0.6 ? '#3fb950' : ratio > 0.3 ? '#f2a516' : '#e5484d';
      view.root.classList.toggle('impatient', c.state === 'seated' && ratio < 0.3);
    });
  }

  private renderGrill() {
    const g = this.game;
    g.grill.forEach((slot, i) => {
      const elSlot = this.grillEls[i];
      const cls = `grill-slot ${slot.state}`;
      if (elSlot.className !== cls) elSlot.className = cls;
      let progress = 0;
      if (slot.state === 'cooking') progress = slot.t / g.level.cookTime;
      else if (slot.state === 'ready') progress = (slot.t - g.level.cookTime) / g.level.burnTime;
      elSlot.style.setProperty('--p', `${Math.min(1, progress) * 360}deg`);
    });
  }

  private renderTray() {
    const g = this.game;
    const tray = g.tray;
    const key = tray ? `${tray.vienesa}|${tray.toppings.join(',')}|${g.heldDrink}` : `none|${g.heldDrink}`;
    if (key === this.lastTrayKey) return;
    this.lastTrayKey = key;

    if (!tray) {
      this.trayEl.replaceChildren(el('div', { class: 'tray-empty' }, 'Toca 🍞 Pan'));
      this.trayLabel.textContent = '';
    } else {
      const layers = tray.toppings.map((t) => el('div', { class: `layer layer-${t}`, style: `--c:${TOPPINGS[t].color}` }));
      this.trayEl.replaceChildren(
        el('div', { class: 'hotdog' }, el('div', { class: 'bun-back' }), tray.vienesa ? el('div', { class: 'sausage' }) : el('div', {}), el('div', { class: 'layers' }, ...layers), el('div', { class: 'bun-front' }))
      );
      const recipe = g.trayRecipe();
      this.trayLabel.textContent = recipe ? `✓ ${RECIPES[recipe].name}` : tray.vienesa ? tray.toppings.map((t) => TOPPINGS[t].icon).join(' ') || 'Agrega ingredientes' : 'Falta vienesa';
      this.trayLabel.classList.toggle('ok', !!recipe);
    }
    this.heldDrinkEl.textContent = g.heldDrink ? DRINKS[g.heldDrink].icon : '';
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
    if (!seated) text = 'Espera a tu primer cliente… mientras, toca la plancha 🔥 para poner una vienesa';
    else if (g.grill.every((s) => s.state === 'empty') && !g.tray?.vienesa) text = '1. Toca la plancha 🔥 para cocinar una vienesa';
    else if (!g.tray) text = '2. Toca 🍞 Pan para poner un pan en la tabla';
    else if (!g.tray.vienesa) text = g.grill.some((s) => s.state === 'ready') ? '3. ¡La vienesa está dorada! Tócala para ponerla en el pan' : '3. Espera a que la vienesa se dore…';
    else if (!g.trayRecipe() || g.trayRecipe() !== seated.recipe) text = `4. Agrega los ingredientes del ${RECIPES[seated.recipe].name}: ${RECIPES[seated.recipe].toppings.map((t) => TOPPINGS[t].name).join(', ')}`;
    else text = '5. ¡Listo! Toca al cliente para entregarle su completo';
    this.tutorialEl.hidden = false;
    if (this.tutorialEl.textContent !== text) this.tutorialEl.textContent = text;
  }
}
