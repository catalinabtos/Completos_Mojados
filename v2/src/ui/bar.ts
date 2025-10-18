import type { Store } from '../core/store';
import type { RecipesData, RootState } from '../core/types';
import { addIngredient, clearBeverage, createEmptyOrder, setBeverage, undo } from '../game/order';

export interface BarController {
  destroy(): void;
}

export function createBar(root: HTMLElement, store: Store, recipes: RecipesData): BarController {
  root.classList.add('bar');

  const baseGroup = createGroup('Base');
  const toppingsGroup = createGroup('Toppings');
  const beveragesGroup = createGroup('Bebidas');
  const controlsGroup = createGroup('Acciones');

  root.append(baseGroup.wrapper, toppingsGroup.wrapper, beveragesGroup.wrapper, controlsGroup.wrapper);

  const ingredientButtons = new Map<string, HTMLButtonElement>();
  const beverageButtons = new Map<string, HTMLButtonElement>();

  for (const ingredient of recipes.base) {
    const label = capitalize(ingredient);
    const button = createButton(label, () => pushIngredient(ingredient));
    baseGroup.container.append(button);
    ingredientButtons.set(ingredient, button);
  }

  const unsubscribe = store.subscribe((state) => {
    refreshToppings(state);
    refreshBeverages(state);
    refreshTheme(state);
    updateActiveButtons(state);
  });

  const undoButton = createButton('Deshacer', () => {
    store.update((prev) => ({
      ...prev,
      order: undo(prev.order)
    }));
  });
  const discardButton = createButton('Descartar', () => {
    store.update((prev) => ({
      ...prev,
      order: createEmptyOrder()
    }));
  });
  controlsGroup.container.append(undoButton, discardButton);

  function pushIngredient(ingredient: string) {
    store.update((prev) => ({
      ...prev,
      order: addIngredient(prev.order, ingredient)
    }));
  }

  function refreshToppings(state: RootState) {
    toppingsGroup.container.innerHTML = '';
    const config = state.level.config;
    if (!config) return;
    for (const ingredient of config.toppings_enabled) {
      const label = capitalize(ingredient);
      const button = ingredientButtons.get(ingredient) ?? createButton(label, () => pushIngredient(ingredient));
      ingredientButtons.set(ingredient, button);
      button.textContent = label;
      toppingsGroup.container.append(button);
    }
  }

  function refreshBeverages(state: RootState) {
    beveragesGroup.container.innerHTML = '';
    if (!state.level.config?.beverages_enabled) {
      beveragesGroup.wrapper.style.display = 'none';
      return;
    }
    beveragesGroup.wrapper.style.display = '';
    for (const beverage of recipes.bebidas) {
      const label = capitalize(beverage);
      let button = beverageButtons.get(beverage);
      if (!button) {
        button = createButton(label, () => toggleBeverage(beverage));
        beverageButtons.set(beverage, button);
      }
      button.textContent = label;
      beveragesGroup.container.append(button);
    }
  }

  function toggleBeverage(beverage: string) {
    store.update((prev) => {
      const current = prev.order.beverage === beverage ? null : beverage;
      return {
        ...prev,
        order: current ? setBeverage(prev.order, current) : clearBeverage(prev.order)
      };
    });
  }

  function refreshTheme(state: RootState) {
    if (state.settings.contrast === 'high') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }

  function updateActiveButtons(state: RootState) {
    for (const [ingredient, button] of ingredientButtons) {
      button.classList.toggle('active', state.order.ingredients.includes(ingredient));
    }
    for (const [beverage, button] of beverageButtons) {
      button.classList.toggle('active', state.order.beverage === beverage);
    }
  }

  return {
    destroy() {
      unsubscribe();
      root.innerHTML = '';
    }
  };
}

function createGroup(title: string) {
  const wrapper = document.createElement('div');
  const heading = document.createElement('strong');
  heading.textContent = title;
  heading.style.width = '100%';
  heading.style.display = 'block';
  heading.style.marginBottom = '6px';

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexWrap = 'wrap';
  container.style.gap = '8px';

  wrapper.append(heading, container);
  return { wrapper, container };
}

function createButton(label: string, onClick: () => void) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

function capitalize(input: string) {
  return input.charAt(0).toUpperCase() + input.slice(1).replace(/_/g, ' ');
}
