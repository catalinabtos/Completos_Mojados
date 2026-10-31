// Ilustraciones del juego (estilo "Carrito de esquina": trazo café grueso, relleno plano).
// Fondos, ingredientes, bebidas, clientes y estaciones se generaron con Canva; la mascota está dibujada en vector para que se vea nítida en grande.

import type { DrinkId, ToppingId } from '../engine/data';
import type { DecorId, UpgradeId } from '../engine/upgrades';
import bebida from './art/canva/bebida.webp';
import jugo from './art/canva/jugo.webp';
import mote from './art/canva/mote.webp';
import abuelita from './art/canva/abuelita.webp';
import casera from './art/canva/casera.webp';
import huaso from './art/canva/huaso.webp';
import nino from './art/canva/nino.webp';
import oficinista from './art/canva/oficinista.webp';
import estudiante from './art/canva/estudiante.webp';
import hincha from './art/canva/hincha.webp';
import trabajador from './art/canva/trabajador.webp';
import aji from './art/canva/aji.webp';
import americana from './art/canva/americana.webp';
import chucrut from './art/canva/chucrut.webp';
import mayo from './art/canva/mayo.webp';
import palta from './art/canva/palta.webp';
import poroto from './art/canva/poroto.webp';
import tomate from './art/canva/tomate.webp';
import mascotaCelebra from './art/mascota-celebra.svg';
import mascotaFeliz from './art/mascota-feliz.svg';
import mascotaPreocupada from './art/mascota-preocupada.svg';
import decoBanderitas from './art/carrito/deco-banderitas.svg';
import decoLuces from './art/carrito/deco-luces.svg';
import decoMacetero from './art/carrito/deco-macetero.svg';
import mejoraBanquitos from './art/carrito/mejora-banquitos.svg';
import mejoraFuego from './art/carrito/mejora-fuego.svg';
import mejoraOlla from './art/carrito/mejora-olla.svg';
import mejoraRadio from './art/carrito/mejora-radio.svg';
import mejoraToalla from './art/carrito/mejora-toalla.svg';
import toldoAzul from './art/carrito/toldo-azul.svg';
import toldoVerde from './art/carrito/toldo-verde.svg';
import olla from './art/canva/olla.webp';
import vaporera from './art/canva/vaporera.webp';
import decoFoto from './art/canva/deco-foto.webp';
import decoLetrero from './art/canva/deco-letrero.webp';
import mejoraTabla from './art/canva/mejora-tabla.webp';
import bg1 from './art/bg/nivel-1.jpg';
import bg2 from './art/bg/nivel-2.jpg';
import bg3 from './art/bg/nivel-3.jpg';
import bg4 from './art/bg/nivel-4.jpg';
import bg5 from './art/bg/nivel-5.jpg';
import bg6 from './art/bg/nivel-6.jpg';
import bg7 from './art/bg/nivel-7.jpg';
import bg8 from './art/bg/nivel-8.jpg';
import bg9 from './art/bg/nivel-9.jpg';
import bg10 from './art/bg/nivel-10.jpg';

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

const MOOD_ART = import.meta.glob<string>('./art/canva/*-{impaciente,enojado}.webp', { eager: true, import: 'default' });

export interface CustomerArt {
  normal: string;
  impaciente: string;
  enojado: string;
}

/** Cada cliente con sus tres caras: normal, impaciente y enojado. */
export const CUSTOMER_ART: CustomerArt[] = (
  [
    ['estudiante', estudiante],
    ['abuelita', abuelita],
    ['hincha', hincha],
    ['trabajador', trabajador],
    ['oficinista', oficinista],
    ['casera', casera],
    ['nino', nino],
    ['huaso', huaso]
  ] as const
).map(([name, normal]) => ({
  normal,
  impaciente: MOOD_ART[`./art/canva/${name}-impaciente.webp`],
  enojado: MOOD_ART[`./art/canva/${name}-enojado.webp`]
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

/** Fondo ilustrado de cada nivel (generados con Canva), por id de nivel. */
export const LEVEL_BG: Record<number, string> = { 1: bg1, 2: bg2, 3: bg3, 4: bg4, 5: bg5, 6: bg6, 7: bg7, 8: bg8, 9: bg9, 10: bg10 };

export const MASCOT = { feliz: mascotaFeliz, celebra: mascotaCelebra, preocupada: mascotaPreocupada };

export function img(src: string, alt = '', cls = ''): HTMLImageElement {
  const image = document.createElement('img');
  image.src = src;
  image.alt = alt;
  image.draggable = false;
  if (cls) image.className = cls;
  return image;
}
