// Contenido del juego: ingredientes, recetas, bebidas y los 10 niveles en Talca.

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

export interface StationConfig {
  slots: number;
  /** Segundos hasta que la vienesa o el pan están listos. */
  cook: number;
  /** Segundos que aguantan listos antes de echarse a perder. */
  hold: number;
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
  /** Olla con agua caliente para las vienesas. */
  olla: StationConfig;
  /** Vaporera: los panes sobre una toalla, encima del agua. */
  vapor: StationConfig;
  /** Paciencia de un cliente sentado, en segundos. */
  patience: number;
  /** Intervalo entre llegadas de clientes [mín, máx] en segundos. */
  arrival: [number, number];
  recipes: Partial<Record<RecipeId, number>>;
  drinks: DrinkId[];
  /** Probabilidad de que un cliente pida bebida. */
  drinkChance: number;
  toppings: ToppingId[];
  scene: 'plaza' | 'calle' | 'mercado' | 'universidad' | 'estacion' | 'estadio' | 'rio' | 'feria';
  weather: 'sol' | 'nublado' | 'lluvia' | 'noche' | 'tormenta';
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

const BASE = ['tomate', 'chucrut', 'mayo'] as ToppingId[];

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: '5 Oriente con 2 Sur',
    place: 'La esquina de los completos, mediodía',
    intro: 'Tu primer día en el carrito. Pon un pan en la vaporera y una vienesa en la olla, arma el completo y sírvelo antes de que el cliente se aburra.',
    duration: 100,
    goal: 23000,
    seats: 2,
    queueSize: 3,
    olla: { slots: 2, cook: 3, hold: 12.5 },
    vapor: { slots: 2, cook: 2.5, hold: 14 },
    patience: 36,
    arrival: [9.5, 13.5],
    recipes: { completo: 1 },
    drinks: [],
    drinkChance: 0,
    toppings: BASE,
    scene: 'calle',
    weather: 'sol',
    newThings: ['Completo talquino', 'Olla y vaporera']
  },
  {
    id: 2,
    name: 'Plaza de Armas',
    place: 'Centro de Talca, hora de almuerzo',
    intro: 'La plaza se llena de oficinistas. Algunos piden Italiano: tomate, palta y mayo.',
    duration: 120,
    goal: 31000,
    seats: 3,
    queueSize: 3,
    olla: { slots: 2, cook: 3, hold: 11 },
    vapor: { slots: 2, cook: 2.5, hold: 12.5 },
    patience: 32,
    arrival: [8.7, 12.5],
    recipes: { completo: 3, italiano: 2 },
    drinks: [],
    drinkChance: 0,
    toppings: ['tomate', 'chucrut', 'palta', 'mayo'],
    scene: 'plaza',
    weather: 'sol',
    newThings: ['Italiano']
  },
  {
    id: 3,
    name: 'Mercado Central',
    place: 'Calle 1 Sur, sábado en la mañana',
    intro: 'Los caseros del mercado llegan con sed. Ahora también se venden bebidas y jugos.',
    duration: 130,
    goal: 35000,
    seats: 3,
    queueSize: 3,
    olla: { slots: 3, cook: 3.5, hold: 11 },
    vapor: { slots: 2, cook: 2.5, hold: 11 },
    patience: 32,
    arrival: [8.7, 12.5],
    recipes: { completo: 3, italiano: 2 },
    drinks: ['bebida', 'jugo'],
    drinkChance: 0.35,
    toppings: ['tomate', 'chucrut', 'palta', 'mayo'],
    scene: 'mercado',
    weather: 'nublado',
    newThings: ['Bebidas']
  },
  {
    id: 4,
    name: 'Universidad de Talca',
    place: 'Semana de pruebas',
    intro: 'Estudiantes con hambre y poco tiempo entre prueba y prueba. Llega el Dinámico, con americana.',
    duration: 140,
    goal: 38000,
    seats: 4,
    queueSize: 3,
    olla: { slots: 3, cook: 3.5, hold: 10.5 },
    vapor: { slots: 3, cook: 2.5, hold: 11 },
    patience: 30,
    arrival: [7.8, 11.3],
    recipes: { completo: 3, italiano: 2, dinamico: 2 },
    drinks: ['bebida', 'jugo'],
    drinkChance: 0.3,
    toppings: ['tomate', 'chucrut', 'palta', 'americana', 'mayo'],
    scene: 'universidad',
    weather: 'sol',
    newThings: ['Dinámico', '4 puestos']
  },
  {
    id: 5,
    name: 'Estación de Talca',
    place: 'Antes de que salga el ramal a Constitución',
    intro: 'Los pasajeros llegan todos juntos antes de que parta el tren. Atiende rápido y aprovecha las pausas para adelantar panes.',
    duration: 140,
    goal: 35000,
    seats: 4,
    queueSize: 4,
    olla: { slots: 3, cook: 3.5, hold: 10 },
    vapor: { slots: 3, cook: 2.5, hold: 10.5 },
    patience: 27,
    arrival: [5.1, 13.3],
    recipes: { completo: 3, italiano: 2, dinamico: 2 },
    drinks: ['bebida', 'jugo'],
    drinkChance: 0.35,
    toppings: ['tomate', 'chucrut', 'palta', 'americana', 'mayo'],
    scene: 'estacion',
    weather: 'nublado',
    newThings: ['Clientes apurados']
  },
  {
    id: 6,
    name: 'Estadio Fiscal',
    place: 'Día de partido de Rangers',
    intro: 'Se llena el estadio y llueve. Los hinchas piden Chacarero: tomate, poroto verde, ají y mayo.',
    duration: 150,
    goal: 50000,
    seats: 4,
    queueSize: 4,
    olla: { slots: 3, cook: 3, hold: 10 },
    vapor: { slots: 3, cook: 2.5, hold: 10 },
    patience: 28,
    arrival: [7.2, 10.3],
    recipes: { completo: 3, italiano: 2, dinamico: 1, chacarero: 2 },
    drinks: ['bebida', 'jugo'],
    drinkChance: 0.35,
    toppings: ['tomate', 'chucrut', 'palta', 'americana', 'poroto_verde', 'aji', 'mayo'],
    scene: 'estadio',
    weather: 'lluvia',
    newThings: ['Chacarero', 'Lluvia']
  },
  {
    id: 7,
    name: 'Costanera del Río Claro',
    place: 'Tarde de verano',
    intro: 'Hace calor y todos quieren algo helado. Llega el mote con huesillo.',
    duration: 150,
    goal: 53000,
    seats: 5,
    queueSize: 4,
    olla: { slots: 3, cook: 3, hold: 9 },
    vapor: { slots: 3, cook: 2.5, hold: 10 },
    patience: 28,
    arrival: [7.2, 10.3],
    recipes: { completo: 3, italiano: 3, dinamico: 2, chacarero: 1 },
    drinks: ['bebida', 'jugo', 'mote'],
    drinkChance: 0.6,
    toppings: ['tomate', 'chucrut', 'palta', 'americana', 'poroto_verde', 'aji', 'mayo'],
    scene: 'rio',
    weather: 'sol',
    newThings: ['Mote con huesillo', '5 puestos']
  },
  {
    id: 8,
    name: 'Temporal en 1 Sur',
    place: 'Noche de invierno',
    intro: 'Llueve fuerte y nadie quiere esperar. Los panes se ponen aguados más rápido con tanta humedad.',
    duration: 150,
    goal: 38000,
    seats: 5,
    queueSize: 4,
    olla: { slots: 3, cook: 3, hold: 10.5 },
    vapor: { slots: 3, cook: 2.5, hold: 9.5 },
    patience: 28,
    arrival: [6.3, 9.1],
    recipes: { completo: 4, italiano: 2, dinamico: 2, chacarero: 2 },
    drinks: ['bebida', 'jugo'],
    drinkChance: 0.3,
    toppings: ['tomate', 'chucrut', 'palta', 'americana', 'poroto_verde', 'aji', 'mayo'],
    scene: 'calle',
    weather: 'tormenta',
    newThings: ['Panes que se aguan más rápido']
  },
  {
    id: 9,
    name: 'Fiestas Patrias',
    place: 'La ramada, 18 de septiembre',
    intro: 'Cueca, empanadas y una fila que no se acaba. Llegan pedidos de todo tipo.',
    duration: 165,
    goal: 54000,
    seats: 5,
    queueSize: 5,
    olla: { slots: 4, cook: 3, hold: 10.5 },
    vapor: { slots: 4, cook: 2.5, hold: 10.5 },
    patience: 28,
    arrival: [6.2, 8.9],
    recipes: { completo: 3, italiano: 3, dinamico: 2, chacarero: 2 },
    drinks: ['bebida', 'jugo', 'mote'],
    drinkChance: 0.45,
    toppings: ['tomate', 'chucrut', 'palta', 'americana', 'poroto_verde', 'aji', 'mayo'],
    scene: 'feria',
    weather: 'sol',
    newThings: ['4 puestos en olla y vaporera']
  },
  {
    id: 10,
    name: 'Feria del Completo',
    place: 'El día del récord',
    intro: 'Talca quiere batir el récord y toda la ciudad viene a tu carrito. Es el turno más largo y la meta más alta.',
    duration: 180,
    goal: 68000,
    seats: 5,
    queueSize: 5,
    olla: { slots: 4, cook: 3, hold: 7.5 },
    vapor: { slots: 4, cook: 2.5, hold: 7.5 },
    patience: 24,
    arrival: [5.8, 8.3],
    recipes: { completo: 3, italiano: 3, dinamico: 2, chacarero: 2 },
    drinks: ['bebida', 'jugo', 'mote'],
    drinkChance: 0.45,
    toppings: ['tomate', 'chucrut', 'palta', 'americana', 'poroto_verde', 'aji', 'mayo'],
    scene: 'feria',
    weather: 'noche',
    newThings: ['Turno final']
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
