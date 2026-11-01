// Historia ligera: una tarjeta antes de cada esquina y una al ganar la Feria del Completo.

export type Speaker = 'teresa' | 'rosa' | 'marta' | 'javi' | 'lucho' | 'fuenzalida' | 'pato' | 'hernan' | 'benja';

export interface StoryCard {
  speaker: Speaker;
  text: string;
}

export const SPEAKERS: Record<Speaker, string> = {
  teresa: 'Recado de la abuela Teresa',
  rosa: 'Doña Rosa',
  marta: 'Señora Marta',
  javi: 'Javi',
  lucho: 'Don Lucho',
  fuenzalida: 'Sr. Fuenzalida',
  pato: 'Pato',
  hernan: 'Don Hernán',
  benja: 'Benja'
};

/** Id de la tarjeta final; las demás usan el id de su esquina. */
export const STORY_ENDING = 11;

export const STORY: Record<number, StoryCard> = {
  1: { speaker: 'teresa', text: 'Treinta años en esta esquina, y ahora el carrito es tuyo. Vienesa al agua, pan al vapor. Lo demás se aprende atendiendo.' },
  2: { speaker: 'rosa', text: '¡Tienes la misma mano de tu abuela! Ya le conté a todo el barrio. Anda a la Plaza, que al almuerzo se llena.' },
  3: { speaker: 'marta', text: 'Los sábados aquí todos andan con sed, así que trae la hielera. Y tranquilidad, que la palta buena te la guardo yo.' },
  4: { speaker: 'javi', text: '¡Tengo control en diez minutos! Dame un completo rápido y te prometo que paso el ramo.' },
  5: { speaker: 'teresa', text: 'Cuando llega el tren, llegan todos juntos. Adelanta panes en las pausas, que después no hay tiempo.' },
  6: { speaker: 'lucho', text: 'Llueva o truene, Rangers juega y yo voy. Hoy ganamos, te lo firmo. ¿Un chacarero para la suerte?' },
  7: { speaker: 'fuenzalida', text: 'Hoy no tengo reunión, pero la corbata no me la saco ni en el río. Un mote con huesillo, por favor.' },
  8: { speaker: 'pato', text: 'Salí de turno y con este temporal no queda nada abierto. Menos mal que el carrito sigue aquí.' },
  9: { speaker: 'hernan', text: 'Buenas tardes, joven. Su abuela me atendió en estas mismas fiestas, hace muchos años. Vengo a ver si la receta sigue igual.' },
  10: { speaker: 'benja', text: 'Mi abuela Rosa dice que hoy viene toda Talca. Junté para uno. ¿Me alcanza?' },
  [STORY_ENDING]: { speaker: 'teresa', text: 'Treinta años y nunca vi una fila así. Ahora sí: el mejor carrito de Talca. Estoy orgullosa de ti.' }
};
