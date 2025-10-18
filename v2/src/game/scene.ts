import { Container, Graphics, Text } from 'pixi.js';
import { createRng, pickWeighted } from '../core/rng';
import type { Store } from '../core/store';
import type { CustomerDTO, LevelConfig, RecipesData } from '../core/types';
import { createEmptyOrder } from './order';
import { advanceCombo, calculateScore, evaluateMatch } from './scoring';
import { Customer } from './customer';

interface TableSlot {
  occupied: boolean;
  position: { x: number; y: number };
}

export interface SceneOptions {
  store: Store;
  recipes: RecipesData;
  level: LevelConfig;
  mount: Container;
  overlay: Container;
}

interface SpawnState {
  spawned: number;
  nextSpawn: number;
}

const QUEUE_Y = 360;
const TABLE_Y = 220;
const LEFT_MARGIN = 160;
const QUEUE_SPACING = 110;
const TABLE_SPACING = 180;

export class GameScene {
  private customers: Customer[] = [];
  private readonly tables: TableSlot[] = [];
  private readonly spawn: SpawnState = { spawned: 0, nextSpawn: 0 };
  private readonly rng = createRng();
  private elapsed = 0;
  private readonly store: Store;
  private readonly recipes: RecipesData;
  private readonly level: LevelConfig;
  private readonly mount: Container;
  private readonly overlay: Container;
  private readonly feedbackText: Text;
  private endShown = false;

  constructor(options: SceneOptions) {
    this.store = options.store;
    this.recipes = options.recipes;
    this.level = options.level;
    this.mount = options.mount;
    this.overlay = options.overlay;

    this.setupTables();

    this.feedbackText = new Text({
      text: '',
      style: {
        fill: 0xffffff,
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: '600',
        align: 'center'
      }
    });
    this.feedbackText.anchor.set(0.5);
    this.feedbackText.alpha = 0;
    this.overlay.addChild(this.feedbackText);
  }

  start() {
    this.spawnCustomer();
  }

  update(delta: number) {
    const dt = delta / 60;
    this.elapsed += dt;
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    this.feedbackText.x = width / 2;
    this.feedbackText.y = 60;

    this.spawn.nextSpawn -= dt;
    if (this.spawn.spawned < this.level.customers && this.spawn.nextSpawn <= 0) {
      this.spawnCustomer();
    }

    this.updateCustomers(dt);
    this.updateStoreCustomers();
    this.checkGoal();
  }

  private setupTables() {
    for (let i = 0; i < this.level.tables; i += 1) {
      const x = LEFT_MARGIN + TABLE_SPACING * i;
      const y = TABLE_Y;
      const table = new Graphics();
      table.roundRect(-60, -20, 120, 40, 12);
      table.fill({ color: 0xffe0a0 });
      table.stroke({ color: 0xb3813a, width: 4 });
      table.x = x;
      table.y = y;
      this.mount.addChild(table);
      this.tables.push({ occupied: false, position: { x, y: y - 20 } });
    }
  }

  private spawnCustomer() {
    const orderKey = this.pickOrderKey();
    const toppings = this.recipes.completos[orderKey] ?? [];
    const beverageEnabled = this.level.beverages_enabled;
    const wantsBeverage = beverageEnabled && this.rng() < 0.35;
    const beverage = wantsBeverage ? this.pickBeverage() : undefined;

    const patience = this.level.timers.patience;

    const dto: CustomerDTO = {
      id: `customer-${Date.now()}-${Math.floor(this.rng() * 10000)}`,
      state: 'Arriving',
      tableIndex: null,
      patienceMax: patience,
      patience,
      personality: 'normal',
      expected: {
        ingredients: toppings,
        beverage,
        label: this.recipes.ui_labels[orderKey] ?? orderKey
      }
    };

    const customer = new Customer(dto, dto.expected.label ?? orderKey, (target) => this.handleDelivery(target));
    customer.setTarget(LEFT_MARGIN - 140, QUEUE_Y);
    this.mount.addChild(customer.container);

    const queueIndex = this.customers.length;
    customer.setQueuePosition(queueIndex, LEFT_MARGIN - 140, QUEUE_SPACING, QUEUE_Y);
    this.customers.push(customer);

    this.spawn.spawned += 1;
    const lerp = 7 - (this.spawn.spawned / this.level.customers) * 2;
    this.spawn.nextSpawn = Math.max(5, lerp);

    this.store.updateSlice('level', (slice) => ({
      ...slice,
      customersSpawned: slice.customersSpawned + 1,
      nextSpawn: this.spawn.nextSpawn
    }));
  }

