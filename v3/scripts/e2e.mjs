// Prueba de punta a punta en Chromium con viewport de iPhone: recorre los menús y juega
// los 3 niveles tocando la interfaz real. Uso: node scripts/e2e.mjs [url] [carpeta-capturas]
import { createRequire } from 'node:module';

// Playwright viene instalado globalmente (NODE_PATH) en el entorno de pruebas.
const { chromium, devices } = createRequire(import.meta.url)('playwright');

const url = process.argv[2] ?? 'http://localhost:4173';
const shots = process.argv[3] ?? 'screenshots';
const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['iPhone 13'], browserName: undefined });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto(url);
await page.screenshot({ path: `${shots}/01-portada.png` });
await page.getByText('Cómo jugar').click();
await page.screenshot({ path: `${shots}/02-como-jugar.png` });
await page.getByText('Volver').click();
await page.getByText('¡Jugar!').click();
await page.screenshot({ path: `${shots}/03-niveles.png` });

// Decide la próxima acción (misma estrategia que src/engine/bot.ts) y devuelve qué tocar.
function decide() {
  const g = window.__cmGame;
  if (!g || g.finished) return null;
  const RECIPES = {
    italiano: ['tomate', 'palta', 'mayo'],
    completo: ['tomate', 'chucrut', 'mayo'],
    dinamico: ['tomate', 'palta', 'americana', 'mayo'],
    chacarero: ['tomate', 'poroto_verde', 'aji', 'mayo']
  };
  const burnt = g.grill.findIndex((s) => s.state === 'burnt');
  if (burnt >= 0) return { sel: '.grill-slot', idx: burnt };
  const seated = g.seats
    .map((id) => g.customers.find((c) => c.id === id))
    .filter((c) => c && c.state === 'seated')
    .sort((a, b) => a.patience - b.patience);
  const drinkIdx = (d) => g.level.drinks.indexOf(d);
  for (const c of seated) {
    if (c.gotCompleto && !c.gotDrink && c.drink) {
      return g.heldDrink !== c.drink ? { sel: '.drink', idx: drinkIdx(c.drink) } : { sel: '.seat', idx: c.seat };
    }
  }
  const needing = seated.filter((c) => !c.gotCompleto);
  const tray = g.tray;
  const trayRecipe = g.trayRecipe();
  if (trayRecipe) {
    const t = needing.find((c) => c.recipe === trayRecipe);
    if (t) {
      if (t.drink && !t.gotDrink && g.heldDrink !== t.drink) return { sel: '.drink', idx: drinkIdx(t.drink) };
      return { sel: '.seat', idx: t.seat };
    }
  }
  const target = needing[0];
  const active = g.grill.filter((s) => s.state === 'cooking' || s.state === 'ready').length;
  const empty = g.grill.findIndex((s) => s.state === 'empty');
  if (target) {
    if (!tray) return { sel: '.pan-btn', idx: 0 };
    if (!tray.vienesa) {
      const ready = g.grill.findIndex((s) => s.state === 'ready');
      if (ready >= 0) return { sel: '.grill-slot', idx: ready };
    } else {
      const want = RECIPES[target.recipe];
      if (tray.toppings.some((t) => !want.includes(t))) return { sel: '.trash-btn', idx: 0 };
      const missing = want.find((t) => !tray.toppings.includes(t));
      if (missing) return { sel: `.topping[data-topping="${missing}"]`, idx: 0 };
    }
  }
  if (empty >= 0 && active < Math.max(1, needing.length + g.queue.length)) return { sel: '.grill-slot', idx: empty };
  return null;
}

const results = [];
for (const level of [1, 2, 3]) {
  await page.locator('.level-card').nth(level - 1).click();
  await page.screenshot({ path: `${shots}/1${level}-intro-nivel-${level}.png` });
  await page.getByText('¡A trabajar!').click();
  await page.waitForFunction(() => !!window.__cmGame);

  let shot = false;
  const start = Date.now();
  while (!(await page.locator('.results').count())) {
    const action = await page.evaluate(decide);
    if (action) await page.locator(action.sel).nth(action.idx).click({ timeout: 2000, force: true }).catch(() => {});
    await page.waitForTimeout(300);
    if (!shot && Date.now() - start > 25000) {
      await page.screenshot({ path: `${shots}/2${level}-jugando-nivel-${level}.png` });
      shot = true;
    }
    if (Date.now() - start > 240000) throw new Error('El nivel no terminó');
  }
  await page.screenshot({ path: `${shots}/3${level}-resultado-nivel-${level}.png` });
  const text = await page.locator('.results').innerText();
  const won = await page.locator('.results.won').count();
  results.push({ level, won: !!won, summary: text.replace(/\n+/g, ' | ') });
  console.log(`Nivel ${level}: ${won ? 'GANADO' : 'perdido'} — ${text.replace(/\n+/g, ' | ')}`);
  await page.getByText('Niveles').click();
}

await page.screenshot({ path: `${shots}/40-niveles-final.png` });
console.log('Errores de consola:', errors.length ? errors : 'ninguno');
await browser.close();
if (errors.length || results.some((r) => !r.won)) process.exit(1);
