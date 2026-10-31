// El completo de la tabla: capas de vector apiladas, que crecen con cada ingrediente.

import type { ToppingId } from '../engine/data';
import type { Tray } from '../engine/game';
import { img } from './art';
import americana from './art/completo/americana.svg';
import aji from './art/completo/aji.svg';
import back from './art/completo/back.svg';
import chucrutCentro from './art/completo/chucrut-centro.svg';
import chucrut from './art/completo/chucrut.svg';
import front from './art/completo/front.svg';
import mayo from './art/completo/mayo.svg';
import palta from './art/completo/palta.svg';
import poroto from './art/completo/poroto.svg';
import tomate from './art/completo/tomate.svg';
import vienesa from './art/completo/vienesa.svg';
import { el } from './dom';

/** Capas en orden de atrás hacia adelante; lo que no se pide no se dibuja. */
const LAYERS: [ToppingId, string][] = [
  ['palta', palta],
  ['poroto_verde', poroto],
  ['americana', americana],
  ['tomate', tomate],
  ['aji', aji],
  ['mayo', mayo]
];

export function completoEl(tray: Tray): HTMLElement {
  const has = (t: ToppingId) => tray.toppings.includes(t);
  const sources = [back, ...(tray.vienesa ? [vienesa] : [])];
  for (const [topping, src] of LAYERS) {
    if (topping === 'americana' && has('chucrut')) sources.push(has('palta') ? chucrutCentro : chucrut);
    if (has(topping)) sources.push(src);
  }
  return el('div', { class: 'hotdog' }, ...sources.map((src) => img(src)), img(front));
}
