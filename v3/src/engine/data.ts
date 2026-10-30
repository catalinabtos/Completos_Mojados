// Contenido del juego: ingredientes, recetas, bebidas y los 3 niveles en Talca.

export type ToppingId =
  | 'tomate'
  | 'palta'
  | 'mayo'
  | 'chucrut'
  | 'americana'
  | 'salsa_verde'
  | 'aji'
  | 'poroto_verde';

export type RecipeId = 'italiano' | 'completo' | 'dinamico' | 'chacarero';
export type DrinkId = 'bebida' | 'jugo' | 'mote';

export interface ToppingInfo {
  id: ToppingId;
  name: string;
  icon: string;
  color: string;
}

export interface RecipeInfo {
  id: RecipeId;
  name: string;
  toppings: ToppingId[];
  price: number;
}

export interface DrinkInfo {
  id: DrinkId;
  name: string;
  icon: string;
  price: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  place: string;
  intro: string;
  /** Duración del turno en segundos. */
  duration: number;
  goal: number;
  seats: number;
  queueSize: number;
  grillSlots: number;
  /** Segundos que tarda una vienesa en estar lista. */
  cookTime: number;
  /** Segundos desde que está lista hasta que se quema. */
  burnTime: number;
  /** Paciencia de un cliente sentado, en segundos. */
  patience: number;
  /** Intervalo entre llegadas de clientes [mín, máx] en segundos. */
  arrival: [number, number];
  recipes: Partial<Record<RecipeId, number>>;
  drinks: DrinkId[];
  /** Probabilidad de que un cliente pida bebida. */
  drinkChance: number;
  toppings: ToppingId[];
  rain: boolean;
  newThings: string[];
}

export const TOPPINGS: Record<ToppingId, ToppingInfo> = {
  tomate: { id: 'tomate', name: 'Tomate', icon: '🍅', color: '#e53935' },
  palta: { id: 'palta', name: 'Palta', icon: '🥑', color: '#7cb342' },
  mayo: { id: 'mayo', name: 'Mayo', icon: '⚪', color: '#fff6d5' },
  chucrut: { id: 'chucrut', name: 'Chucrut', icon: '🥬', color: '#e6dd8a' },
  americana: { id: 'americana', name: 'Americana', icon: '🥒', color: '#c0ca33' },
  salsa_verde: { id: 'salsa_verde', name: 'Salsa verde', icon: '🌿', color: '#2e7d32' },
  aji: { id: 'aji', name: 'Ají', icon: '🌶️', color: '#d84315' },
  poroto_verde: { id: 'poroto_verde', name: 'Poroto verde', icon: '🫛', color: '#558b2f' }
};

export const RECIPES: Record<RecipeId, RecipeInfo> = {
  italiano: { id: 'italiano', name: 'Italiano', toppings: ['tomate', 'palta', 'mayo'], price: 2500 },
  completo: { id: 'completo', name: 'Completo', toppings: ['tomate', 'chucrut', 'mayo'], price: 2300 },
  dinamico: {
    id: 'dinamico',
    name: 'Dinámico',
    toppings: ['tomate', 'palta', 'americana', 'mayo'],
    price: 3000
  },
  chacarero: {
    id: 'chacarero',
    name: 'Chacarero',
    toppings: ['tomate', 'poroto_verde', 'aji', 'mayo'],
    price: 3200
  }
};

export const DRINKS: Record<DrinkId, DrinkInfo> = {
  bebida: { id: 'bebida', name: 'Bebida', icon: '🥤', price: 1000 },
  jugo: { id: 'jugo', name: 'Jugo', icon: '🧃', price: 900 },
  mote: { id: 'mote', name: 'Mote con huesillo', icon: '🍑', price: 1500 }
};

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Plaza de Armas',
    place: 'Talca centro, mediodía',
    intro: 'Primer día con el carrito. Pon la vienesa en la plancha, arma el pan y sirve antes de que se aburran.',
    duration: 120,
    goal: 35000,
    seats: 3,
    queueSize: 3,
    grillSlots: 2,
    cookTime: 3,
    burnTime: 7,
    patience: 30,
    arrival: [6, 9],
    recipes: { italiano: 3, completo: 2 },
    drinks: [],
    drinkChance: 0,
    toppings: ['tomate', 'palta', 'mayo', 'chucrut'],
    rain: false,
    newThings: ['Italiano', 'Completo']
  },
  {
    id: 2,
    name: 'Mercado Central',
    place: 'Calle 1 Sur, hora de almuerzo',
    intro: 'Llega la gente del mercado. Ahora también piden Dinámico y bebidas.',
    duration: 150,
    goal: 45000,
    seats: 4,
    queueSize: 3,
    grillSlots: 3,
    cookTime: 3.5,
    burnTime: 5.5,
    patience: 26,
    arrival: [4.5, 7],
    recipes: { italiano: 3, completo: 2, dinamico: 2 },
    drinks: ['bebida', 'jugo'],
    drinkChance: 0.35,
    toppings: ['tomate', 'palta', 'mayo', 'chucrut', 'americana'],
    rain: false,
    newThings: ['Dinámico', 'Bebidas']
  },
  {
    id: 3,
    name: 'Estadio Fiscal',
    place: 'Día de partido, con lluvia',
    intro: 'Llueve y el estadio se llena: completos mojados para todos. Llega el Chacarero y el mote con huesillo.',
    duration: 165,
    goal: 70000,
    seats: 5,
    queueSize: 4,
    grillSlots: 3,
    cookTime: 3,
    burnTime: 4.5,
    patience: 23,
    arrival: [3.6, 5.8],
    recipes: { italiano: 3, completo: 2, dinamico: 2, chacarero: 2 },
    drinks: ['bebida', 'jugo', 'mote'],
    drinkChance: 0.4,
    toppings: ['tomate', 'palta', 'mayo', 'chucrut', 'americana', 'poroto_verde', 'aji'],
    rain: true,
    newThings: ['Chacarero', 'Mote con huesillo', 'Lluvia']
  }
];

/** Umbrales de estrellas: meta, meta×1.25, meta×1.5. */
export function starsFor(level: LevelConfig, money: number): number {
  if (money >= level.goal * 1.5) return 3;
  if (money >= level.goal * 1.25) return 2;
  if (money >= level.goal) return 1;
  return 0;
}

export function formatCLP(value: number): string {
  const rounded = Math.round(value);
  return '$' + rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
