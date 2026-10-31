# Biblia de arte — estilo "Carrito de esquina"

> Documento vivo. Todo arte nuevo se muestra a Catalina antes de integrarse.

## Idea visual
Caricatura cálida y plana, como un letrero pintado a mano en un carrito: trazo café grueso, colores planos con una sola luz y una sola sombra, formas redondas. Debe verse **hecho a mano**, no generado.

## Paleta (tokens de `v3/src/ui/styles.css`)
| Token | Color | Uso |
|---|---|---|
| `--cafe` | `#4a2511` | Todos los contornos, texto principal, sombras duras |
| `--mayo` | `#fff4dc` | Fondos claros, tarjetas, botones secundarios |
| `--mostaza` | `#f4a62a` | Fondo de portada, acentos, metas |
| `--tomate` | `#e2412f` | Botón principal, toldo, alertas |
| `--palta` | `#5fa83a` | Éxito, paciencia alta |
| `--vienesa` | `#e0664c` | Vienesas, acentos cálidos |
| `--agua` | `#6ec3ee` | Olla, hielera, frío |
| `--noche` | `#1f2a44` | Niveles de noche y tormenta |

Colores de apoyo para ilustración: pan `#f6c271` (luz `#ffe3a8`, sombra `#e5a14c`), mejillas `#f59a8a`, palta `#7cbf4a`.

## Trazo y formas
- Contorno `--cafe`, grosor 5–6 px en un lienzo de ~260 px (escala proporcional).
- Esquinas y puntas redondeadas (`stroke-linecap/linejoin: round`).
- Una luz (franja clara arriba) y una sombra (arco oscuro abajo) por volumen. Sin degradados realistas, sin texturas, sin brillos de plástico.

## Tipografías
- **Lilita One** para títulos y cifras grandes.
- **Nunito** 700–900 para todo lo demás.

## Personajes
- Proporción "chibi": cabeza grande, cuerpo corto; ojos ovalados oscuros con un brillo blanco; mejillas rosadas.
- Cada cliente tiene **tres caras**: normal, impaciente (cejas fruncidas, boca recta) y enojado (ceño marcado, boca hacia abajo). El enojo es de caricatura, nunca agresivo.
- Ropa y accesorios que identifican el oficio de un vistazo (gorro del hincha, sombrero del huaso, delantal de la casera).
- Diversidad real de Talca: edades, tonos de piel, cuerpos.

### Mascota
El completo sonriente (`v3/src/ui/art/mascota-*.svg`): italiano con tomate en cubos, palta, mayo en zigzag, vienesa y pan con cara, manitos redondas. Versiones: feliz, celebra y preocupada. Es la referencia de estilo para todo lo demás.

## Formatos
- **SVG** para mascota, íconos, ingredientes, estaciones e interfaz (nítido a cualquier tamaño).
- **JPG** solo para fondos de esquinas (1080 px de ancho mínimo; para fotos, 1500 px).
- **WebP** de Canva solo como transición: la meta es migrar personajes e ingredientes a SVG.
- Nada que se muestre a más del tamaño de su archivo (debe ser ≥ 3× su tamaño en pantalla si es imagen de mapa de bits).

## Fondos con fotografía real
Los fondos de esquinas pueden ser fotos reales de Talca y sus alrededores. El contraste entre personajes dibujados y lugar real es intencional: no se disimula con filtros de "pintura". Es la única excepción a la regla contra el estilo realista; personajes, objetos e interfaz siguen siendo ilustración.
- Preferir fotos propias de Catalina. Si son de terceros, usar licencias libres y guardar autor y licencia.
- Formato vertical, con el lugar centrado y el suelo despejado abajo: ahí se paran los clientes.
- Sin logos ni marcas visibles, sin caras reconocibles y sin patentes legibles.

## Lo que no se hace
- Nada sugerente: formas, gotas o salsas que puedan leerse con doble sentido (por eso la mayo es frasco con cuchara, no pomo).
- Estilo realista (salvo fotos reales en fondos de esquinas), 3D, brillos de IA, manos con dedos raros, texto inventado dentro de las imágenes.
- Logos o marcas reales (bebidas, equipos de fútbol): se usan colores, no escudos.
