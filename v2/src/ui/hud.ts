import type { Store } from '../core/store';
import type { RootState } from '../core/types';

function createStat(label: string) {
  const wrapper = document.createElement('div');
  wrapper.className = 'stat';

  const labelEl = document.createElement('span');
  labelEl.className = 'label';
  labelEl.textContent = label;

  const valueEl = document.createElement('span');
  valueEl.className = 'value';
  valueEl.textContent = '0';

  wrapper.append(labelEl, valueEl);
  return { wrapper, valueEl };
}

export interface HUDController {
  destroy(): void;
}

export function createHUD(root: HTMLElement, store: Store): HUDController {
  root.classList.add('hud');

  const moneyStat = createStat('Dinero');
  const goalStat = createStat('Meta');
  const comboStat = createStat('Combo');

  const feedbackEl = document.createElement('div');
  feedbackEl.className = 'feedback';
  document.body.appendChild(feedbackEl);

  const endPanel = document.createElement('div');
  endPanel.className = 'end-panel';
  const endContent = document.createElement('div');
  endContent.className = 'content';
  const endTitle = document.createElement('h2');
  endTitle.textContent = 'Meta alcanzada';
  const endStats = document.createElement('p');
  endContent.append(endTitle, endStats);
  endPanel.append(endContent);
  document.body.appendChild(endPanel);

  root.append(moneyStat.wrapper, goalStat.wrapper, comboStat.wrapper);

  let feedbackTimeout: number | null = null;

  const unsubscribe = store.subscribe((state) => {
    updateStats(state);
    updateTheme(state);
    updateFeedback(state);
    updateEndPanel(state);
  });

  function updateStats(state: RootState) {
    moneyStat.valueEl.textContent = `$${state.game.money.toFixed(0)}`;
    goalStat.valueEl.textContent = `$${state.game.goal.toFixed(0)}`;
    comboStat.valueEl.textContent = `${state.game.combo}x (${state.game.comboMultiplier.toFixed(2)}×)`;
  }

  function updateTheme(state: RootState) {
    if (state.settings.contrast === 'high') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }

  function updateFeedback(state: RootState) {
    if (!state.game.feedback) {
      return;
    }
    feedbackEl.textContent = state.game.feedback;
    feedbackEl.classList.add('show');
    if (feedbackTimeout) {
      window.clearTimeout(feedbackTimeout);
    }
    feedbackTimeout = window.setTimeout(() => {
      feedbackEl.classList.remove('show');
    }, 1200);
  }

  function updateEndPanel(state: RootState) {
    if (state.level.finished && state.level.goalAchieved) {
      endPanel.classList.add('show');
      endStats.textContent = `Dinero: $${state.game.money.toFixed(0)} · Combo máximo: ${state.game.stats.maxCombo}`;
    } else {
      endPanel.classList.remove('show');
    }
  }

  return {
    destroy() {
      unsubscribe();
      if (feedbackTimeout) {
        window.clearTimeout(feedbackTimeout);
      }
      feedbackEl.remove();
      endPanel.remove();
    }
  };
}
