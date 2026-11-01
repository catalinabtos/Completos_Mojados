# Guía de estilo visual — pixel art

> **Estado: dirección aprobada por Catalina** (31-10-2026), reflejada en `docs/biblia-arte.md`. Reemplaza a la dirección anterior, "Letrero de feria".
> Alcance: todo el juego. Fondos, personajes, mascota, ingredientes, estaciones e interfaz.
> Referencias: [board de Pinterest de Catalina](https://cl.pinterest.com/catalinabtos/completos-mojados/). Sirven de guía de sensación; no se copian piezas.

## 1. Qué tomamos del board

| Referencia | Qué tomamos | Qué dejamos |
|---|---|---|
| Chica con audífonos y notebook | **Nivel de detalle de los personajes** | Cuerpo entero: el mesón lo tapa |
| Chica con overol | Claridad de la silueta | Es demasiado simple para ocho clientes |
| Chica con gorro y parka | Calidez de los colores | Exceso de detalle |
| Sprout Valley, árboles y huerto | **Vista lateral y suavidad de los fondos** | Texto del logo |
| Juego de jardín en vertical | **Interfaz, íconos y globos** | Vista desde arriba |
| Ruinas verdes y fuente con ranas | Paleta y agua | Vista desde arriba |

## 2. Pixel art verdadero o falso

Lo que más delata una imagen generada no es el estilo, sino la grilla.

| Señal de falso pixel art | Regla |
|---|---|
| Píxeles de tamaños distintos en la misma imagen | Una sola grilla; se revisa con zoom |
| Bordes borrosos o a medio tono | Cada píxel tiene un color exacto de la paleta |
| Degradados suaves | 2 o 3 tonos por color, con borde neto |
| Cientos de colores | Solo la paleta común |
| Detalle fino sin sentido | Cada píxel debe significar algo |
| Todo con la misma importancia | Un foco por imagen |
| Cara genérica de ojos enormes | Forma propia de cabeza, cejas y nariz |
| Reflejos de plástico | Máximo un punto de luz por ojo |
| Texto falso, logos o manos raras | Sin texto ni logos; encuadres sin manos si se puede |

## 3. Paleta común

Máximo 32 colores para todo el juego. Punto de partida, a ajustar con la primera prueba:

- **Cafés y piel:** `#2b1a12`, `#4a2511`, `#7a4a2a`, `#b0764a`, `#e0a878`, `#f6cfa8`
- **Claros y tierra:** `#fff4dc`, `#f0dcb4`, `#d9b98a`, `#b98f62`
- **Cálidos:** `#f4a62a`, `#e2412f`, `#a82a22`, `#e0664c`, `#d98a63`
- **Verdes:** `#d3e08f`, `#9dbb72`, `#5fa83a`, `#3f7d22`, `#245238`
- **Azules:** `#e3f4fc`, `#bfe0ea`, `#6ec3ee`, `#3b7fb8`, `#46567a`, `#2c3a58`, `#1f2a44`
- **Acentos:** `#f59a8a`, `#c86a8a`, `#d8c58f`, `#c9cfd6`, `#ffffff`

Los fondos usan los tonos claros y apagados; el contorno oscuro y los colores más intensos quedan para personajes e interfaz.

## 4. Personajes

### Cómo se hacen
- **Referencia:** el elenco de píxel grande aprobado por Catalina el 31-10-2026 (`docs/pruebas-pixel/elenco-pixel-grande.png`), que acompaña al fondo del CREA de 62 × 92.
- **Lienzo:** unos 30 × 36 px, fondo transparente, de la cintura hacia arriba y cortado recto en el borde inferior. Benja, más bajo. El tamaño exacto sale de la grilla de cada imagen, no se impone.
- **Detalle:** poco. Ojos de 1 o 2 píxeles, boca simple, colores planos, sin arrugas ni texturas.
- **Tamaño en pantalla:** en un iPhone de 3×, cada píxel del cliente mide 10 píxeles reales y cada píxel del fondo mide 20.
- **Contorno:** 1 px oscuro; más claro hacia la luz si ayuda.
- **Silueta:** debe distinguirse al tamaño más chico del juego. Si tapada de negro no se reconoce, se rediseña.
- **Las tres caras:** mismo dibujo, cambian solo cejas, ojos y boca.

### El elenco

| Personaje | Archivo | Silueta y rasgos |
|---|---|---|
| Doña Rosa | `abuelita` | Moño alto, lentes redondos, chal tejido |
| Javi | `estudiante` | Cola de caballo, polerón y mochila, levemente despeinada |
| Don Lucho | `hincha` | Gorro y bufanda **rojo y negro**, barba tupida, sin escudo |
| Pato | `trabajador` | Casco amarillo y chaleco reflectante, cara ancha |
| Sr. Fuenzalida | `oficinista` | Lentes rectangulares, corbata, peinado de lado |
| Señora Marta | `casera` | Pañoleta verde y delantal |
| Benja | `nino` | Gorro azul, cara redonda, más bajo dentro del cuadro |
| Don Hernán | `huaso` | Chupalla y manta, bigote tranquilo |
| Abuela Teresa (nueva) | `teresa` | Pendiente de diseño; requiere aprobación de Catalina |

Don Lucho es un error actual a corregir: hoy va de rojo y blanco, y Rangers es rojinegro.

## 5. Fondos

- **Lienzo:** unos 62 × 92 px, vertical, como el fondo del CREA aprobado.
- **Vista lateral**, con tres planos: lejos (casi una sola masa), medio (el lugar) y cerca (un elemento que enmarca).
- **Sin personas**, salvo siluetas lejanas.
- **Sin lluvia ni clima pintados:** los agrega el juego.
- **Sin letreros legibles, logos ni imágenes religiosas reconocibles.**

### Dónde va cada cosa
El juego alinea el fondo abajo y recorta. En pantallas bajas solo queda a la vista el **38 % inferior**.

```
┌──────────────────────┐
│ Cielo, techos:       │  58–62 % superior: solo en teléfonos altos.
│ puede perderse       │  Nada importante aquí.
├──────────────────────┤
│ EL LUGAR             │  14–38 % desde abajo: lo que identifica la esquina.
│ se reconoce aquí     │  Debe caber en el 90 % central del ancho.
├──────────────────────┤
│ Suelo tranquilo      │  14 % inferior: aquí van clientes y mesón.
└──────────────────────┘  Sin nada que compita.
```

### Las 10 esquinas

| N.º | Esquina | Momento | Lo que debe reconocerse |
|---|---|---|---|
| 1 | 5 Oriente con 2 Sur | Mediodía | Esquina de barrio: fachada continua, poste con cables |
| 2 | Plaza de Armas | Almuerzo | Árboles grandes, bancas, pileta. [verificar elementos reales] |
| 3 | CREA | Sábado en la mañana | Galpón techado, cajones de fruta en masas de color |
| 4 | Universidad de Talca | Tarde | Edificio del campus entre árboles. [verificar cuál] |
| 5 | Estación de Talca | Mañana | Andén y línea hacia Constitución. Tren sin marcas |
| 6 | Estadio Fiscal | Día de partido | Tribuna y focos, banderas rojinegras sin escudo |
| 7 | Costanera del Río Claro | Tarde de verano | Río, baranda, cerros bajos |
| 8 | Temporal en 1 Sur | Noche | Calle mojada, faroles, fachadas oscuras |
| 9 | Fiestas Patrias | Noche de ramada | Ramada, banderitas, faroles |
| 10 | Feria del Completo | Noche de fiesta | Toldos, guirnaldas de luces, gran fila de mesas |

## 6. Tamaños de todo el arte

| Pieza | Tamaño en píxeles | Cantidad |
|---|---|---|
| Fondos | Unos 62 × 92 | 10 |
| Clientes | Unos 30 × 36 | 8 × 3 caras = 24, más Teresa |
| Mascota | 64 × 64 | 3 |
| Ingredientes y bebidas | 24 × 24 | 10 |
| Olla, vaporera y estados de vienesa y pan | Según diseño | Por definir |
| Completo por capas de la tabla | Según diseño | Por definir |
| Mejoras y decoración del carrito | 32 × 32 | 13 |

Formato: PNG en su tamaño real, sin ampliar ni suavizar. Se revisa al integrar que cada pieza se vea a un múltiplo entero, para que todos los píxeles midan igual en el teléfono.

## 7. Si se usa un generador de imágenes

1. **Desde cero:** nunca se convierte arte antiguo. Se genera con piezas aprobadas como referencia y pidiendo colores neutros, sin tinte amarillo.
2. **Alta resolución:** la imagen se coloca a tamaño original en la hoja de Canva del proyecto y se exporta en PNG sin pérdida. El conector solo entrega miniaturas de 200 px, que no sirven.
3. **Grilla:** se recupera la grilla real de cada imagen y se revisa a la vista, comparando varias medidas. No se fuerza un tamaño, porque eso deforma las caras.
4. **Prueba en el juego:** toda pieza se mira en una captura real antes de aprobarla.
5. **Caras:** se editan desde la normal, no se generan de nuevo.

### Texto base para personajes

```
Very low resolution chunky pixel art sprite, only 32 pixels tall and 32 pixels wide, with
huge square pixels on one strict grid, same style as the reference characters.
[PERSONAJE], waist-up, front view. Very simple: eyes are 1 or 2 dark pixels, flat colors,
maximum 12 colors, 1 pixel dark outline, no texture, no wrinkles, no anti-aliasing.
Clean neutral colors, no yellow tint. Plain white background.
```

### Texto base para fondos

```
Pixel art side-view background of [LUGAR] in Talca, Chile, [MOMENTO], for a cozy mobile
game. Vertical 2:3, single consistent pixel size, no anti-aliasing, limited soft palette,
three simple depth planes. Landmark in the lower third, empty calm ground at the bottom,
simple sky above. No people, no text, no logos.
```

### Lista para excluir

```
blurry, anti-aliasing, mixed pixel sizes, gradients, smooth shading, 3D render, glossy,
photo, text, letters, logos, watermark, top-down view, isometric
```

No se nombra a artistas vivos ni a juegos existentes para imitarlos.

## 8. Prueba antes de aprobar

1. Con zoom, ¿todos los píxeles miden lo mismo?
2. ¿Todos los colores están en la paleta común?
3. ¿Se reconoce el personaje a tamaño chico?
4. ¿Parece del mismo juego que las piezas aprobadas?
5. ¿Alguien de Talca reconocería el lugar o el tipo de persona?
6. ¿Cumple las reglas fijas? Sin doble sentido, logos ni texto, y apta para niñas y niños.
7. En la captura real del juego, ¿se leen globos, clientes y botones sin esfuerzo?

## 9. Decisiones pendientes de Catalina

- Paleta común: hay que rehacerla a partir del elenco y del fondo aprobados.
- Regla de una sola medida de píxel en la biblia de arte: los clientes usan la mitad del píxel del fondo.
- Tipografía pixelada definitiva.
- Diseño de la abuela Teresa.
