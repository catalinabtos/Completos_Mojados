# Completos Mojados v3 (iOS)

Juego de gestión de tiempo para iPhone: atiendes un carrito de completos en Talca. Cocinas vienesas en la plancha, armas cada completo con los ingredientes que pide el cliente, le sirves su bebida y cobras antes de que se aburra.

Está hecho con TypeScript + Vite (sin motor gráfico) y se empaqueta como app nativa de iOS con [Capacitor](https://capacitorjs.com/).

## Niveles

| # | Lugar | Duración | Meta | Novedades |
|---|-------|----------|------|-----------|
| 1 | Plaza de Armas | 2:00 | $35.000 | Italiano, Completo, tutorial guiado |
| 2 | Mercado Central | 2:30 | $45.000 | Dinámico, bebidas, 4 puestos |
| 3 | Estadio Fiscal | 2:45 | $70.000 | Chacarero, mote con huesillo, lluvia, 5 puestos |

Ganas el nivel si llegas a la meta: 1 estrella. Con 125 % de la meta ganas 2 estrellas y con 150 %, 3. Ganar un nivel desbloquea el siguiente. El progreso se guarda en el teléfono.

## Cómo se juega

1. Toca la **plancha** para poner una vienesa. Cuando se dore, tócala para pasarla al pan. Si la dejas mucho tiempo, se quema.
2. Toca **Pan**, después la vienesa lista y luego los **ingredientes** del pedido (el orden no importa).
3. Si el cliente pidió bebida, tócala en la **hielera**.
4. **Toca al cliente** para entregarle el pedido. Mientras más rápido, más propina; los pedidos perfectos seguidos suman combo.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests del motor + simulación de los 3 niveles
npm run build
```

- `src/engine/` — lógica pura del juego (`game.ts`), contenido y niveles (`data.ts`) y un bot (`bot.ts`) que los tests usan para comprobar que cada nivel se puede ganar.
- `src/ui/` — pantallas, vista del juego, sonido (WebAudio) y guardado.
- `scripts/balance.ts` — `npx vite-node scripts/balance.ts` muestra cuánto gana el bot en cada nivel según su velocidad de reacción. Sirve para ajustar la dificultad.
- `scripts/e2e.mjs` — juega los 3 niveles en Chromium con viewport de iPhone, tocando la interfaz real.
- `scripts/make-icons.mjs` — regenera el ícono y la pantalla de carga.

## iOS

```bash
npm run ios:sync           # build web + copia a ios/App
npx cap open ios           # abre Xcode (macOS)
```

Para probar en un iPhone desde Xcode, elige tu equipo en *Signing & Capabilities* y presiona Run.

## Publicar en TestFlight

El workflow `.github/workflows/ios-testflight.yml` corre en cada push que toca `v3/`:

1. Ejecuta los tests y el build web en Ubuntu.
2. En macOS compila la app iOS.
   - **Sin credenciales:** sólo compila para el simulador, para verificar que el proyecto está sano.
   - **Con credenciales:** firma automáticamente con Xcode (*cloud signing*), genera el `.ipa` y lo sube a TestFlight con fastlane (`v3/fastlane/Fastfile`).

### Lo que tienes que hacer una vez

1. **Apple Developer Program** activo (USD 99/año).
2. En [App Store Connect](https://appstoreconnect.apple.com) → *Apps* → **＋ Nueva app**:
   - Plataforma iOS, nombre «Completos Mojados» (o el que quieras), idioma Español (Chile).
   - Bundle ID: regístralo en *Certificates, Identifiers & Profiles → Identifiers* como `cl.completosmojados.app`. Si usas otro, créalo como variable de repositorio `IOS_BUNDLE_ID`.
   - SKU: cualquiera, por ejemplo `completos-mojados`.
3. En App Store Connect → *Usuarios y acceso* → *Integraciones* → **App Store Connect API** → genera una key con rol **Admin**. Ese rol es necesario para que Xcode cree el certificado de distribución en la nube. Descarga el `.p8`; sólo se puede descargar una vez.
4. En GitHub → *Settings → Secrets and variables → Actions* → crea estos **secrets**:

   | Secret | Valor |
   |--------|-------|
   | `ASC_KEY_ID` | Key ID de la API key |
   | `ASC_ISSUER_ID` | Issuer ID (aparece arriba de la lista de keys) |
   | `ASC_KEY_P8` | Contenido completo del archivo `.p8`, incluidas las líneas `-----BEGIN PRIVATE KEY-----` |
   | `APPLE_TEAM_ID` | Team ID (developer.apple.com → *Membership*) |

5. Ejecuta el workflow: *Actions → iOS · TestFlight → Run workflow*, o haz push a `main`.
6. Cuando Apple termine de procesar el build (≈10–30 min), aparece en App Store Connect → *TestFlight*. Agrégate como **tester interno** y abre la invitación con la app TestFlight en el iPhone.

El build se declara sin cifrado propio (`ITSAppUsesNonExemptEncryption = false`), así que no pide documentos de exportación.
