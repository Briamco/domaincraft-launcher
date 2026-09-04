# AGENT.md - Guía para Agentes de IA

Bienvenido al repositorio de **Dominio Launcher** (`domaincraft-launcher`). Este documento sirve como punto de referencia central y fuente única de la verdad para agentes de IA (Gemini, Claude, Cursor, Copilot, Antigravity, etc.) que trabajen en este proyecto.

---

## 1. Visión General del Proyecto

**Dominio Launcher** es un launcher personalizado de Minecraft para la comunidad **Dominio Craft**, construido sobre Electron y tecnologías web modernas.

- **Stack Tecnológico**:
  - **Runtime**: Electron 41 (Node 22 / Chromium)
  - **Frontend**: TypeScript, Vite 8, SCSS, HTML5
  - **Librería Core de Minecraft**: `eml-lib` (Electron Minecraft Launcher Library)
  - **Seguridad UI**: DOMPurify (`dompurify`) + `marked` para renderizado seguro de noticias Markdown
  - **Visor de Skins**: `skinview3d` (Three.js canvas 3D)
  - **Empaquetador**: `electron-builder` (con instalador NSIS para Windows, DMG/Zip para macOS, AppImage/deb/rpm para Linux)

---

## 2. Estructura del Código

```text
domaincraft-launcher/
├── electron/                   # Proceso Principal (Node.js / Electron Backend)
│   ├── main.ts                 # Ciclo de vida de la ventana, IPC y menú
│   ├── preload.ts              # Puente seguro de contexto (contextBridge)
│   ├── config.ts               # Configuración central (CDN, modpack, noticias, versión default)
│   └── handlers/               # Handlers IPC modulares
│       ├── auth.ts             # Autenticación No Premium (CrackAuth) y Microsoft (MSAuth)
│       ├── launcher.ts         # Orquestación de descarga, mods y lanzamiento de Minecraft
│       ├── modpack.ts          # Sincronización de mods, shaders, resourcepacks y configs desde CDN
│       ├── news.ts             # Obtención y cacheo de noticias del servidor
│       ├── profiles.ts         # Gestión de perfiles locales de juego
│       └── settings.ts         # Configuración del launcher (RAM, Java, resolución, etc.)
│
├── src/                        # Proceso de Renderizado (Frontend UI)
│   ├── init.ts                 # Inicialización y enrutamiento SPA reactivo
│   ├── views/                  # Vistas de la aplicación
│   │   ├── login.ts            # Pantalla de inicio de sesión (No Premium / Microsoft)
│   │   ├── home.ts             # Pantalla principal (noticias, estado, botón JUGAR)
│   │   ├── settings.ts         # Pantalla de ajustes (RAM, Java, pantalla completa)
│   │   └── base.ts             # Clase base de vistas
│   ├── components/             # Componentes UI reutilizables
│   └── static/
│       ├── images/             # Activos gráficos (fondos, logos)
│       └── styles/             # Hojas de estilo SCSS estructuradas
│           ├── _variables.scss # Paleta de colores, tipografías y métricas
│           ├── main.scss       # Estilos globales y layout
│           ├── login.scss      # Estilos de la vista de login
│           ├── home.scss       # Estilos del panel principal y noticias
│           └── settings.scss   # Estilos del modal de ajustes
│
├── scripts/                    # Utilidades de desarrollo y mantenimiento
│   └── generate-modpack.js     # Generador del manifiesto modpack.json con hashes SHA-1
│
├── docs/                       # Documentación técnica exhaustiva
│   ├── ARQUITECTURA.md         # Diagramas y flujo de datos IPC
│   ├── CDN_Y_MODPACK.md        # Especificación del CDN y manifiestos
│   └── COMPILACION_Y_DISTRIBUCION.md # Guía para compilar e instalar en producción
│
├── build/                      # Recursos de empaquetado (iconos .ico, .icns, .png)
├── AGENT.md                    # Esta guía central para agentes
├── GEMINI.md                   # Redirección para Gemini
├── CLAUDE.md                   # Redirección para Claude
├── package.json                # Dependencias, scripts y configuración de electron-builder
└── tsconfig.json               # Configuración TypeScript
```

---

## 3. Reglas y Convenciones Críticas

