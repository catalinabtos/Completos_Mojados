// Genera el ícono de la app (1024×1024) y la pantalla de carga (2732×2732) a partir de la mascota.
// Uso: NODE_PATH=$(npm root -g) node scripts/make-icons.mjs  (luego se quita el canal alfa con Python/PIL)
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const out = 'ios/App/App/Assets.xcassets';
const mascot = readFileSync('src/ui/art/mascota-feliz.svg', 'utf8');

const icon = `<html><body style="margin:0">
<div style="width:1024px;height:1024px;position:relative;overflow:hidden;
  background:radial-gradient(circle at 50% 55%,#ffd36b 0,#f4a62a 48%,#d7362b 100%)">
  <div style="position:absolute;left:0;right:0;top:0;height:150px;
    background:repeating-linear-gradient(90deg,#d7362b 0 128px,#fff 128px 256px);
    -webkit-mask:radial-gradient(circle at 64px 86px,#000 64px,transparent 65px) 0 0/128px 150px repeat-x,
      linear-gradient(#000,#000) 0 0/100% 86px no-repeat;
    -webkit-mask-composite:source-over"></div>
  <div style="position:absolute;left:92px;right:92px;top:210px;filter:drop-shadow(0 26px 0 rgba(90,40,10,.28))">${mascot}</div>
</div></body></html>`;

const splash = `<html><body style="margin:0">
<div style="width:2732px;height:2732px;display:grid;place-items:center;
  background:radial-gradient(circle at 50% 45%,#ffd36b 0,#f4a62a 45%,#d7362b 100%)">
  <div style="text-align:center;color:#fff4dc;font-family:-apple-system,sans-serif;font-weight:900">
    <div style="width:1100px;margin:0 auto">${mascot}</div>
    <div style="font-size:170px;margin-top:40px;text-shadow:0 12px 0 #7a4a22">Completos Mojados</div>
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
