// Tabla de resultados del bot por estilo de juego: npx tsx scripts/balance.ts
import { playGame, type BotOptions } from '../src/engine/bot';

const styles: [string, BotOptions][] = [
  ['Sin tocar nada', { reaction: 0, honest: true, manage: false, idle: true }],
  ['Honesta, lenta (3 s), sin construir', { reaction: 3, honest: true, manage: false }],
  ['Honesta, 1,5 s, sin construir', { reaction: 1.5, honest: true, manage: false }],
  ['Honesta, lenta (3 s), gestiona', { reaction: 3, honest: true, manage: true }],
  ['Honesta, 1,5 s, gestiona', { reaction: 1.5, honest: true, manage: true }],
  ['Honesta, 0,7 s, gestiona', { reaction: 0.7, honest: true, manage: true }],
  ['Corrupta, 0,7 s, gestiona', { reaction: 0.7, honest: false, manage: true }],
  ['Corrupta, 1,5 s, gestiona', { reaction: 1.5, honest: false, manage: true }]
];

const N = 20;
for (const [name, o] of styles) {
  const rs = Array.from({ length: N }, (_, i) => playGame(1000 + i, o));
  const avg = (f: (r: (typeof rs)[0]) => number) => (rs.reduce((a, r) => a + f(r), 0) / N).toFixed(1);
  const wins = rs.filter((r) => r.vote > 50).length;
  console.log(
    `${name.padEnd(38)} gana ${String(wins).padStart(2)}/${N}  voto ${avg((r) => r.vote)}%  aprob ${avg((r) => r.approval)}  ` +
      `transp ${avg((r) => r.transparency)}  partic ${avg((r) => r.participation)}  arreglados ${avg((r) => r.fixed)}  ` +
      `reclamos ${avg((r) => r.expired)}  obras ${avg((r) => r.buildings)}  $${avg((r) => r.money)}`
  );
}
