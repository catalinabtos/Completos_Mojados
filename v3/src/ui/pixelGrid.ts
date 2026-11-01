/** Ancho en píxeles de los fondos de pixel art. */
const FONDO_ANCHO = 62;

/** Tamaños de un píxel de cliente, en puntos: grande, mediano, chico y mínimo. */
const PIXEL_CLIENTE = { l: 3.34, m: 2.7, s: 2, xs: 1.67 };

/** Ancho y alto del lienzo común de los ingredientes y ancho del de la mascota. */
const ICONO_ANCHO = 26;
const MASCOTA_ANCHO = 60;

/** Tamaños de un píxel de ingrediente, en puntos, de botón grande a globo apretado. */
const PIXEL_ICONO = { l: 2, m: 1.67, s: 1.33, xs: 1, xxs: 0.75 };

/** Tamaños de un píxel de la comida en la cocina, en puntos, de la tabla al espacio más angosto. */
const PIXEL_COCINA = { l: 2, m: 1.67, s: 1, xs: 0.75 };

/**
 * Ajusta el tamaño del pixel art a los píxeles físicos de la pantalla,
 * para que cada cuadrado mida exactamente lo mismo en cualquier teléfono.
 */
export function applyPixelGrid(app: HTMLElement) {
  const root = document.documentElement.style;
  const dpr = window.devicePixelRatio || 1;
  for (const [name, size] of Object.entries(PIXEL_CLIENTE)) {
    root.setProperty(`--px-${name}`, `${Math.floor(size * dpr) / dpr}px`);
  }
  for (const [name, size] of Object.entries(PIXEL_ICONO)) {
    root.setProperty(`--icono-${name}`, `${(Math.round(size * dpr) / dpr) * ICONO_ANCHO}px`);
  }
  for (const [name, size] of Object.entries(PIXEL_COCINA)) {
    root.setProperty(`--cocina-${name}`, `${Math.round(size * dpr) / dpr}px`);
  }
  const { innerWidth: ancho, innerHeight: alto } = window;
  const mascota = {
    portada: Math.min(ancho * 0.74, 290),
    historia: Math.min(ancho * 0.52, 190),
    resultado: Math.min(alto * 0.22, 210),
    baja: 220,
    chica: 96
  };
  for (const [name, size] of Object.entries(mascota)) {
    root.setProperty(`--mascota-${name}`, `${(Math.floor((size / MASCOTA_ANCHO) * dpr) / dpr) * MASCOTA_ANCHO}px`);
  }
  root.setProperty('--zoom-historia', String(Math.floor(4 * dpr) / dpr));
  const celda = Math.ceil((app.clientWidth / FONDO_ANCHO) * dpr) / dpr;
  root.setProperty('--fondo-ancho', `${celda * FONDO_ANCHO}px`);
}
