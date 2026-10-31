type Child = Node | string | null | undefined | false;

/** Crea un elemento con atributos e hijos. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child);
  }
  return node;
}

/** Botón que responde al toque (sin la demora del click en iOS). */
export function button(label: Child | Child[], onTap: () => void, cls = 'btn'): HTMLButtonElement {
  const kids = Array.isArray(label) ? label : [label];
  const b = el('button', { class: cls, type: 'button' }, ...kids);
  b.addEventListener('click', (e) => {
    e.preventDefault();
    onTap();
  });
  return b;
}

const ICONS: Record<string, string> = {
  pause: '<rect x="6" y="4" width="4.5" height="16" rx="1.5" fill="currentColor" stroke="none"/><rect x="13.5" y="4" width="4.5" height="16" rx="1.5" fill="currentColor" stroke="none"/>',
  book: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2" fill="currentColor"/><circle cx="4.5" cy="12" r="1.2" fill="currentColor"/><circle cx="4.5" cy="18" r="1.2" fill="currentColor"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  sound: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  star: '<path d="M12 3.2l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6-4.3-4.2 6-.9z"/>',
  clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 3h6"/>'
};

/** Ícono de trazo (stroke) en el color del texto. */
export function svgIcon(name: keyof typeof ICONS, size = 22): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'svg-icon';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  return span;
}
