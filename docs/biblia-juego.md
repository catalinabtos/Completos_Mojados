# Biblia del juego — Completos Mojados

> Documento vivo. Lo aprueba Catalina; los agentes lo leen antes de diseñar.

## La idea en una frase
Atiendes un carrito de completos talquino: vienesas en la olla, pan en la vaporera, y una fila de vecinos con hambre que no espera.

## Para quién
- Gente de Talca, del Maule y de todo Chile que reconoce el completo de esquina.
- Jugadores casuales de 10 a 70 años: partidas cortas (2–3 minutos), con una mano, en el celular.
- Familias: debe poder jugarlo un niño sin nada inapropiado.

## Pilares (lo que hace a este juego ser este juego)
1. **Talca de verdad.** Esquinas, costumbres, comida y personajes reconocibles. El orgullo local es el corazón.
2. **El oficio del carrito.** La olla y la vaporera son la mecánica: hay que adelantarse sin dejar que se revienten las vienesas ni se agüe el pan.
3. **Cariño y humor amable.** Los clientes son vecinos, no obstáculos. Nunca nos reímos *de* alguien, nos reímos *con* ellos.
4. **Rápido de entender, difícil de dominar.** Se aprende en 30 segundos; las tres estrellas de las últimas esquinas cuestan.
5. **Gratis y respetuoso.** Sin anuncios, sin trampas para gastar, sin recolectar datos.

## El núcleo jugable (ya construido)
- Estaciones: **olla** (vienesas al agua) y **vaporera** (pan sobre una toalla). Cada puesto pasa por vacío → cocinando → listo → echado a perder.
- **Tabla:** se arma el completo con pan + vienesa + ingredientes.
- **Clientes** en puestos con barra de paciencia; piden una receta y a veces una bebida de la hielera.
- **Pago y propina:** más rápido = más propina; combos por atender seguido sin perder clientes.
- **Meta de plata** por turno; 1–3 estrellas según cuánto la superes.

Recetas actuales: Completo (tomate, palta, chucrut, mayo), Italiano (tomate, palta, mayo), Dinámico (tomate, palta, americana, mayo), Chacarero (tomate, poroto verde, ají verde, mayo). Bebidas: bebida, jugo, mote con huesillo.

## Reglas de diseño
- Una novedad por esquina como máximo, presentada en la pantalla de introducción.
- Ningún nivel puede depender de reflejos imposibles: se calibra con el bot (`v3/tests/game.test.ts`). La curva sube suave; los saltos bruscos de dificultad son un error.
- Perder debe sentirse justo y explicable ("se te agüaron 4 panes"), nunca arbitrario.
- Todo botón jugable mide al menos 44×44 px y se usa con el pulgar.
- Los textos se leen en menos de 5 segundos.

## Lo que nunca se hace
- Doble sentido, contenido sugerente o burlas a personas, regiones u oficios.
- Anuncios, cajas de botín, monedas premium o temporizadores para presionar a pagar.
- Pedir datos personales, cuentas o permisos innecesarios.
- Copiar personajes, nombres o niveles de otros juegos.

## Modelo
Gratuito. Más adelante, opcional: una "propina al carrito" como compra dentro de la app sin contenido a cambio (iOS) y un enlace de donación en la versión web. La propina nunca desbloquea ventajas.

## Hoja de ruta
- **Fase 1 — Cimientos:** biblias, agentes, propuesta de meta-progresión, primera prueba en TestFlight.
- **Fase 2 — Profundidad:** mejoras del carrito, historia ligera entre esquinas, música, arte unificado en vector.
- **Fase 3 — Contenido:** nuevas zonas y eventos de temporada.
- **Fase 4 — Publicación:** App Store, versión web y, opcionalmente, Google Play.
