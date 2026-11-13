// Genera el ícono (1024 × 1024) y la pantalla de carga (2732 × 2732) desde un dibujo de 32 × 32.
// Uso: node scripts/icon.mjs <carpeta de salida para la vista previa (opcional)>
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const W = 32;
const art = Array.from({ length: W }, () => Array(W).fill('#7fc6e8'));
const rect = (x, y, w, h, c) => {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < W && j < W) art[j][i] = c;
};
const px = (x, y, c) => rect(x, y, 1, 1, c);

const K = '#2b2135';
// cielo en franjas
rect(0, 0, 32, 6, '#6fbbe3');
rect(0, 6, 32, 6, '#86cbec');
rect(0, 12, 32, 6, '#a3d9f1');
// sol
rect(3, 3, 5, 5, '#f4d25a');
rect(4, 2, 3, 7, '#f4d25a');
rect(2, 4, 7, 3, '#f4d25a');
px(4, 4, '#fff0a0');
// cordillera
for (let x = 0; x < 32; x++) {
  const h = Math.round(3 + 2 * Math.sin(x * 0.55) + 1.5 * Math.sin(x * 1.3));
  rect(x, 17 - h, 1, h, '#8d8db0');
  if (h > 4) px(x, 17 - h, '#ffffff');
}
// casas de fachada continua abajo
const walls = ['#f7c9c9', '#fbe7a1', '#c6e2f0', '#cfe8c4', '#f0dcb8', '#e8d0ef'];
for (let i = 0; i < 6; i++) {
  const x = i * 6 - 2;
  rect(x, 23, 6, 3, '#cf5a3e');
  for (let xx = x; xx < x + 6; xx += 2) px(xx, 24, '#9b3a2c');
  rect(x, 26, 6, 1, K);
  rect(x, 27, 6, 5, walls[i]);
  rect(x + 1, 28, 2, 4, K);
  rect(x + 4, 28, 1, 2, '#5fb0e0');
}
// Municipalidad al centro
rect(7, 12, 18, 1, K);
rect(7, 13, 18, 3, '#cf5a3e');
for (let x = 8; x < 25; x += 3) px(x, 14, '#9b3a2c');
rect(12, 9, 8, 3, '#fff8ec');
rect(13, 8, 6, 1, '#fff8ec');
rect(12, 8, 1, 1, K);
rect(19, 8, 1, 1, K);
rect(13, 7, 6, 1, K);
rect(11, 9, 1, 3, K);
rect(20, 9, 1, 3, K);
px(15, 10, '#f4d25a');
px(16, 10, '#f4d25a');
rect(6, 13, 1, 13, K);
rect(25, 13, 1, 13, K);
rect(7, 16, 18, 1, K);
rect(7, 17, 18, 9, '#fff8ec');
for (let x = 8; x < 25; x += 4) rect(x, 17, 1, 9, '#e6d9c6');
for (const x of [9, 13, 18, 22]) {
  rect(x, 19, 2, 3, K);
  px(x, 20, '#b4e4f6');
}
rect(14, 21, 4, 5, K);
rect(15, 22, 2, 4, '#9a6a43');
rect(6, 26, 20, 1, K);
// bandera de Chile
rect(24, 1, 1, 12, K);
rect(25, 1, 2, 2, '#3a78b8');
px(25, 1, '#ffffff');
rect(27, 1, 4, 2, '#ffffff');
rect(25, 3, 6, 2, '#e04a4a');
// globo con corazón (los problemas del juego)
rect(1, 9, 6, 6, '#ffffff');
rect(0, 10, 8, 4, '#ffffff');
rect(1, 8, 6, 1, K);
rect(1, 15, 6, 1, K);
rect(-1, 10, 1, 4, K);
rect(8, 10, 1, 4, K);
px(0, 9, K); px(7, 9, K); px(0, 14, K); px(7, 14, K);
rect(3, 16, 2, 1, K);
px(3, 15, '#ffffff'); px(4, 15, '#ffffff');
px(2, 10, '#e04a4a'); px(5, 10, '#e04a4a');
rect(1, 11, 6, 1, '#e04a4a');
rect(2, 12, 4, 1, '#e04a4a');
rect(3, 13, 2, 1, '#e04a4a');
px(1, 10, '#e04a4a'); px(6, 10, '#e04a4a');

// ── PNG ─────────────────────────────────────────────────────────────────────
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
}
function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]);
}
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

const icon = png(1024, (x, y) => hex(art[Math.floor(y / 32)][Math.floor(x / 32)]));
const iconDir = join(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');
writeFileSync(join(iconDir, 'AppIcon-512@2x.png'), icon);

// Pantalla de carga: fondo oscuro con el dibujo al centro, a 16 px por píxel.
const S = 2732, cell = 16, off = Math.floor((S - W * cell) / 2);
const bg = hex('#2b2135');
const splash = png(S, (x, y) => {
  const ax = Math.floor((x - off) / cell), ay = Math.floor((y - off) / cell);
  return ax >= 0 && ay >= 0 && ax < W && ay < W ? hex(art[ay][ax]) : bg;
});
const splashDir = join(root, 'ios/App/App/Assets.xcassets/Splash.imageset');
for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) writeFileSync(join(splashDir, f), splash);

const preview = process.argv[2];
if (preview) {
  mkdirSync(preview, { recursive: true });
  writeFileSync(join(preview, 'icono.png'), png(256, (x, y) => hex(art[Math.floor(y / 8)][Math.floor(x / 8)])));
}
console.log('Ícono y pantalla de carga listos.');
