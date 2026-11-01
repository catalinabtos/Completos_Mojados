// Arte del juego: todo es pixel art generado con Canva.

import type { DrinkId, ToppingId } from '../engine/data';
import type { Speaker } from '../engine/story';
import type { DecorId, UpgradeId } from '../engine/upgrades';
import bebida from './art/bebidas/bebida.png';
import jugo from './art/bebidas/jugo.png';
import mote from './art/bebidas/mote.png';
import aji from './art/ingredientes/aji.png';
import americana from './art/ingredientes/americana.png';
import chucrut from './art/ingredientes/chucrut.png';
import mayo from './art/ingredientes/mayo.png';
import palta from './art/ingredientes/palta.png';
import poroto from './art/ingredientes/poroto.png';
import tomate from './art/ingredientes/tomate.png';
import mascotaCelebra from './art/mascota/celebra.png';
import mascotaFeliz from './art/mascota/feliz.png';
import mascotaPreocupada from './art/mascota/preocupada.png';
import decoBanderitas from './art/carrito/deco-banderitas.png';
import decoBanderitasTienda from './art/carrito/deco-banderitas-tienda.png';
import decoLuces from './art/carrito/deco-luces.png';
import decoLucesTienda from './art/carrito/deco-luces-tienda.png';
import decoMacetero from './art/carrito/deco-macetero.png';
import mejoraBanquitos from './art/carrito/mejora-banquitos.png';
import mejoraFuego from './art/carrito/mejora-fuego.png';
import mejoraOlla from './art/carrito/mejora-olla.png';
import mejoraRadio from './art/carrito/mejora-radio.png';
import mejoraToalla from './art/carrito/mejora-toalla.png';
import toldoAzul from './art/carrito/toldo-azul.png';
import toldoVerde from './art/carrito/toldo-verde.png';
import olla from './art/cocina/olla.png';
import vaporera from './art/cocina/vaporera.png';
import decoFoto from './art/carrito/deco-foto.png';
import decoLetrero from './art/carrito/deco-letrero.png';
import decoLetreroTienda from './art/carrito/deco-letrero-tienda.png';
import mejoraTabla from './art/carrito/mejora-tabla.png';
import bg1 from './art/bg/nivel-1.png';
import bg2 from './art/bg/nivel-2.png';
import bg3 from './art/bg/nivel-3.png';
import bg4 from './art/bg/nivel-4.png';
import bg5 from './art/bg/nivel-5.png';
import bg6 from './art/bg/nivel-6.png';
import bg7 from './art/bg/nivel-7.png';
import bg8 from './art/bg/nivel-8.png';
import bg9 from './art/bg/nivel-9.png';
import bg10 from './art/bg/nivel-10.png';

export const TOPPING_ART: Record<ToppingId, string> = {
  tomate,
  palta,
  mayo,
  chucrut,
  americana,
  poroto_verde: poroto,
  aji
};

export const DRINK_ART: Record<DrinkId, string> = { bebida, jugo, mote };

const CLIENTES = import.meta.glob<string>('./art/clientes/*.png', { eager: true, import: 'default' });

export interface CustomerArt {
  /** Ancho del dibujo en píxeles reales. */
  width: number;
  normal: string;
  impaciente: string;
  enojado: string;
}

/** Cada cliente con sus tres caras: normal, impaciente y enojado. */
export const CUSTOMER_ART: CustomerArt[] = (
  [
    ['estudiante', 28],
    ['abuelita', 27],
    ['hincha', 32],
    ['trabajador', 32],
    ['oficinista', 28],
    ['casera', 30],
    ['nino', 19],
    ['huaso', 30]
  ] as const
).map(([name, width]) => ({
  width,
  normal: CLIENTES[`./art/clientes/${name}.png`],
  impaciente: CLIENTES[`./art/clientes/${name}-impaciente.png`],
  enojado: CLIENTES[`./art/clientes/${name}-enojado.png`]
}));

export const STATION_ART = { olla, vapor: vaporera };

/** Íconos de las mejoras del carrito. */
export const UPGRADE_ART: Partial<Record<UpgradeId, string>> = {
  olla: mejoraOlla,
  toalla: mejoraToalla,
  fuego: mejoraFuego,
  banquitos: mejoraBanquitos,
  radio: mejoraRadio,
  tabla: mejoraTabla
};

/** Arte de cada decoración; solo las que están aquí se venden en Mi carrito. */
export const DECOR_ART: Partial<Record<DecorId, string>> = {
  toldo_verde: toldoVerde,
  toldo_azul: toldoAzul,
  banderitas: decoBanderitas,
  macetero: decoMacetero,
  luces: decoLuces,
  letrero: decoLetrero,
  foto: decoFoto
};

/** Las piezas que no caben en el lienzo común de la tienda tienen su propio ícono. */
export const DECOR_TIENDA: Partial<Record<DecorId, string>> = {
  banderitas: decoBanderitasTienda,
  luces: decoLucesTienda,
  letrero: decoLetreroTienda
};

/** Fondo de pixel art de cada nivel, por id de nivel. */
export const LEVEL_BG: Record<number, string> = { 1: bg1, 2: bg2, 3: bg3, 4: bg4, 5: bg5, 6: bg6, 7: bg7, 8: bg8, 9: bg9, 10: bg10 };

export const MASCOT = { feliz: mascotaFeliz, celebra: mascotaCelebra, preocupada: mascotaPreocupada };

/** Quién acompaña cada tarjeta de historia. La abuela Teresa aún no tiene dibujo: sus recados los trae la mascota. */
export const SPEAKER_ART: Record<Speaker, string> = {
  teresa: mascotaFeliz,
  rosa: CLIENTES['./art/clientes/abuelita.png'],
  marta: CLIENTES['./art/clientes/casera.png'],
  javi: CLIENTES['./art/clientes/estudiante.png'],
  lucho: CLIENTES['./art/clientes/hincha.png'],
  fuenzalida: CLIENTES['./art/clientes/oficinista.png'],
  pato: CLIENTES['./art/clientes/trabajador.png'],
  hernan: CLIENTES['./art/clientes/huaso.png'],
  benja: CLIENTES['./art/clientes/nino.png']
};

export function img(src: string, alt = '', cls = ''): HTMLImageElement {
  const image = document.createElement('img');
  image.src = src;
  image.alt = alt;
  image.draggable = false;
  if (cls) image.className = cls;
  return image;
}
