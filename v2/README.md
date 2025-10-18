# Completos Mojados v2 (Web)

Este directorio contiene el MVP web de **Completos Mojados**, construido con Vite, TypeScript y PixiJS.

## Requisitos

- Node.js 18+
- npm 9+

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Estructura

- `public/` — HTML base y assets estáticos.
- `data/` — Configuración del juego en JSON (`recipes.json`, `levels.json`).
- `src/` — Código fuente TypeScript.
  - `core/` — Tipos compartidos, store y utilidades.
  - `game/` — Lógica del loop principal y escena Pixi.
  - `ui/` — HUD HTML y barra de ingredientes.

## Desarrollo

1. Instala dependencias con `npm install`.
2. Ejecuta `npm run dev` y abre `http://localhost:5173`.
3. Edita las recetas o niveles ajustando los archivos en `data/`.

## Deploy

`npm run build` genera la versión estática lista para GitHub Pages.
