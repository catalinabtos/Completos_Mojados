// Uso: npx vite-node scripts/balance.ts  — imprime el rendimiento del bot por nivel.
import { LEVELS, starsFor } from '../src/engine/data';
import { simulate } from '../src/engine/bot';

for (const level of LEVELS) {
  for (const reaction of [0.5, 0.7, 0.9, 1.1, 1.3]) {
    const runs = Array.from({ length: 30 }, (_, i) => simulate(level, 1000 + i, reaction));
    const avg = (k: 'money' | 'served' | 'lost' | 'burnt') => runs.reduce((s, r) => s + r[k], 0) / runs.length;
    const wins = runs.filter((r) => r.won).length;
    const stars = runs.reduce((s, r) => s + starsFor(level, r.money), 0) / runs.length;
    console.log(
      `N${level.id} reacción ${reaction}s: gana ${wins}/30, dinero ${Math.round(avg('money'))} (meta ${level.goal}), estrellas ${stars.toFixed(1)}, servidos ${avg('served').toFixed(1)}, perdidos ${avg('lost').toFixed(1)}, quemadas ${avg('burnt').toFixed(1)}`
    );
  }
}
