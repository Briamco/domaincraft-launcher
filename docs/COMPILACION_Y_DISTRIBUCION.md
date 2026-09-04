# Guía de Compilación y Distribución de Instaladores

Esta guía detalla los pasos para empaquetar **Dominio Launcher** en un instalador ejecutable (`.exe`) para Windows y distribuirlo a los jugadores de tu servidor.

---

## 📦 1. Requisitos Previos para Compilar

Antes de generar el instalador final, asegúrate de tener instalado en tu equipo de desarrollo:
- **Node.js** (versión 18, 20 o 22 LTS recomendada).
- **npm** (incluido con Node.js).
- Dependencias del proyecto instaladas:
  ```bash
  npm install
  ```

---

## 🎨 2. Personalización de Iconos e Identidad

El empaquetador utiliza los recursos gráficos ubicados en la carpeta `build/`:

| Archivo | Formato / Tamaño | Uso |
| ------- | ---------------- | --- |
| `build/icon.ico` | `.ico` multicapa (16x16 a 256x256) | Icono del archivo ejecutable e instalador en **Windows** |
| `build/icon.png` | `.png` 512x512 | Icono para la barra de tareas y About panel |
| `build/icon.icns` | `.icns` (opcional) | Icono para **macOS** |

> [!TIP]
> Si deseas cambiar el icono del launcher, puedes sustituir directamente `build/icon.ico` y `build/icon.png` por los logotipos oficiales de tu servidor manteniendo los mismos nombres de archivo.

---

## 🚀 3. Generación del Instalador para Windows

Para compilar el código de TypeScript, empaquetar la aplicación y generar el archivo instalador NSIS:

```bash
npm run release:win
```

### ¿Qué hace este comando?
1. Ejecuta `npm run build`:
   - `tsc`: Comprueba los tipos de TypeScript.
   - `vite build`: Empaqueta los módulos del frontend en `dist/` y los procesos de Electron en `dist-electron/`.
2. Ejecuta `electron-builder --win`:
   - Crea un instalador estándar NSIS (`Dominio Launcher-Setup-0.1.0.exe`) en la carpeta `release/`.
   - Crea una versión portable descomprimida en `release/win-unpacked/`.

### Características del instalador generado:
- **Acceso directo en el Escritorio y Menú Inicio.**
- **Instalación personalizable** (el usuario puede elegir la ruta de instalación).
- **Desinstalador limpio** en el Panel de Control de Windows.
- **Asistente en español.**

---

## 🐧 4. Generación para Otras Plataformas

El proyecto está preparado para compilar en otros sistemas operativos:

| Plataforma | Comando | Formato de Salida en `release/` |
| ---------- | ------- | ------------------------------- |
| **macOS**  | `npm run release:mac` | `.dmg` (Imagen de disco instalable) |
| **Linux**  | `npm run release:lin` | `.AppImage`, `.deb` (Debian/Ubuntu), `.rpm` |

---

## 📤 5. Distribución a los Jugadores

### ¿Qué archivo debes entregar a tus jugadores?
Únicamente el archivo instalador generado:
```text
release/Dominio Launcher-Setup-0.1.0.exe
```

### ¿Los jugadores necesitan tener Java instalado previamente?
**No.** `eml-lib` cuenta con un sistema de gestión automática de runtimes (`java.install: 'auto'`). Si el jugador no dispone de Java 21 en su ordenador, el launcher descargará un JRE oficial de Adoptium/Mojang directamente dentro de `.Dominio Craft/runtime/` sin requerir permisos de administrador ni configuración de variables de entorno PATH.

### ¿Cómo reciben los jugadores las actualizaciones de mods y noticias?
- **Actualizaciones de Mods, Shaders y Texturas:** **No requieren reinstalar el launcher.** Solo debes subir los nuevos archivos y el `modpack.json` actualizado a tu CDN. La próxima vez que el jugador abra el launcher y pulse **JUGAR**, se descargarán los archivos modificados automáticamente.
- **Noticias:** Se actualizan en vivo cada vez que editas `news.json` en tu CDN.
- **Actualizaciones del núcleo del Launcher:** Si modificas el código de la aplicación Electron, compilas una nueva versión (ej. `0.2.0`) y compartes el nuevo instalador.
