import { beforeEach, describe, expect, it, vi } from 'vitest';

const native = vi.hoisted(() => ({ store: new Map<string, string>(), broken: false }));

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: async ({ key }: { key: string }) => {
      if (native.broken) throw new Error('sin plugin');
      return { value: native.store.get(key) ?? null };
    },
    set: async ({ key, value }: { key: string; value: string }) => {
      if (native.broken) throw new Error('sin plugin');
      native.store.set(key, value);
    }
  }
}));

import { loadSave, parseSave, writeSave } from '../src/ui/storage';

const KEY = 'completos-mojados-save-v1';
const local = new Map<string, string>();
const saved = (wallet: number) => JSON.stringify({ ...parseSave(null), wallet });

describe('guardado', () => {
  beforeEach(() => {
    native.store.clear();
    native.broken = false;
    local.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => local.get(key) ?? null,
      setItem: (key: string, value: string) => local.set(key, value)
    });
  });

  it('trae el progreso de localStorage al almacenamiento nativo', async () => {
    local.set(KEY, saved(5000));
    expect((await loadSave()).wallet).toBe(5000);
    expect(JSON.parse(native.store.get(KEY)!).wallet).toBe(5000);
  });

  it('el progreso sobrevive si iOS borra localStorage', async () => {
    writeSave({ ...parseSave(null), wallet: 7000 });
    await Promise.resolve();
    local.clear();
    expect((await loadSave()).wallet).toBe(7000);
  });

  it('el almacenamiento nativo manda sobre la copia antigua', async () => {
    native.store.set(KEY, saved(9000));
    local.set(KEY, saved(100));
    expect((await loadSave()).wallet).toBe(9000);
  });

  it('sin plugin nativo sigue funcionando con localStorage', async () => {
    native.broken = true;
    writeSave({ ...parseSave(null), wallet: 300 });
    expect((await loadSave()).wallet).toBe(300);
  });

  it('quien había apagado el sonido sigue sin música', () => {
    expect(parseSave(JSON.stringify({ sound: false })).music).toBe(false);
    expect(parseSave(JSON.stringify({ sound: true })).music).toBe(true);
    expect(parseSave(null).music).toBe(true);
  });

  it('parte de cero sin nada guardado', async () => {
    expect((await loadSave()).wallet).toBe(0);
  });
});
