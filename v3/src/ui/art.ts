// Ilustraciones del juego (estilo "Carrito de esquina": trazo café grueso, relleno plano).

import type { DrinkId, ToppingId } from '../engine/data';
import bebida from './art/beb-bebida.svg';
import jugo from './art/beb-jugo.svg';
import mote from './art/beb-mote.svg';
import abuelita from './art/cliente-abuelita.svg';
import estudiante from './art/cliente-estudiante.svg';
import hincha from './art/cliente-hincha.svg';
import trabajador from './art/cliente-trabajador.svg';
import aji from './art/ing-aji.svg';
import americana from './art/ing-americana.svg';
import chucrut from './art/ing-chucrut.svg';
import mayo from './art/ing-mayo.svg';
import palta from './art/ing-palta.svg';
import poroto from './art/ing-poroto.svg';
import tomate from './art/ing-tomate.svg';
import mascotaCelebra from './art/mascota-celebra.svg';
import mascotaFeliz from './art/mascota-feliz.svg';
import mascotaPreocupada from './art/mascota-preocupada.svg';

export const TOPPING_ART: Record<ToppingId, string> = {
  tomate,
  palta,
  mayo,
  chucrut,
  americana,
  poroto_verde: poroto,
  aji,
  // Sin ilustración propia todavía: se usa la de la americana.
  salsa_verde: americana
};

export const DRINK_ART: Record<DrinkId, string> = { bebida, jugo, mote };

export const CUSTOMER_ART = [estudiante, abuelita, hincha, trabajador];

export const MASCOT = { feliz: mascotaFeliz, celebra: mascotaCelebra, preocupada: mascotaPreocupada };

export function img(src: string, alt = '', cls = ''): HTMLImageElement {
  const image = document.createElement('img');
  image.src = src;
  image.alt = alt;
  image.draggable = false;
  if (cls) image.className = cls;
  return image;
}
