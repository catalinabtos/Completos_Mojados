# Completos Rush - Prototipo M1

Un juego de gestión de tiempo (time-management) en el que atiendes un carrito de completos talquino. Prepara pedidos rápidamente para evitar que los clientes se enojen y se vayan.

## Estructura del Proyecto

El proyecto sigue una estructura MVC (Model-View-Controller) simplificada con los siguientes componentes principales:

```
CompletosRush/
  ├── Assets/
  │   ├── Art/                  # Sprites y assets visuales
  │   ├── Audio/                # Efectos de sonido y música
  │   ├── Scripts/
  │   │   ├── Core/             # Sistemas principales (GameManager, LevelManager, InputController)
  │   │   ├── Entities/         # Entidades del juego (Customer, Order, Station, Table)
  │   │   ├── UI/               # Controladores de interfaz (HUD)
  │   │   └── Scenes/           # Scripts específicos de niveles
  │   ├── Prefabs/              # Prefabs para instanciar (clientes, ingredientes, etc.)
  │   ├── Scenes/               # Escenas del juego (Level_1_1)
  │   └── Resources/
  │       └── Configs/          # Archivos de configuración JSON (recipes.json, levels.json)
```

## Sistemas Principales

- **GameManager**: Singleton para gestionar el estado global del juego.
- **LevelManager**: Controla la lógica específica del nivel actual.
- **InputController**: Gestiona la entrada del jugador y el ensamblaje de órdenes.
- **CustomerController**: Controla el comportamiento de clientes (llegada, espera, pedido, paciencia).
- **Order**: Representa un pedido con sus ingredientes y validación.
- **StationController**: Estaciones de preparación (pan, salchicha, toppings, bebidas, descarte).
- **TableController**: Mesa donde se sientan los clientes.
- **HUDController**: Interfaz de usuario (dinero, objetivo, tiempo, pausa).

## Flujo de Juego

1. Los clientes llegan y se ponen en fila.
2. Se asignan mesas disponibles a los clientes.
3. Los clientes muestran su pedido (burbuja con ingredientes).
4. El jugador interactúa con las estaciones para preparar el pedido.
5. Al completar un pedido, el jugador lo arrastra a la mesa del cliente.
6. El cliente verifica si el pedido es correcto, paga, y eventualmente se va.
7. El nivel se completa al alcanzar el objetivo de dinero.

## Configuración en Unity

### Requisitos

- Unity 2022 LTS
- iOS Build Support
- TextMeshPro

### Configuración de Player Settings para iOS

1. Abrir el proyecto en Unity
2. Ir a Edit > Project Settings > Player
3. En la pestaña iOS:
   - Set Bundle Identifier: `com.yourcompany.completosrush`
   - Minimum iOS Version: 16.0
   - Architecture: ARM64
   - Target Device: iPhone, iPad
   - Display Resolution: Portrait (9:16)
   - Auto Graphics API: Desactivar y usar Metal
   - Color Space: Linear
   - Enable IL2CPP: Activado
   - Strip Engine Code: Activado

4. En Other Settings:
   - Scripting Backend: IL2CPP
   - API Compatibility Level: .NET 4.x
   - C++ Compiler Configuration: Release
   - Active Native Platforms: iOS

5. En Resolution and Presentation:
   - Default Orientation: Portrait
   - Allowed Orientations for Auto Rotation: Sólo Portrait

### Generación de Build para iOS

1. Ir a File > Build Settings
2. Seleccionar la plataforma iOS
3. Agregar escenas abiertas a la compilación (Add Open Scenes)
4. Configurar opciones de desarrollo:
   - Development Build: Activado durante desarrollo
   - Script Debugging: Activado durante desarrollo
   - Autoconnect Profiler: Opcional durante desarrollo
   - Deep Profiling Support: Desactivado (impacta rendimiento)

5. Hacer clic en Build para crear un proyecto Xcode.
6. Abrir el proyecto Xcode resultante y configurar signing para tu cuenta de desarrollo de Apple.
7. Conectar dispositivo iOS y ejecutar.

## Plan de Pruebas Manual

Para verificar que el prototipo cumple con los criterios de aceptación:

1. Verificar recetas correctas: preparar 10 completos Italianos válidos.
2. Probar errores: agregar un topping extra intencionalmente, confirmar la penalización.
3. Probar tiempo: dejar que un cliente agote su paciencia, verificar abandono.
4. Verificar rendimiento: comprobar FPS estable (60) durante el juego.
5. Verificar guardado: completar nivel y confirmar que se guarden métricas.

## Notas de Implementación

- Los assets de arte son simples placeholders que deben reemplazarse.
- La interfaz de usuario está diseñada para dispositivos móviles en modo retrato.
- El sistema está diseñado para facilitar la adición de nuevos niveles y tipos de completos.

## Próximos Pasos (M2)

- Arte final para ingredientes, clientes, fondos
- Efectos de sonido y música
- Animaciones de clientes y preparación
- Sistema de powerups
- Más niveles con dificultad incremental
- Sistema de mejoras para estaciones
- Tutorial guiado para jugadores nuevos
