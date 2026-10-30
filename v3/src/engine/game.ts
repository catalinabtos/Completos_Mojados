// Lógica pura del juego (sin DOM), para poder testearla y simularla.

import {
  DRINKS,
  RECIPES,
  type DrinkId,
  type LevelConfig,
  type RecipeId,
  type ToppingId
} from './data';
import type { GameOptions } from './upgrades';

/** Olla con agua para las vienesas y vaporera (pan sobre toalla) para los panes. */
export type StationId = 'olla' | 'vapor';
export type SlotState = 'empty' | 'cooking' | 'ready' | 'ruined';

export interface Slot {
  state: SlotState;
  /** Segundos desde que se puso la vienesa o el pan. */
  t: number;
}

export interface Tray {
  vienesa: boolean;
  toppings: ToppingId[];
}

export type CustomerState = 'queued' | 'seated' | 'leaving';

export interface Customer {
  id: number;
  face: number;
  recipe: RecipeId;
  drink: DrinkId | null;
  gotCompleto: boolean;
  gotDrink: boolean;
  patience: number;
  patienceMax: number;
  state: CustomerState;
  seat: number | null;
  mood: 'happy' | 'angry' | null;
  /** Tiempo restante de la animación de salida. */
  leaveTimer: number;
}

export type GameEvent =
  | { type: 'arrive'; customer: number }
  | { type: 'seat'; customer: number; seat: number }
  | { type: 'cook'; station: StationId; slot: number }
  | { type: 'ready'; station: StationId; slot: number }
  | { type: 'ruined'; station: StationId; slot: number }
  | { type: 'pickup'; station: StationId; slot: number }
  | { type: 'topping'; topping: ToppingId }
  | { type: 'drink'; drink: DrinkId }
  | { type: 'trash' }
  | { type: 'shelf' }
  | { type: 'serve'; customer: number; seat: number }
  | { type: 'paid'; customer: number; seat: number; amount: number; tip: number; combo: number }
  | { type: 'reject'; customer: number; seat: number; reason: string }
  | { type: 'angry'; customer: number; seat: number | null }
  | { type: 'hint'; message: string }
  | { type: 'end'; won: boolean };

export interface Stats {
  served: number;
  lost: number;
  /** Vienesas reventadas + panes aguados. */
  ruined: number;
  tips: number;
  maxCombo: number;
}

const SEAT_DELAY = 0.6;
const LEAVE_TIME = 0.9;
const QUEUE_PATIENCE_FACTOR = 0.5;
const MISTAKE_PATIENCE_PENALTY = 0.2;

/** Generador pseudoaleatorio determinista (mulberry32). */
export function createRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function emptySlots(n: number): Slot[] {
  return Array.from({ length: n }, () => ({ state: 'empty' as SlotState, t: 0 }));
}

/** Receta que coincide exactamente con un completo armado, si existe. */
export function recipeOf(tray: Tray | null): RecipeId | null {
  if (!tray || !tray.vienesa) return null;
  for (const recipe of Object.values(RECIPES)) {
    if (recipe.toppings.length === tray.toppings.length && recipe.toppings.every((t) => tray.toppings.includes(t))) {
      return recipe.id;
    }
  }
  return null;
}

export class Game {
  readonly level: LevelConfig;
  time = 0;
  money = 0;
  combo = 0;
  finished = false;
  won = false;

  olla: Slot[];
  vapor: Slot[];
  tray: Tray | null = null;
  /** Completo guardado en la repisa (mejora del carrito). */
  shelf: Tray | null = null;
  readonly options: GameOptions;
  heldDrink: DrinkId | null = null;
  customers: Customer[] = [];
  seats: (number | null)[];
  stats: Stats = { served: 0, lost: 0, ruined: 0, tips: 0, maxCombo: 0 };
  events: GameEvent[] = [];

  private readonly rng: () => number;
  private nextArrival: number;
  private nextId = 1;
  private seatTimers: number[];

  constructor(level: LevelConfig, seed = Date.now(), options: Partial<GameOptions> = {}) {
    this.level = level;
    this.options = { shelf: false, tipBonus: 0, ...options };
    this.rng = createRng(seed);
    this.olla = emptySlots(level.olla.slots);
    this.vapor = emptySlots(level.vapor.slots);
    this.seats = Array.from({ length: level.seats }, () => null);
    this.seatTimers = Array.from({ length: level.seats }, () => 0);
    this.nextArrival = 1.2;
  }

  get timeLeft(): number {
    return Math.max(0, this.level.duration - this.time);
  }

  customer(id: number | null): Customer | undefined {
    if (id === null) return undefined;
    return this.customers.find((c) => c.id === id);
  }

  get queue(): Customer[] {
    return this.customers.filter((c) => c.state === 'queued');
  }

  slots(station: StationId): Slot[] {
    return station === 'olla' ? this.olla : this.vapor;
  }

  // ───────────────────────── Simulación ─────────────────────────

