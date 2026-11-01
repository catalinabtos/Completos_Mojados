// El completo de la tabla: capas de pixel art del mismo lienzo, que crecen con cada ingrediente.

import type { ToppingId } from '../engine/data';
import type { Tray } from '../engine/game';
import { img } from './art';
import americana from './art/cocina/completo/americana.png';
import aji from './art/cocina/completo/aji.png';
import back from './art/cocina/completo/back.png';
import chucrut from './art/cocina/completo/chucrut.png';
import front from './art/cocina/completo/front.png';
import mayo from './art/cocina/completo/mayo.png';
import palta from './art/cocina/completo/palta.png';
import poroto from './art/cocina/completo/poroto.png';
import tomate from './art/cocina/completo/tomate.png';
import vienesa from './art/cocina/completo/vienesa.png';
import { el } from './dom';

/** Capas en orden de atrás hacia adelante; lo que no se pide no se dibuja. */
const LAYERS: [ToppingId, string][] = [
  ['palta', palta],
  ['poroto_verde', poroto],
  ['chucrut', chucrut],
  ['americana', americana],
  ['tomate', tomate],
  ['aji', aji],
  ['mayo', mayo]
];

export function completoEl(tray: Tray): HTMLElement {
  const has = (t: ToppingId) => tray.toppings.includes(t);
  const sources = [back, ...(tray.vienesa ? [vienesa] : [])];
  for (const [topping, src] of LAYERS) if (has(topping)) sources.push(src);
  return el('div', { class: 'hotdog' }, ...sources.map((src) => img(src)), img(front));
}
