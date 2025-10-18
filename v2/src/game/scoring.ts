import type { Ingredient, OrderDTO, OrderSlice, RecipesData } from '../core/types';

export interface MatchResult {
  match: number;
  missing: Ingredient[];
  extra: Ingredient[];
  beveragePenalty: boolean;
  perfect: boolean;
}

function countOccurrences(list: Ingredient[]): Map<Ingredient, number> {
  const map = new Map<Ingredient, number>();
  for (const item of list) {
    map.set(item, (map.get(item) ?? 0) + 1);
  }
  return map;
}

export function evaluateMatch(
  expected: OrderDTO,
  actual: OrderSlice,
  recipes: RecipesData
): MatchResult {
  const expectedIngredients = [...recipes.base, ...expected.ingredients];
  const actualIngredients = actual.ingredients;

  const expectedCounts = countOccurrences(expectedIngredients);
  const actualCounts = countOccurrences(actualIngredients);

  const missing: Ingredient[] = [];
  for (const [ingredient, count] of expectedCounts) {
    const actualCount = actualCounts.get(ingredient) ?? 0;
    if (actualCount < count) {
      for (let i = 0; i < count - actualCount; i += 1) {
        missing.push(ingredient);
      }
    }
  }

  const extra: Ingredient[] = [];
  for (const [ingredient, count] of actualCounts) {
    const expectedCount = expectedCounts.get(ingredient) ?? 0;
    if (count > expectedCount) {
      for (let i = 0; i < count - expectedCount; i += 1) {
        extra.push(ingredient);
      }
    }
  }

  let beveragePenalty = false;
  const expectedBeverage = expected.beverage ?? null;
  const actualBeverage = actual.beverage ?? null;

  if (expectedBeverage && expectedBeverage !== actualBeverage) {
    beveragePenalty = true;
  }
  if (!expectedBeverage && actualBeverage) {
    beveragePenalty = true;
  }

  let match = 1;
  match -= missing.length * 0.1;
  match -= extra.length * 0.1;
  if (beveragePenalty) {
    match -= 0.1;
  }
  match = Math.max(0, Math.min(1, match));

  const perfect = missing.length === 0 && extra.length === 0 && !beveragePenalty;

  return {
    match,
    missing,
    extra,
    beveragePenalty,
    perfect
  };
}

export function calculateScore(match: number, patienceRatio: number, comboMultiplier: number): number {
  const baseScore = 10;
  const score = baseScore * match * patienceRatio * comboMultiplier;
  return Math.round(Math.max(score, 0));
}

export function getComboMultiplier(combo: number): number {
  return 1 + Math.min(combo * 0.05, 1);
}

export function advanceCombo(combo: number, wasPerfect: boolean): { combo: number; multiplier: number } {
  const nextCombo = wasPerfect ? combo + 1 : 0;
  const multiplier = getComboMultiplier(nextCombo);
  return { combo: nextCombo, multiplier };
}
