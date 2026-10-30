# Completos Mojados — cómo se trabaja en este proyecto

Juego casual gratuito (tipo *time management*) sobre un carrito de completos de Talca, Chile.
Lo dirige Catalina Barrientos (directora creativa y productora) y lo construyen Claude y agentes.

## Antes de cualquier cambio, lee
- `docs/biblia-juego.md`: visión, pilares, reglas de diseño y lo que nunca se hace.
- `docs/biblia-arte.md`: paleta, trazo, tipografías y cómo se dibujan personajes y objetos.
- `docs/biblia-mundo.md`: Talca, el carrito, los personajes y el tono de los textos.

Si un pedido contradice una biblia, avisa a Catalina antes de hacerlo; no cambies las biblias por tu cuenta.

## Estructura
- `v3/`: el juego actual (Vite + TypeScript + Capacitor iOS). `v1/` y `v2/` son versiones antiguas: no tocarlas.
- `v3/src/engine/`: motor puro y testeable (`data.ts` niveles y recetas, `game.ts` reglas, `bot.ts` jugador automático).
- `v3/src/ui/`: interfaz DOM/CSS; arte en `v3/src/ui/art/` (SVG vectorial y WebP de Canva).
- `v3/tests/`: tests con vitest. `v3/scripts/e2e.mjs` juega los niveles en un navegador real.
- `docs/`: biblias y propuestas de diseño.
- `.claude/agents/`: agentes por rol (diseño, balance, narrativa, arte, QA).

## Comandos (desde `v3/`)
- `npm test`: tests del motor, incluida la calibración de dificultad de cada nivel.
- `npm run build`: chequeo de tipos y build de producción.
- `npx tsx scripts/balance.ts`: tabla de victorias del bot por nivel y velocidad de reacción.
- `NODE_PATH=$(npm root -g) node scripts/e2e.mjs <url> <carpeta>`: E2E con Playwright contra `npm run preview`.

Todo cambio debe dejar `npm test` y `npm run build` en verde.

## Qué requiere aprobación de Catalina
- Personajes nuevos o cambios a su apariencia o personalidad.
- Arte nuevo que se vea en pantalla (mostrar una captura antes de integrarlo).
- Historia, diálogos y nombres.
- Cambios a la economía o a la meta-progresión.
- Guardar o modificar diseños en su cuenta de Canva.
- Cualquier cosa que se publique fuera del repositorio.

Los cambios técnicos (errores, rendimiento, tests, refactor) no necesitan aprobación previa.

## Reglas fijas
- Idioma del juego: español de Chile, cálido y sin groserías.
- Nada sugerente ni de doble sentido en arte o textos (pasó con un logo anterior; hay que evitarlo siempre).
- Gratis y sin recolectar datos: sin cuentas, sin analítica de terceros, sin anuncios. El progreso se guarda solo en el dispositivo.
- La dificultad se calibra con el bot (`TARGET_REACTION` en `v3/tests/game.test.ts`): si cambias un nivel, el test debe seguir pasando.
- Preferir arte vectorial (SVG) para todo lo que se vea grande; nada de imágenes que se pixelen.
