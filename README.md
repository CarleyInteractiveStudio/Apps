# 🎯 FPSLibrary - Sistema Avanzado de Armas FPS para Roblox

¡Bienvenido a **FPSLibrary**! Una biblioteca modular, moderna y completa para crear juegos FPS en Roblox sin complicaciones de programación.

El usuario no necesita entender ni modificar el código interno: simplemente crea o descarga un **Tool**, añade un script con los parámetros deseados (o usa el Plugin integrado con interfaz gráfica) y la biblioteca se encarga de ubicar todo en su lugar, sincronizar el servidor y el cliente, calcular daño por zonas, aplicar retroceso, miras y HUD.

---

## ✨ Características Principales

- 🚀 **Auto-Instalación en 1 Clic**: Mediante la interfaz del plugin o por código (`FPSLibrary:Install()`), se colocan y configuran automáticamente los scripts y eventos en `ReplicatedStorage`, `ServerScriptService` y `StarterPlayerScripts`.
- 🛠️ **Plugin con Interfaz Gráfica (UI)**: Panel de control visual en Roblox Studio con generador interactivo de armas para crear herramientas completas con un botón.
- 🎯 **Balística Hitscan de Alta Precisión**:
  - Raycast optimizado con trazadoras de bala de neón.
  - Efectos visuales de impacto de partículas en superficies.
- 🩸 **Sistema Avanzado de Daño por Zonas**:
  - Multiplicadores configurables para **Headshots** (tiros a la cabeza) y extremidades.
  - Validación en el servidor para evitar exploits y teletransporte de balas.
- 📜 **Combat Logs en Tiempo Real**:
  - Recopila y emite datos de combate: quién disparó, a quién le dio, arma utilizada, daño infligido, si fue headshot, distancia del disparo y vida restante.
- 🕹️ **Configuración Ultra-Amigable de Teclas y Parámetros**:
  - Permite escribir simplemente `"r"`, `"click_derecho"`, `"shift"`, etc., sin necesidad de conocer `Enum.KeyCode` ni `UserInputType`.
  - Soporta reserva infinita con `"ilimited"` o cantidades fijas.
- 🔫 **Modos de Disparo Múltiples**:
  - `auto` (Automático / ráfaga continua)
  - `semi` (Semiautomático / 1 tiro por clic)
  - `rafaga` (Burst fire / 3 balas)
  - `escopeta` (Shotgun / múltiples perdigones simultáneos)
- 👁️ **Sistema de Apuntado (ADS)**:
  - Modo Zoom de FOV suave o alineación a partes (`AimPart`).
- 🖥️ **HUD y Crosshair Dinámicos**:
  - Contador estilizado de munición (cargador y reserva o símbolo ∞).
  - Soporte de imagen de icono del arma.
  - Crosshair reactivo que se expande al caminar o disparar.
  - Hitmarker visual y de sonido con indicador en rojo al acertar en la cabeza.

---

## 📦 Estructura del Repositorio

```text
├── src/
│   ├── shared/
│   │   └── FPSLibrary.luau           # Módulo principal y analizador de configuración
│   ├── server/
│   │   └── ServerController.luau     # Validación de daño, combat logs y replicación
│   ├── client/
│   │   └── ClientController.luau     # Control de cámara, disparo, efectos, HUD y crosshair
│   └── plugin/
│       └── PluginMain.luau           # Plugin de Roblox Studio con Interfaz Gráfica (UI)
├── examples/
│   ├── PistolaBasica.luau            # Configuración mínima en 10 líneas
│   ├── RifleTacticoAvanzado.luau     # Rifle completo con zoom, retroceso e imagen
│   └── EscopetaCombate.luau          # Escopeta de perdigones
└── tests/
    └── test_library.py               # Pruebas automatizadas de lógica y analizador
```

---

## 🚀 Cómo Usar (Guía Rápida)

### Opción A: Usando el Plugin de Roblox Studio (Recomendado)
1. Instala el plugin desde `src/plugin/PluginMain.luau`.
2. Haz clic en el botón **FPS Creator** en la barra superior de Roblox Studio.
3. Presiona el botón **⚡ Instalar Sistema en el Juego (1-Clic)**.
4. Llena los campos en el **Generador Visual de Armas** y presiona **🔫 Crear Arma en Workspace**. ¡Listo para jugar!

