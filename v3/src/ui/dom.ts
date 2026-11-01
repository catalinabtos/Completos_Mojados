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

/** Íconos en una grilla de 12 × 12: cada # es un cuadrado. */
const ICONS: Record<string, string[]> = {
  pause: [
    '............',
    '..###..###..',
    '..###..###..',
    '..###..###..',
    '..###..###..',
    '..###..###..',
    '..###..###..',
    '..###..###..',
    '..###..###..',
    '..###..###..',
    '..###..###..',
    '............'
  ],
  book: [
    '............',
    '.##.#######.',
    '.##.#######.',
    '............',
    '............',
    '.##.#######.',
    '.##.#######.',
    '............',
    '............',
    '.##.#######.',
    '.##.#######.',
    '............'
  ],
  back: [
    '.......##...',
    '......###...',
    '.....###....',
    '....###.....',
    '...###......',
    '..###.......',
    '..###.......',
    '...###......',
    '....###.....',
    '.....###....',
    '......###...',
    '.......##...'
  ],
  sound: [
    '............',
    '.....#....#.',
    '....##.#...#',
    '.#####..#..#',
    '.#####..#..#',
    '.#####..#..#',
    '.#####..#..#',
    '.#####..#..#',
    '.#####..#..#',
    '....##.#...#',
    '.....#....#.',
    '............'
  ],
  mute: [
    '............',
    '.....#......',
    '....##......',
    '.#####.#...#',
    '.#####..#.#.',
    '.#####...#..',
    '.#####...#..',
    '.#####..#.#.',
    '.#####.#...#',
    '....##......',
    '.....#......',
    '............'
  ],
  lock: [
    '....####....',
    '...#....#...',
    '..##....##..',
    '..##....##..',
    '.##########.',
    '.##########.',
    '.####..####.',
    '.####..####.',
    '.#####.####.',
    '.##########.',
    '.##########.',
    '............'
  ],
  star: [
    '.....##.....',
    '.....##.....',
    '....####....',
    '....####....',
    '############',
    '.##########.',
    '..########..',
    '...######...',
    '...######...',
    '..###..###..',
    '..##....##..',
    '.##......##.'
  ],
  clock: [
    '....####....',
    '............',
    '...######...',
    '..##.##.##..',
    '.###.##.###.',
    '.###.##.###.',
    '.###.###.##.',
    '.#####..###.',
    '..########..',
    '...######...',
    '............',
    '............'
  ]
};

/** Ícono de pixel art en el color del texto, ajustado a un múltiplo de su grilla. */
export function svgIcon(name: keyof typeof ICONS, size = 24): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'svg-icon';
  span.setAttribute('aria-hidden', 'true');
  const lado = Math.max(1, Math.round(size / 12)) * 12;
  const cuadros = ICONS[name].flatMap((fila, y) => [...fila].flatMap((c, x) => (c === '#' ? [`M${x} ${y}h1v1h-1z`] : []))).join('');
  span.innerHTML = `<svg width="${lado}" height="${lado}" viewBox="0 0 12 12" fill="currentColor" shape-rendering="crispEdges"><path d="${cuadros}"/></svg>`;
  return span;
}
