# Biblia de arte — estilo "Pixel de barrio"

> Documento vivo. Todo arte nuevo se muestra a Catalina antes de integrarse.
> El detalle para producir el arte está en `docs/guia-estilo-visual.md`.
> Referencias de Catalina: [board de Pinterest](https://cl.pinterest.com/catalinabtos/completos-mojados/).

## Idea visual
**Pixel art acogedor, con Talca adentro.** Todo el juego es pixel art: fondos, personajes, mascota, ingredientes, estaciones e interfaz. La sensación es la de un juego tranquilo de barrio: colores cálidos y suaves, detalle pequeño y ordenado, y personajes que se reconocen por lo que llevan puesto.

Tres reglas para decidir cualquier duda:
1. **Cada píxel se elige.** Si un detalle no ayuda a reconocer el lugar o a la persona, se va.
2. **Talca, no "un pueblo cualquiera".** Mejor un detalle real y modesto que diez genéricos.
3. **Todo sale de la misma grilla.** Mismo tamaño de píxel y misma paleta en todas las piezas.

## Reglas del píxel
- Todos los píxeles de una pieza miden lo mismo. Nada de píxeles mezclados, rotados ni medios píxeles.
- Sin borde borroso ni antialias de imagen reducida: cada píxel tiene un color exacto.
- El juego muestra el arte sin suavizado (`image-rendering: pixelated`).
- Sin degradados ni transparencias parciales. La luz se resuelve con 2 o 3 tonos por color.

## Paleta
Una sola paleta para todo el juego, de 32 colores como máximo, definida en la guía de estilo. Parte de estos colores, que también son tokens de `v3/src/ui/styles.css`:

| Token | Color | Uso |
|---|---|---|
| `--cafe` | `#4a2511` | Contornos, texto principal, sombras duras |
| `--mayo` | `#fff4dc` | Fondos claros, tarjetas, botones secundarios |
| `--mostaza` | `#f4a62a` | Portada, acentos, metas |
| `--tomate` | `#e2412f` | Botón principal, toldo, alertas |
| `--palta` | `#5fa83a` | Éxito, paciencia alta |
| `--vienesa` | `#e0664c` | Vienesas, acentos cálidos |
| `--agua` | `#6ec3ee` | Olla, hielera, frío |
| `--noche` | `#1f2a44` | Niveles de noche y tormenta |

## Personajes
- De la cintura hacia arriba, porque el mesón tapa el resto. Vista de frente o tres cuartos.
- Cabeza grande, contorno oscuro y rasgos propios: lentes, gorros, peinados y ropa identifican a cada persona de un vistazo.
- Nivel de detalle medio: suficiente para distinguir a los clientes, sin llegar a retrato.
- Cada cliente tiene **tres caras**: normal, impaciente (cejas fruncidas, boca recta) y enojado (ceño marcado, boca hacia abajo). Son el mismo dibujo y solo cambia la expresión. El enojo es de caricatura, nunca agresivo.
- Diversidad real de Talca: edades, tonos de piel, cuerpos.

### Mascota
El completo sonriente se redibuja en pixel art sin perder lo que lo identifica: italiano con tomate en cubos, palta, mayo en zigzag, vienesa, pan con cara y manitos redondas. Versiones: feliz, celebra y preocupada.

## Fondos
- **Vista lateral:** los clientes están detrás del mesón, de frente al jugador, y la calle se ve atrás. No se usa vista desde arriba.
- Colores más suaves que los personajes, para que clientes y globos resalten.
- Lo que identifica el lugar va en la zona baja y el suelo queda despejado.

## Interfaz y tipografías
- Botones, globos, íconos y barras también son pixel art: esquinas escalonadas y bordes de un solo tamaño de píxel.
- Tipografía pixelada: Jersey 15, con tildes, ñ y signos ¿ ¡. Debe leerse sin esfuerzo a tamaño de teléfono.

## Formatos
- **PNG** sin suavizado para todo el arte, en su tamaño real de píxeles. El juego lo amplía.
- Los tamaños de cada pieza están en la guía de estilo.
- SVG, WebP de Canva y JPG actuales quedan como transición hasta tener el arte nuevo.

## Fondos con fotografía real (en pausa)
Catalina reevaluará las fotos más adelante. Si se retoman, deben convertirse a la grilla y paleta del juego o contrastar de forma intencional. Preferir fotos propias; si son de terceros, usar licencias libres y guardar autor y licencia. Sin logos, caras reconocibles ni patentes legibles.

## Lo que no se hace
- Nada sugerente: formas, gotas o salsas que puedan leerse con doble sentido (por eso la mayo es frasco con cuchara, no pomo).
- Falso pixel art: píxeles de distintos tamaños, bordes borrosos, degradados suaves, reflejos de plástico o exceso de detalle fino.
- Texto inventado dentro de las imágenes, manos con dedos raros.
- Logos o marcas reales (bebidas, equipos de fútbol): se usan colores, no escudos.
- Imitar el estilo de artistas vivos o copiar personajes de otros juegos.
