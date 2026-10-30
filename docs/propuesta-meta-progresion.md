# Propuesta: meta-progresión "El carrito crece"

> Estado: **propuesta para aprobación de Catalina**. No se implementa hasta que la apruebe.

## El problema
Hoy, al ganar una esquina se desbloquea la siguiente y nada más. No hay una razón para volver a jugar una esquina ya ganada ni algo que se acumule entre partidas.

## La idea
La plata de cada turno **se guarda en la alcancía del carrito**. Con ella compras mejoras permanentes y decoración. Todo se gana jugando; no existe moneda pagada ni atajos.

## Mejoras del carrito (afectan el juego)
Tres niveles cada una, con precio creciente.

| Mejora | Efecto por nivel | Precios sugeridos |
|---|---|---|
| **Olla más grande** | +1 puesto en la olla (máx. +2 sobre el nivel base) | $15.000 / $40.000 |
| **Toalla gruesa** | El pan aguanta +1,5 s antes de aguarse | $10.000 / $25.000 / $50.000 |
| **Fuego parejo** | La vienesa aguanta +1,5 s antes de reventarse | $10.000 / $25.000 / $50.000 |
| **Banquitos** | Los clientes tienen +2 s de paciencia | $12.000 / $30.000 / $60.000 |
| **Radio del carrito** | +5 % de propina | $20.000 / $45.000 / $80.000 |

## Decoración (no afecta el juego, solo cariño)
Toldo de otro color, letrero con el nombre del carrito, macetero con cardenales, banderitas para el 18, foto de la abuela Teresa. Precios de $5.000 a $30.000.

## Reglas para que siga siendo justo
- **Cada esquina se puede ganar sin ninguna mejora.** La calibración actual del bot se mantiene igual sin mejoras; las mejoras solo hacen el juego más cómodo y ayudan a sacar tres estrellas.
- Repetir una esquina ya ganada da toda la plata del turno, para que a quien se le haga difícil pueda "juntar" y mejorar.
- Las mejoras se ven en el carrito (la olla se ve más grande, aparece la radio), para que se sientan.
- Botón para reiniciar el progreso, por si alguien quiere jugar "de cero".

## Implementación (estimado: 1–2 sesiones de trabajo)
1. Guardado: agregar `wallet` y `upgrades` a `SaveData` (`v3/src/ui/storage.ts`), con migración desde el guardado actual.
2. Motor: un modificador que aplica las mejoras a la configuración del nivel antes de crear `Game` (sin tocar `data.ts`).
3. Interfaz: pantalla "Mi carrito" accesible desde la ruta, con las mejoras, la decoración y la alcancía.
4. Tests: que cada nivel siga ganable sin mejoras y que las mejoras no rompan el motor.
5. Arte: íconos vectoriales de cada mejora (se muestran antes de integrar).

## Decisiones que necesito de ti
1. ¿Te gusta "la plata se guarda en la alcancía" o prefieres una moneda aparte (por ejemplo, "fichas del carrito")?
2. ¿Apruebas las cinco mejoras o cambiarías alguna?
3. ¿Incluimos la decoración desde el principio o la dejamos para después?