  step(dt: number): void {
    if (this.finished) return;
    this.time += dt;

    this.updateArrivals(dt);
    this.updateStation('olla', dt);
    this.updateStation('vapor', dt);
    this.updateCustomers(dt);
    this.seatFromQueue(dt);

    if (this.time >= this.level.duration) {
      this.finished = true;
      this.won = this.money >= this.level.goal;
      this.events.push({ type: 'end', won: this.won });
    }
  }

  private updateArrivals(dt: number) {
    this.nextArrival -= dt;
    // Los últimos segundos no llegan clientes nuevos: no alcanzarían a ser atendidos.
    if (this.nextArrival > 0 || this.timeLeft < 8) return;

    const [min, max] = this.level.arrival;
    this.nextArrival = min + this.rng() * (max - min);

    if (this.queue.length >= this.level.queueSize) {
      // Fila llena: el cliente sigue de largo.
      this.stats.lost += 1;
      this.events.push({ type: 'hint', message: 'La fila está llena, un cliente se fue' });
      return;
    }

    const recipe = this.pickRecipe();
    const drink =
      this.level.drinks.length > 0 && this.rng() < this.level.drinkChance
        ? this.level.drinks[Math.floor(this.rng() * this.level.drinks.length)]
        : null;
    const patienceMax = this.level.patience * (0.9 + this.rng() * 0.25) + (drink ? 4 : 0);

    const customer: Customer = {
      id: this.nextId++,
      face: Math.floor(this.rng() * 1000),
      recipe,
      drink,
      gotCompleto: false,
      gotDrink: drink === null,
      patience: patienceMax,
      patienceMax,
      state: 'queued',
      seat: null,
      mood: null,
      leaveTimer: 0
    };
    this.customers.push(customer);
    this.events.push({ type: 'arrive', customer: customer.id });
  }

  private pickRecipe(): RecipeId {
    const entries = Object.entries(this.level.recipes) as [RecipeId, number][];
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let roll = this.rng() * total;
    for (const [id, w] of entries) {
      roll -= w;
      if (roll <= 0) return id;
    }
    return entries[entries.length - 1][0];
  }

  private updateStation(station: StationId, dt: number) {
    const { cook, hold } = this.level[station];
    this.slots(station).forEach((slot, i) => {
      if (slot.state === 'empty' || slot.state === 'ruined') return;
      slot.t += dt;
      if (slot.state === 'cooking' && slot.t >= cook) {
        slot.state = 'ready';
        this.events.push({ type: 'ready', station, slot: i });
      }
      if (slot.state === 'ready' && slot.t >= cook + hold) {
        slot.state = 'ruined';
        this.stats.ruined += 1;
        this.events.push({ type: 'ruined', station, slot: i });
      }
    });
  }

  private updateCustomers(dt: number) {
    for (const c of this.customers) {
      if (c.state === 'leaving') {
        c.leaveTimer -= dt;
        continue;
      }
      const drain = c.state === 'queued' ? QUEUE_PATIENCE_FACTOR : 1;
      c.patience -= dt * drain;
      if (c.patience <= 0) {
        c.patience = 0;
        this.stats.lost += 1;
        this.combo = 0;
        this.events.push({ type: 'angry', customer: c.id, seat: c.seat });
        this.leave(c, 'angry');
      }
    }
    this.customers = this.customers.filter((c) => c.state !== 'leaving' || c.leaveTimer > 0);
  }

  private seatFromQueue(dt: number) {
    for (let s = 0; s < this.seats.length; s += 1) {
      if (this.seats[s] !== null) continue;
      if (this.seatTimers[s] > 0) {
        this.seatTimers[s] -= dt;
        continue;
      }
      const next = this.queue[0];
      if (!next) return;
      next.state = 'seated';
      next.seat = s;
      // Al sentarse se renueva parte de la paciencia.
      next.patience = Math.min(next.patienceMax, next.patience + next.patienceMax * 0.35);
      this.seats[s] = next.id;
      this.events.push({ type: 'seat', customer: next.id, seat: s });
    }
  }

  private leave(c: Customer, mood: 'happy' | 'angry') {
    c.state = 'leaving';
    c.mood = mood;
    c.leaveTimer = LEAVE_TIME;
    if (c.seat !== null) {
      this.seats[c.seat] = null;
      this.seatTimers[c.seat] = SEAT_DELAY;
    }
  }

  // ───────────────────────── Acciones del jugador ─────────────────────────

  /** Toque en un puesto de la olla (vienesas) o de la vaporera (panes). */
  tapSlot(station: StationId, index: number): void {
    if (this.finished) return;
    const slot = this.slots(station)[index];
    if (!slot) return;
    switch (slot.state) {
      case 'empty':
        slot.state = 'cooking';
        slot.t = 0;
        this.events.push({ type: 'cook', station, slot: index });
        break;
      case 'cooking':
        this.hint(station === 'olla' ? 'La vienesa todavía está fría' : 'El pan todavía no está blandito');
        break;
      case 'ready':
        if (station === 'vapor') {
          if (this.tray) {
            this.hint('Ya tienes un pan en la tabla');
            return;
          }
          this.tray = { vienesa: false, toppings: [] };
        } else {
          if (!this.tray) {
            this.hint('Primero saca un pan de la vaporera');
            return;
          }
          if (this.tray.vienesa) {
            this.hint('Este pan ya tiene vienesa');
            return;
          }
          this.tray.vienesa = true;
        }
        slot.state = 'empty';
        slot.t = 0;
        this.events.push({ type: 'pickup', station, slot: index });
        break;
      case 'ruined':
        slot.state = 'empty';
        slot.t = 0;
        this.events.push({ type: 'trash' });
        break;
    }
  }

