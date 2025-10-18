export type Ingredient = string;
export type Beverage = string | null;

export interface OrderDTO {
  ingredients: Ingredient[];
  beverage?: Beverage;
  tableId?: number | null;
  label?: string;
}

export type CustomerState =
  | 'Arriving'
  | 'Waiting'
  | 'Seated'
  | 'Ordering'
  | 'Eating'
  | 'Leaving'
  | 'AngryLeaving';

export interface CustomerDTO {
  id: string;
  state: CustomerState;
  tableIndex: number | null;
  patienceMax: number;
  patience: number;
  personality: 'calm' | 'normal' | 'rushy';
  expected: OrderDTO;
  hasBeverage?: boolean;
  served?: boolean;
}

export interface LevelConfig {
  world: number;
  level: number;
  goal_money: number;
  tables: number;
  queue_slots: number;
  customers: number;
  order_mix: Record<string, number>;
  timers: { patience: number; prep_pan?: number; prep_sausage?: number };
  beverages_enabled: boolean;
  toppings_enabled: string[];
}

export interface RecipesData {
  base: Ingredient[];
  completos: Record<string, Ingredient[]>;
  extras: Ingredient[];
  bebidas: Ingredient[];
  ui_labels: Record<string, string>;
}

export interface LevelsData {
  levels: LevelConfig[];
}

export interface GameStats {
  moneyTotal: number;
  perfectOrders: number;
  ordersTotal: number;
  maxCombo: number;
  abandoned: number;
}

export interface GameSlice {
  money: number;
  combo: number;
  comboMultiplier: number;
  stats: GameStats;
  goal: number;
  feedback: string | null;
}

export interface LevelSlice {
  config: LevelConfig | null;
  customersSpawned: number;
  customersCompleted: number;
  finished: boolean;
  goalAchieved: boolean;
  nextSpawn: number;
  active: boolean;
}

export interface OrderHistoryEntry {
  type: 'ingredient' | 'beverage';
  value: Ingredient;
}

export interface OrderSlice {
  ingredients: Ingredient[];
  beverage: Beverage;
  history: OrderHistoryEntry[];
}

export interface SettingsSlice {
  audio: number;
  contrast: 'normal' | 'high';
  lang: string;
}

export interface RootState {
  game: GameSlice;
  level: LevelSlice;
  order: OrderSlice;
  customers: CustomerDTO[];
  settings: SettingsSlice;
}

export interface SaveData {
  progress: { world: number; level: number };
  stats: {
    money_total: number;
    perfect_orders: number;
    orders_total: number;
    max_combo: number;
    abandoned: number;
  };
  settings: { audio: number; contrast: 'normal' | 'high'; lang: string };
}