---

### Opción B: Por Código en un Tool
1. Coloca `FPSLibrary.luau` en `ReplicatedStorage`.
2. Crea tu `Tool` con una pieza llamada `Handle`.
3. Crea un `Script` dentro de tu `Tool` y copia lo siguiente:

```lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local FPSLibrary = require(ReplicatedStorage:WaitForChild("FPSLibrary"))

FPSLibrary:RegisterWeapon(script.Parent, {
    nombre = "Rifle de Asalto",
    bala = 30,
    recarga = "ilimited", -- o un número como 90
    dano = 35,
    modo_disparo = "auto",
    tecla_recargar = "r",
    tecla_apuntar = "click_derecho"
})
```

---

## ⚙️ Tabla Completa de Parámetros Configurables

| Parámetro | Tipo | Descripción | Valor por Defecto |
| :--- | :--- | :--- | :--- |
| `nombre` | String | Nombre del arma mostrado en el HUD | `"Arma FPS"` |
| `bala` | Número | Capacidad del cargador actual | `30` |
| `recarga` | Número o String | Balas de reserva o `"ilimited"` | `90` |
| `tiempo_recarga` | Número | Segundos que dura la recarga | `2.0` |
| `dano` | Número | Daño base infligido al torso | `25` |
| `multiplicador_cabeza` | Número | Multiplicador de daño si acierta a la cabeza | `2.0` |
| `multiplicador_extremidades`| Número | Multiplicador para brazos o piernas | `0.8` |
| `distancia_maxima` | Número | Rango máximo de impacto en studs | `500` |
| `dispersion` | Número | Dispersión / Spread de la bala | `0.015` |
| `modo_disparo` | String | `"auto"`, `"semi"`, `"rafaga"`, `"escopeta"` | `"auto"` |
| `cadencia` | Número | Tiempo en segundos entre disparos | `0.12` |
| `perdigones` | Número | Cantidad de perdigones (solo escopeta) | `8` |
| `balas_por_rafaga` | Número | Balas disparadas por ráfaga | `3` |
| `tecla_disparar` | String | `"click_izquierdo"`, `"mouse1"`, etc. | `"click_izquierdo"` |
| `tecla_recargar` | String | `"r"`, `"f"`, `"q"`, etc. | `"r"` |
| `tecla_apuntar` | String | `"click_derecho"`, `"mouse2"`, `"shift"` | `"click_derecho"` |
| `sistema_mira` | String | `"zoom"` o `"posicion"` | `"zoom"` |
| `zoom_fov` | Número | Campo de visión al apuntar con la mira | `50` |
| `retroceso_camara` | Número | Fuerza de retroceso visual de la cámara | `1.2` |
| `imagen_arma` | String | ID de asset de imagen para el HUD | `""` |
| `mostrar_hud` | Booleano | Si se muestra el contador de balas | `true` |
| `mostrar_crosshair` | Booleano | Si se muestra la mirilla en pantalla | `true` |
| `efecto_impacto` | Booleano | Activa partículas de chispas al chocar la bala | `true` |
| `trazadora_bala` | Booleano | Muestra el rayo/trazo de la bala en vuelo | `true` |

---

## 📊 Datos Recopilados de Combate (Combat Logs)

Cada vez que un proyectil impacta a un objetivo, el evento `CombatLog` emite:
- `Shooter`: Nombre del jugador que disparó.
- `ShooterUserId`: ID de Roblox del tirador.
- `Target`: Nombre del jugador o NPC alcanzado.
- `TargetIsPlayer`: Si el objetivo es un jugador real o NPC.
- `Weapon`: Nombre del arma utilizada.
- `HitPart`: Parte del cuerpo alcanzada (Head, HumanoidRootPart, LeftArm, etc.).
- `Damage`: Cantidad exacta de daño infligido.
- `IsHeadshot`: Booleano que indica si fue disparo a la cabeza.
- `Distance`: Distancia en studs desde el origen del disparo al impacto.
- `TargetHealthRemaining`: Vida restante del objetivo.

---

## 📄 Licencia
Este proyecto es de código abierto bajo la licencia MIT.
