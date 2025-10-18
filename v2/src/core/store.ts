import type { RootState } from './types';

type Listener = (state: RootState) => void;

export interface Store {
  getState(): RootState;
  set(partial: Partial<RootState>): void;
  update(updater: (state: RootState) => RootState): void;
  updateSlice<K extends keyof RootState>(key: K, updater: (slice: RootState[K]) => RootState[K]): void;
  subscribe(listener: Listener): () => void;
}

export function createStore(initialState: RootState): Store {
  let state: RootState = initialState;
  const listeners = new Set<Listener>();

  const notify = () => {
    listeners.forEach((listener) => listener(state));
  };

  return {
    getState() {
      return state;
    },
    set(partial) {
      state = { ...state, ...partial };
      notify();
    },
    update(updater) {
      state = updater(state);
      notify();
    },
    updateSlice(key, updater) {
      const current = state[key];
      const nextSlice = updater(current);
      if (nextSlice === current) return;
      state = { ...state, [key]: nextSlice } as RootState;
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}