### A. Directorio del Juego y Perfil por Defecto
- **Ruta de instalación**:
  - Windows: `%APPDATA%\.Dominio Craft\dominio\`
  - Linux: `~/.Dominio Craft/dominio/`
  - macOS: `~/Library/Application Support/Dominio Craft/dominio/`
- **Versión predeterminada**: **NeoForge 1.21.1**
  - Minecraft Version: `1.21.1`
  - Loader: `neoforge`
  - Loader Version: `21.1.248` (definido en `electron/config.ts`)
- **Autenticación**:
  - Soporta modo **No Premium** nativo mediante `CrackAuth` (`eml-lib`).
  - No requiere ni valida contraseñas en modo offline (solo un nombre de usuario válido de 3 a 16 caracteres alfanuméricos).

### B. Paleta Visual y Diseño
- **Tema**: Estilo Minecraft Dark Mode con acentos verdes esmeralda.
- **Colores principales**:
  - Fondo oscuro / base: `#242424` / `#1e1e1e` / `#161616`
  - Acento verde esmeralda: `#2ca845` (hover: `#238636`, active: `#1e7e34`)
  - Texto principal: `#f0f0f0`
  - Bordes y divisores: `#383838`
- Las vistas de login y home usan el fondo temático `news.webp` cubriendo todo el viewport con overlay oscuro semi-transparente.

### C. CDN y Sincronización de Contenido
- **Variables de Entorno** (`.env`):
  - `VITE_CDN_URL`: URL base del CDN (por defecto: `https://cdn.tudominio.com`).
  - `VITE_MODPACK_URL`: URL directa a `modpack.json`.
  - `VITE_NEWS_URL`: URL directa a `news.json`.
- **Soporte de Recursos**: El sincronizador (`electron/handlers/modpack.ts`) procesa 4 categorías:
  1. `mods`: instalados en `mods/`
  2. `shaders`: instalados en `shaderpacks/`
  3. `resourcepacks`: instalados en `resourcepacks/`
  4. `configs`: instalados en la raíz de la instancia o subcarpetas correspondientes
- Cada archivo se valida mediante hash **SHA-1** antes de descargar.
- Para generar el archivo `modpack.json` a partir de una carpeta local:
  ```bash
  npm run generate:modpack
  ```

---

## 4. Comandos de Desarrollo y Compilación

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el entorno de desarrollo con Hot Reload (Vite + Electron) |
| `npm run build` | Compila TypeScript y construye los bundles de producción en `dist/` y `dist-electron/` |
| `npm run generate:modpack` | Escanea la carpeta `modpack-dist/` y genera `modpack.json` con hashes SHA-1 |
| `npm run release:win` | Genera el instalador de Windows (`Dominio Launcher-Setup-0.1.0.exe`) en `release/` |
| `npm run release:lin` | Genera paquetes Linux (AppImage, deb, rpm) |
| `npm run release:mac` | Genera instaladores macOS (DMG, zip) |

---

## 5. Consideraciones para Windows y Caché de Build

- `electron-builder` descarga `winCodeSign-2.6.0.7z` en `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign`.
- **Atención a enlaces simbólicos**: La herramienta oficial `winCodeSign.7z` contiene enlaces simbólicos para macOS (`darwin/.../libcrypto.dylib`). En sistemas Windows sin permisos de administrador o Modo Desarrollador, la extracción nativa falla con el error `A required privilege is not held by the client`.
- La solución es mantener descomprimido el directorio `winCodeSign-2.6.0` en `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0` (extrayendo con la opción `-snl-` de 7-Zip).

---

## 6. Buenas Prácticas al Modificar Código

1. **Seguridad en Electron**:
   - `contextIsolation` siempre debe permanecer en `true`.
   - `nodeIntegration` siempre debe permanecer en `false`.
   - Toda comunicación entre Frontend y Backend debe transcurrir a través de canales IPC tipados en `electron/preload.ts`.
   - Sanitizar siempre HTML generado dinámicamente usando `DOMPurify.sanitize()`.
2. **Estilo de Código**:
   - TypeScript estricto.
   - Variables CSS / SCSS centralizadas en `src/static/styles/_variables.scss`.
   - Respetar los comentarios existentes y la documentación interna.
