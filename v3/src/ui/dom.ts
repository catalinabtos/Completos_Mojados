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