  private pickOrderKey(): string {
    const entries = Object.entries(this.level.order_mix);
    return pickWeighted(entries, this.rng);
  }

  private pickBeverage(): string {
    const entries = this.recipes.bebidas.map((bev) => [bev, 1] as [string, number]);
    return pickWeighted(entries, this.rng);
  }

  private updateCustomers(dt: number) {
    for (const customer of this.customers) {
      customer.update(dt);
    }

    this.assignTables();
    this.handleDepartures();
  }

  private assignTables() {
    for (const customer of this.customers) {
      if (customer.state === 'Waiting') {
        const tableIndex = this.tables.findIndex((table) => !table.occupied);
        if (tableIndex >= 0) {
          this.tables[tableIndex].occupied = true;
          customer.dto.tableIndex = tableIndex;
          customer.seatAt(
            this.tables[tableIndex].position.x,
            this.tables[tableIndex].position.y
          );
        }
      }
    }
  }

  private handleDepartures() {
    const viewWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    this.customers = this.customers.filter((customer) => {
      if (customer.state === 'Leaving' || customer.state === 'AngryLeaving') {
        if (customer.reachedTarget() && !customer.hasNotifiedDeparture()) {
          if (typeof customer.dto.tableIndex === 'number') {
            this.tables[customer.dto.tableIndex].occupied = false;
            customer.dto.tableIndex = null;
          }
          const result = customer.getResult();
          if (!result || result.match < 0.7) {
            this.store.updateSlice('game', (game) => ({
              ...game,
              stats: {
                ...game.stats,
                abandoned: game.stats.abandoned + 1
              }
            }));
          }
          customer.markDepartureHandled();
        }

        if (customer.shouldRemove(viewWidth)) {
          this.mount.removeChild(customer.container);
          return false;
        }
      }
      return true;
    });
  }

  private handleDelivery(customer: Customer) {
    const state = this.store.getState();
    if (state.order.ingredients.length === 0 && !state.order.beverage) {
      this.showFeedback('¡Primero arma el completo!');
      return;
    }

    const actualOrder = {
      ...state.order,
      ingredients: state.order.ingredients
    };

    const match = evaluateMatch(customer.dto.expected, actualOrder, this.recipes);
    const patienceRatio = Math.max(0, customer.dto.patience / customer.dto.patienceMax);

    const { combo: nextCombo, multiplier } = advanceCombo(state.game.combo, match.perfect);
    const score = calculateScore(match.match, patienceRatio, multiplier);

    customer.receive(match, patienceRatio);

    this.store.update((prev) => {
      const money = prev.game.money + score;
      const stats = {
        ...prev.game.stats,
        moneyTotal: prev.game.stats.moneyTotal + score,
        ordersTotal: prev.game.stats.ordersTotal + 1,
        perfectOrders: prev.game.stats.perfectOrders + (match.perfect ? 1 : 0),
        maxCombo: Math.max(prev.game.stats.maxCombo, nextCombo)
      };

      const feedback = match.perfect
        ? 'Pedido perfecto!'
        : match.match >= 0.7
        ? '¡Buen trabajo!'
        : 'Ups, algo faltó';

      return {
        ...prev,
        game: {
          ...prev.game,
          money,
          combo: nextCombo,
          comboMultiplier: multiplier,
          stats,
          feedback
        },
        order: createEmptyOrder()
      };
    });

    this.store.updateSlice('level', (slice) => ({
      ...slice,
      customersCompleted: slice.customersCompleted + 1
    }));

    this.showFeedback(match.perfect ? 'Perfecto ✨' : match.match >= 0.7 ? '¡Listo!' : 'Cliente molesto');
  }

  private updateStoreCustomers() {
    this.store.updateSlice('customers', () => this.customers.map((customer) => customer.dto));
  }

  private checkGoal() {
    if (this.endShown) return;
    const state = this.store.getState();
    const goalReached = state.game.money >= (state.game.goal ?? this.level.goal_money);
    const allSpawned = this.spawn.spawned >= this.level.customers;
    const activeCustomers = this.customers.filter((customer) => customer.state !== 'Leaving' && customer.state !== 'AngryLeaving');

    if (goalReached && allSpawned && activeCustomers.length === 0) {
      this.endShown = true;
      this.store.updateSlice('level', (slice) => ({
        ...slice,
        finished: true,
        goalAchieved: true
      }));
    }
  }

  private showFeedback(message: string) {
    this.feedbackText.text = message;
    this.feedbackText.alpha = 1;
    setTimeout(() => {
      this.feedbackText.alpha = 0;
    }, 1000);
  }
}
