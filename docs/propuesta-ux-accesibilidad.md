# Propuesta de UX/UI y accesibilidad

Revisión del 1 de noviembre de 2026, sobre la build 281.

**Estado:** todas las propuestas A1–A14 y U1–U9 quedaron implementadas. Los textos nuevos están en el juego a la espera de tu revisión.

## Cómo se revisó
- Se recorrieron todas las pantallas en 320 × 568, 375 × 667, 390 × 844 y 430 × 932.
- Se midieron contraste, tamaño de texto y tamaño de botones por código, y se revisó el marcado de `v3/src/ui/`.
- Se capturaron los estados del juego: cocinando, listo, echado a perder, pausa y derrota.
- La referencia fue WCAG 2.2 AA, adaptada a un juego con tiempo, y las reglas de `docs/biblia-juego.md`.
- **No se probó** con VoiceOver en un iPhone real ni con personas: eso queda pendiente.

## Lo que ya está bien
- Sin desborde horizontal en ningún tamaño.
- Pausa automática al salir de la app.
- Paciencia con tres señales: largo de la barra, color y cara del cliente.
- Idioma declarado (`es-CL`), textos alternativos en imágenes con información y estrellas con nombre.
- "Empezar de cero" pide confirmación.
- Los colores de interfaz cumplen 4,5:1 desde la última versión.

## Hallazgos y propuestas

Prioridad: **A** impide o dificulta jugar; **M** causa confusión; **B** es un pulido.

### Accesibilidad

| # | Prioridad | Hallazgo | Propuesta |
|---|---|---|---|
| A1 | A | Pausa, Recetas y los botones de juego responden solo a `pointerdown`: con teclado o tecnología de asistencia pueden no funcionar. | Todo botón responde también a `click`, sin duplicar la acción. |
| A2 | A | El lector de pantalla dice "Olla 1" o "Cliente 1", sin estado ni pedido. | Nombres que cambian: "Olla 1: vienesa lista, toca para sacar" y "Cliente 1: Italiano y Jugo". |
| A3 | A | Los avisos y el tutorial no se anuncian. | Regiones `role="status"`. |
| A4 | A | Al cambiar de pantalla el foco se pierde, y los diálogos no se declaran como tales. | Foco al título de cada pantalla; diálogos con `role="dialog"`, fondo inerte, foco inicial y tecla Esc. |
| A5 | M | No hay foco visible para teclado. | Marco `:focus-visible` dentro del botón, porque el recorte escalonado cortaría uno exterior. |
| A6 | A | Un puesto "listo" se distingue casi solo por el borde verde. Falla con daltonismo rojo-verde. | Texto "sacar" en el puesto, igual que "botar". |
| A7 | A | "No llegaste a la meta" y "Completos Mojados" son crema sobre fondo claro: el título de portada mide 1,86:1. | Texto café en resultados y contorno completo en la portada. |
| A8 | M | Hay textos de 10 y 11 pt en globos y estaciones. Jersey 15 pierde lectura bajo 12 pt. | Mínimo de 12 pt. |
| A9 | M | Con "Reducir movimiento" los mensajes flotantes ("+$2.500", "¡Me voy!") desaparecen al instante. | Se quedan quietos y se desvanecen. |
| A10 | A | El tiempo es parte del juego, pero no hay ayuda para quien reacciona más lento. La biblia apunta a personas de 10 a 70 años. | Ajuste **Turno tranquilo**: paciencia y aguante de la comida +50 %. |
| A11 | M | El zoom está bloqueado para evitar gestos accidentales al jugar. | Se mantiene, y se agrega el ajuste **Texto grande** para menús y lectura. |
| A12 | M | Una esquina bloqueada parece un botón normal y al tocarla no pasa nada. | `aria-disabled` y un mensaje que dice cómo abrirla. |
| A13 | B | Calle, cocina, ingredientes y hielera no tienen nombre para el lector. | Regiones y grupos con nombre. |
| A14 | M | Música y efectos se apagan juntos, y la música compite con el lector de pantalla. | Ajustes separados. |

### Experiencia de uso

| # | Prioridad | Hallazgo | Propuesta |
|---|---|---|---|
| U1 | A | Perder no se explica, y la biblia exige que sea justo y explicable. | Una frase con la causa principal y cuánto faltó. |
| U2 | A | "¡A trabajar!" queda hasta 567 pt bajo la pantalla, y "¡Entendido!" hasta 708 pt. | Botón principal fijo abajo. |
| U3 | M | La ruta abre arriba aunque toque la Esquina 8. | Abrir centrada en la esquina que toca. |
| U4 | M | Las metas de estrellas no se ven en ninguna parte. | Mostrarlas en la introducción y decir cuánto faltó para la siguiente. |
| U5 | A | "Reiniciar turno" y "Salir a la ruta" descartan la plata del turno con un toque. | Confirmación que avisa qué se pierde. |
| U6 | M | El sonido solo se cambia en la portada. | Pantalla Ajustes en portada y pausa. |
| U7 | B | "Botar" se ve activo con la tabla vacía. | Se atenúa cuando no hay nada que botar. |
| U8 | B | "Otra vez", "Jugar de nuevo" y "Reintentar" nombran lo mismo. | "Jugar de nuevo" al ganar y "Reintentar" al perder. |
| U9 | B | Nada avisa que ya alcanza para una mejora. | Una línea en resultados. |

## Decisiones

- **Turno tranquilo** no cambia precios y permite ganar estrellas: el juego es gratis, sin ranking y sin competencia.
- **Zoom:** se mantiene bloqueado durante el juego, porque un pellizco accidental rompe el turno. Texto grande cubre la necesidad en las pantallas de lectura.
- **Puestos de 30 pt** y **botones de 40 pt de ancho en 320 × 568:** siguen como excepción hasta tu prueba en iPhone.
- **Vibración:** queda para después, porque suma una dependencia y aún no se ha probado en un teléfono real.

## Textos nuevos para revisar

- Ajustes: "Ajustes", "Sonido", "Efectos del juego", "Música", "Texto grande", "Para menús y pantallas de lectura", "Turno tranquilo", "Los clientes esperan más y la comida aguanta más. Parte en el próximo turno", "Sí", "No", "Listo".
- Puestos: "sacar".
- Esquina bloqueada: "Gana la Esquina N para abrirla".
- Confirmar: "¿Salir del turno?", "¿Reiniciar el turno?", "La plata de este turno no se guarda.", "Sí, salir", "Sí, reiniciar", "Mejor no".
- Introducción: "2 estrellas: $X · 3 estrellas: $Y".
- Resultados: "Te faltaron $X para la meta.", "Te faltaron $X para la siguiente estrella.", "Se te fueron N clientes enojados: adelanta la olla y la vaporera.", "Se te pasaron N panes o vienesas: sácalos apenas estén listos.", "Te faltó vender más: atiende rápido para ganar propina.", "¡Te alcanza para una mejora en Mi carrito!".

## Pendiente después de implementar

1. Probar con VoiceOver en un iPhone real, en especial los menús.
2. Probar Turno tranquilo con alguien que juegue poco.
3. Decidir si las excepciones de tamaño siguen.