  tapTopping(topping: ToppingId): void {
    if (this.finished) return;
    if (!this.tray) {
      this.hint('Primero saca un pan de la vaporera');
      return;
    }
    if (!this.tray.vienesa) {
      this.hint('Falta la vienesa de la olla');
      return;
    }
    if (this.tray.toppings.includes(topping)) {
      this.hint('Ya le pusiste eso');
      return;
    }
    this.tray.toppings.push(topping);
    this.events.push({ type: 'topping', topping });
  }

  /** Toque en la repisa: guarda el completo de la tabla, lo devuelve o los intercambia. */
  tapShelf(): void {
    if (this.finished || !this.options.shelf) return;
    if (!this.tray && !this.shelf) {
      this.hint('Arma un completo y guárdalo en la repisa');
      return;
    }
    [this.tray, this.shelf] = [this.shelf, this.tray];
    this.events.push({ type: 'shelf' });
  }

  tapDrink(drink: DrinkId): void {
    if (this.finished) return;
    this.heldDrink = drink;
    this.events.push({ type: 'drink', drink });
  }

  trashTray(): void {
    if (this.finished) return;
    if (!this.tray && !this.heldDrink) return;
    this.tray = null;
    this.heldDrink = null;
    this.events.push({ type: 'trash' });
  }

  /** Receta que coincide exactamente con lo que hay en la tabla, si existe. */
  trayRecipe(): RecipeId | null {
    return recipeOf(this.tray);
  }

  shelfRecipe(): RecipeId | null {
    return recipeOf(this.shelf);
  }

  serve(seatIndex: number): void {
    if (this.finished) return;
    const c = this.customer(this.seats[seatIndex] ?? null);
    if (!c || c.state !== 'seated') return;

    let delivered = false;

    // Si el completo de la tabla no es el que pidió, se le entrega el de la repisa cuando sí coincide.
    const fromShelf = !c.gotCompleto && this.shelf && recipeOf(this.shelf) === c.recipe && recipeOf(this.tray) !== c.recipe;
    if (fromShelf) {
      c.gotCompleto = true;
      this.shelf = null;
      delivered = true;
    } else if (this.tray && !c.gotCompleto) {
      if (!this.tray.vienesa) {
        this.reject(c, 'Le falta la vienesa');
        return;
      }
      if (this.trayRecipe() !== c.recipe) {
        this.reject(c, `¡Pedí un ${RECIPES[c.recipe].name}!`);
        return;
      }
      c.gotCompleto = true;
      this.tray = null;
      delivered = true;
    }

    if (this.heldDrink && !c.gotDrink) {
      if (this.heldDrink !== c.drink) {
        if (!delivered) {
          this.reject(c, c.drink ? `Quería ${DRINKS[c.drink].name.toLowerCase()}` : 'No pedí bebida');
          return;
        }
      } else {
        c.gotDrink = true;
        this.heldDrink = null;
        delivered = true;
      }
    }

    if (!delivered) {
      this.hint(this.tray || this.heldDrink ? 'Eso no es para este cliente' : 'Arma su pedido primero');
      return;
    }

    this.events.push({ type: 'serve', customer: c.id, seat: seatIndex });

    if (c.gotCompleto && c.gotDrink) {
      this.pay(c, seatIndex);
    }
  }

  private pay(c: Customer, seatIndex: number) {
    const base = RECIPES[c.recipe].price + (c.drink ? DRINKS[c.drink].price : 0);
    const ratio = c.patience / c.patienceMax;
    const tipRate = ratio > 0.66 ? 0.3 : ratio > 0.33 ? 0.15 : 0.05;
    this.combo += 1;
    const comboBonus = Math.min(this.combo - 1, 5) * 200;
    const tip = Math.round((base * tipRate * (1 + this.options.tipBonus)) / 50) * 50 + comboBonus;
    const amount = base + tip;
    this.money += amount;
    this.stats.served += 1;
    this.stats.tips += tip;
    this.stats.maxCombo = Math.max(this.stats.maxCombo, this.combo);
    this.events.push({ type: 'paid', customer: c.id, seat: seatIndex, amount, tip, combo: this.combo });
    this.leave(c, 'happy');
  }

  private reject(c: Customer, reason: string) {
    c.patience = Math.max(0.5, c.patience - c.patienceMax * MISTAKE_PATIENCE_PENALTY);
    this.combo = 0;
    this.events.push({ type: 'reject', customer: c.id, seat: c.seat ?? -1, reason });
  }

  private hint(message: string) {
    this.events.push({ type: 'hint', message });
  }

  drainEvents(): GameEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }
}
