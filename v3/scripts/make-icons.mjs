// Genera el ícono de la app (1024×1024) y la pantalla de carga (2732×2732) con Chromium.
// Uso: NODE_PATH=$(npm root -g) node scripts/make-icons.mjs  (luego se quita el canal alfa con Python/PIL)
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const out = 'ios/App/App/Assets.xcassets';

// Completo italiano dibujado con CSS (vectorial, nítido a cualquier tamaño).
const completo = (scale) => `
<div style="position:relative;width:${760 * scale}px;height:${420 * scale}px;transform:rotate(-14deg)">
  <div style="position:absolute;left:0;right:0;top:${70 * scale}px;height:${230 * scale}px;border-radius:999px;
    background:linear-gradient(180deg,#e9a85a,#c9792f)"></div>
  <div style="position:absolute;left:${-30 * scale}px;right:${-30 * scale}px;top:${120 * scale}px;height:${110 * scale}px;border-radius:999px;
    background:linear-gradient(180deg,#d4683c,#97391d)"></div>
  <div style="position:absolute;left:${40 * scale}px;right:${40 * scale}px;top:${150 * scale}px;height:${70 * scale}px;border-radius:999px;
    background:radial-gradient(circle,#ff7a66 40%,#e53935 42%) 0 0/${76 * scale}px ${70 * scale}px"></div>
  <div style="position:absolute;left:${50 * scale}px;right:${50 * scale}px;top:${110 * scale}px;height:${62 * scale}px;border-radius:999px;
    background:linear-gradient(180deg,#a5d65a,#6aa232)"></div>
  <div style="position:absolute;left:${60 * scale}px;right:${60 * scale}px;top:${70 * scale}px;height:${62 * scale}px;border-radius:999px;
    background:radial-gradient(circle at 50% 100%,#fffdf2 ${30 * scale}px,transparent ${31 * scale}px) 0 0/${64 * scale}px ${62 * scale}px,
    linear-gradient(180deg,#fffaf0 55%,transparent 56%)"></div>
  <div style="position:absolute;left:0;right:0;top:${210 * scale}px;height:${200 * scale}px;border-radius:999px;
    background:linear-gradient(180deg,#f6c27d,#d9893c);box-shadow:inset 0 ${16 * scale}px 0 rgba(255,255,255,.3)"></div>
</div>`;

const drop = (size) => `<div style="width:${size}px;height:${size}px;background:#4fb3f6;border-radius:0 50% 50% 50%;
  transform:rotate(45deg);box-shadow:inset ${-size / 6}px ${-size / 6}px 0 rgba(0,0,0,.12)"></div>`;

const icon = `<html><body style="margin:0">
<div style="width:1024px;height:1024px;position:relative;overflow:hidden;
  background:radial-gradient(circle at 50% 45%,#ffd36b 0,#f4a62a 45%,#d7362b 100%)">
  <div style="position:absolute;left:0;right:0;top:0;height:170px;border-bottom:26px solid #f4a62a;
    background:repeating-linear-gradient(90deg,#d7362b 0 128px,#fff 128px 256px)"></div>
  <div style="position:absolute;left:310px;top:250px">${drop(70)}</div>
  <div style="position:absolute;left:620px;top:230px">${drop(90)}</div>
  <div style="position:absolute;left:470px;top:300px">${drop(52)}</div>
  <div style="position:absolute;left:132px;top:420px;filter:drop-shadow(0 28px 0 rgba(90,40,10,.3))">${completo(1)}</div>
</div></body></html>`;

const splash = `<html><body style="margin:0">
<div style="width:2732px;height:2732px;display:grid;place-items:center;background:#2b1a12">
  <div style="text-align:center;color:#fff4dc;font-family:-apple-system,sans-serif;font-weight:900">
    <div style="display:inline-block">${completo(1.4)}</div>
    <div style="font-size:150px;margin-top:40px">Completos Mojados</div>
  </div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
await page.setContent(icon);
await page.screenshot({ path: `${out}/AppIcon.appiconset/AppIcon-512@2x.png` });
await page.setViewportSize({ width: 2732, height: 2732 });
await page.setContent(splash);
for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  await page.screenshot({ path: `${out}/Splash.imageset/${name}` });
}
await browser.close();
