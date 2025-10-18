import type { Beverage, Ingredient, OrderDTO, OrderSlice, RecipesData } from '../core/types';

export function createEmptyOrder(): OrderSlice {
  return {
    ingredients: [],
    beverage: null,
    history: []
  };
}

export function addIngredient(order: OrderSlice, ingredient: Ingredient): OrderSlice {
  return {
    ...order,
    ingredients: [...order.ingredients, ingredient],
    history: [...order.history, { type: 'ingredient', value: ingredient }]
  };
}

export function setBeverage(order: OrderSlice, beverage: Beverage): OrderSlice {
  if (order.beverage === beverage) {
    return order;
  }
  return {
    ...order,
    beverage,
    history: beverage
      ? [...order.history, { type: 'beverage', value: beverage }]
      : order.history
  };
}

export function clearBeverage(order: OrderSlice): OrderSlice {
  if (!order.beverage) return order;
  return {
    ...order,
    beverage: null,
    history: [...order.history, { type: 'beverage', value: order.beverage }]
  };
}

export function undo(order: OrderSlice): OrderSlice {
  if (order.history.length === 0) {
    return order;
  }
  const history = order.history.slice(0, -1);
  const last = order.history[order.history.length - 1];
  if (last.type === 'ingredient') {
    const index = order.ingredients.lastIndexOf(last.value);
    if (index >= 0) {
      const nextIngredients = order.ingredients.slice();
      nextIngredients.splice(index, 1);
      return {
        ingredients: nextIngredients,
        beverage: order.beverage,
        history
      };
    }
  }
  if (last.type === 'beverage') {
    return {
      ingredients: order.ingredients,
      beverage: null,
      history
    };
  }
  return { ...order, history };
}

export function discard(): OrderSlice {
  return createEmptyOrder();
}

export function toOrderDTO(order: OrderSlice): OrderDTO {
  const dto: OrderDTO = {
    ingredients: [...order.ingredients]
  };
  if (order.beverage) {
    dto.beverage = order.beverage;
  }
  return dto;
}

export function describeOrder(order: OrderSlice, recipes: RecipesData): string {
  const base = recipes.base.join(' + ');
  const toppings = order.ingredients.join(', ');
  const beverage = order.beverage ? ` con bebida ${order.beverage}` : '';
  return toppings ? `${base} + ${toppings}${beverage}` : `${base}${beverage}`;
}
