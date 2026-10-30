// Lógica pura del juego (sin DOM), para poder testearla y simularla.

import {
  DRINKS,
  RECIPES,
  type DrinkId,
  type LevelConfig,
  type RecipeId,
  type ToppingId
} from './data';

export type GrillState = 'empty' | 'cooking' | 'ready' | 'burnt';

export interface GrillSlot {
  state: GrillState;
  /** Segundos desde que se puso la vienesa. */
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
  | { type: 'grill'; slot: number }
  | { type: 'ready'; slot: number }
  | { type: 'burnt'; slot: number }
  | { type: 'pickup'; slot: number }
  | { type: 'pan' }
  | { type: 'topping'; topping: ToppingId }
  | { type: 'drink'; drink: DrinkId }
  | { type: 'trash' }
  | { type: 'serve'; customer: number; seat: number }
  | { type: 'paid'; customer: number; seat: number; amount: number; tip: number; combo: number }
  | { type: 'reject'; customer: number; seat: number; reason: string }
  | { type: 'angry'; customer: number; seat: number | null }
  | { type: 'hint'; message: string }
  | { type: 'end'; won: boolean };

export interface Stats {
  served: number;
  lost: number;
  burnt: number;
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

export class Game {
  readonly level: LevelConfig;
  time = 0;
  money = 0;
  combo = 0;
  finished = false;
  won = false;

  grill: GrillSlot[];
  tray: Tray | null = null;
  heldDrink: DrinkId | null = null;
  customers: Customer[] = [];
  seats: (number | null)[];
  stats: Stats = { served: 0, lost: 0, burnt: 0, tips: 0, maxCombo: 0 };
  events: GameEvent[] = [];

  private readonly rng: () => number;
  private nextArrival: number;
  private nextId = 1;
  private seatTimers: number[];

  constructor(level: LevelConfig, seed = Date.now()) {
    this.level = level;
    this.rng = createRng(seed);
    this.grill = Array.from({ length: level.grillSlots }, () => ({ state: 'empty' as GrillState, t: 0 }));
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

  // ───────────────────────── Simulación ─────────────────────────

  step(dt: number): void {
    if (this.finished) return;
    this.time += dt;

    this.updateArrivals(dt);
    this.updateGrill(dt);
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

  private updateGrill(dt: number) {
    this.grill.forEach((slot, i) => {
      if (slot.state === 'empty' || slot.state === 'burnt') return;
      slot.t += dt;
      if (slot.state === 'cooking' && slot.t >= this.level.cookTime) {
        slot.state = 'ready';
        this.events.push({ type: 'ready', slot: i });
      }
      if (slot.state === 'ready' && slot.t >= this.level.cookTime + this.level.burnTime) {
        slot.state = 'burnt';
        this.stats.burnt += 1;
        this.events.push({ type: 'burnt', slot: i });
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

  tapGrill(slotIndex: number): void {
    if (this.finished) return;
    const slot = this.grill[slotIndex];
    if (!slot) return;
    switch (slot.state) {
      case 'empty':
        slot.state = 'cooking';
        slot.t = 0;
        this.events.push({ type: 'grill', slot: slotIndex });
        break;
      case 'cooking':
        this.hint('Todavía está cruda, espera un poco');
        break;
      case 'ready':
        if (!this.tray) {
          this.hint('Primero pon un pan');
        } else if (this.tray.vienesa) {
          this.hint('Este pan ya tiene vienesa');
        } else {
          this.tray.vienesa = true;
          slot.state = 'empty';
          slot.t = 0;
          this.events.push({ type: 'pickup', slot: slotIndex });
        }
        break;
      case 'burnt':
        slot.state = 'empty';
        slot.t = 0;
        this.events.push({ type: 'trash' });
        break;
    }
  }

  tapPan(): void {
    if (this.finished) return;
    if (this.tray) {
      this.hint('Ya tienes un pan en la tabla');
      return;
    }
    this.tray = { vienesa: false, toppings: [] };
    this.events.push({ type: 'pan' });
  }

  tapTopping(topping: ToppingId): void {
    if (this.finished) return;
    if (!this.tray) {
      this.hint('Primero pon un pan');
      return;
    }
    if (!this.tray.vienesa) {
      this.hint('Falta la vienesa de la plancha');
      return;
    }
    if (this.tray.toppings.includes(topping)) {
      this.hint('Ya le pusiste eso');
      return;
    }
    this.tray.toppings.push(topping);
    this.events.push({ type: 'topping', topping });
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
    const tray = this.tray;
    if (!tray || !tray.vienesa) return null;
    for (const recipe of Object.values(RECIPES)) {
      if (
        recipe.toppings.length === tray.toppings.length &&
        recipe.toppings.every((t) => tray.toppings.includes(t))
      ) {
        return recipe.id;
      }
    }
    return null;
  }

  serve(seatIndex: number): void {
    if (this.finished) return;
    const c = this.customer(this.seats[seatIndex] ?? null);
    if (!c || c.state !== 'seated') return;

    let delivered = false;

    if (this.tray && !c.gotCompleto) {
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
    const tip = Math.round((base * tipRate) / 50) * 50 + comboBonus;
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
