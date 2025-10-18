export type RNG = () => number;

export function createRng(seed = Date.now()): RNG {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted<T>(entries: [T, number][], rng: RNG): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  const roll = rng() * (total || 1);
  let acc = 0;
  for (const [value, weight] of entries) {
    acc += weight;
    if (roll <= acc) {
      return value;
    }
  }
  return entries[entries.length - 1][0];
}
