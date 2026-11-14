# Muni Talca

Juego gratuito para iPhone: gestionas la Municipalidad de Talca durante un mandato de cuatro años.
Mezcla de simulador de ciudad y de *time management*: despachas cuadrillas a los problemas de seis barrios,
construyes obras en los sitios eriazos y tomas decisiones (licitar o trato directo, Ley del Lobby,
transparencia, COSOC, presupuesto participativo...). Al final, Talca vota.

Cada decisión desbloquea una **ficha ciudadana** con lo que la ciudadanía puede exigirle a su municipio,
basada en leyes chilenas vigentes (20.285, 20.730, 19.886, 18.695, 20.500, 20.880).
Los personajes son ficticios y no representan a ninguna autoridad, persona ni partido real.

## Cómo funciona

- **Aprobación**: cada barrio vuelve a una base (`28 + 3,5 × obras`); arreglar rápido la sube y los reclamos la bajan.
- **Voto final**: `aprobación × (0,6 + 0,4 × transparencia) + 0,12 × participación`. La confianza multiplica:
  sin transparencia se pierde hasta el 40 % de los votos.
- Un mes dura 12 segundos; un mandato, unos 10 minutos más las decisiones.

## Estructura

- `src/engine/`: motor puro y testeable (`map.ts`, `content.ts` con cartas y fichas, `sim.ts` reglas, `bot.ts`).
- `src/render/`: pixel art dibujado en código con una sola paleta y grilla de 16 px.
- `src/ui/`: interfaz, música chiptune sintetizada con WebAudio y guardado local.
- `tests/`: tests del motor, incluida la calibración de dificultad con el bot.
- `scripts/icon.mjs`: genera el ícono y la pantalla de carga.

## Comandos

```bash
npm install
npm run dev            # jugar en el navegador
npm test               # tests y calibración
npm run build          # tipos y build de producción
npx tsx scripts/balance.ts   # tabla de victorias del bot por estilo de juego
```

## TestFlight

El flujo `.github/workflows/alcaldia-testflight.yml` compila y sube cada push a `main` o `claude/**`
que toque `alcaldia/`, con los mismos secretos de App Store Connect que Completos Mojados.
Identificador: `cl.munitalca.app`. La ficha de la app se crea una sola vez a mano en App Store Connect.
