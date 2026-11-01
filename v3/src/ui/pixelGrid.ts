/** Ancho en píxeles de los fondos de pixel art. */
const FONDO_ANCHO = 62;

/** Tamaños de un píxel de cliente, en puntos: grande, mediano, chico y mínimo. */
const PIXEL_CLIENTE = { l: 3.34, m: 2.7, s: 2, xs: 1.67 };

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
  root.setProperty('--zoom-historia', String(Math.floor(4 * dpr) / dpr));
  const celda = Math.ceil((app.clientWidth / FONDO_ANCHO) * dpr) / dpr;
  root.setProperty('--fondo-ancho', `${celda * FONDO_ANCHO}px`);
}
