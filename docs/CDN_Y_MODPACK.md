# Guía de Gestión de CDN y Modpack

Esta guía explica paso a paso cómo alojar y distribuir el contenido de **Dominio Launcher** (noticias, mods, shaders, texturas y configuraciones) a través de un CDN o servidor HTTP estático.

---

## 📑 Tabla de Contenidos
1. [Opciones de Alojamiento para el CDN](#1-opciones-de-alojamiento-para-el-cdn)
2. [Configuración en el Launcher (.env)](#2-configuración-en-el-launcher-env)
3. [Gestión de Noticias (news.json)](#3-gestión-de-noticias-newsjson)
4. [Estructura del Modpack (Mods, Shaders, Texturas)](#4-estructura-del-modpack-mods-shaders-texturas)
5. [Uso del Generador Automático de Manifiesto](#5-uso-del-generador-automático-de-manifiesto)
6. [Activación Automática de Shaders y Texturas](#6-activación-automática-de-shaders-y-texturas)

---

## 1. Opciones de Alojamiento para el CDN

Puedes utilizar cualquier servicio que te permita servir archivos estáticos a través de HTTPS. Algunas opciones recomendadas:

### Opción A: Cloudflare R2 (Recomendada)
- **Ventajas:** 10 GB de almacenamiento gratuito, **0 costes por ancho de banda/egreso**. Es la opción ideal para launchers de Minecraft con descargas frecuentes.
- **Configuración:**
  1. Crea un bucket en Cloudflare R2 (ej: `dominiocraft-cdn`).
  2. Habilita el acceso público al bucket o conecta un subdominio personalizado (ej: `cdn.dominiocraft.com`).
  3. Sube tus archivos respetando la estructura de carpetas.

### Opción B: Servidor VPS con Nginx o Apache
- **Ventajas:** Control total sobre tu infraestructura.
- **Configuración:**
  1. Apunta una ruta estática en Nginx a una carpeta del servidor (ej: `/var/www/cdn/`).
  2. Habilita HTTPS mediante Let's Encrypt / Certbot.
  3. Asegúrate de habilitar CORS (`add_header Access-Control-Allow-Origin *;`) si fuera necesario.

### Opción C: GitHub Pages / Repositorio Público (Para pruebas)
- **Ventajas:** Rápido de montar sin registrar tarjetas.
- **Limitaciones:** Límite de tamaño por archivo de 100 MB y límites de tráfico mensual.
- **Uso:** Sube los archivos a un repositorio y obtén los enlaces directos (vía `raw.githubusercontent.com` o GitHub Pages).

---

## 2. Configuración en el Launcher (.env)

El launcher detecta automáticamente las URLs configuradas en el archivo `.env` en la raíz del proyecto.

Copia `.env.example` a `.env` (si aún no lo has hecho) y define tus endpoints:

```env
# URL base de tu CDN o servidor
VITE_CDN_URL=https://cdn.tudominio.com

# URL directa al manifiesto del modpack
VITE_MODPACK_URL=https://cdn.tudominio.com/modpack.json

# URL directa al feed de noticias
VITE_NEWS_URL=https://cdn.tudominio.com/news.json
```

> [!NOTE]
> Si no defines `VITE_MODPACK_URL` o `VITE_NEWS_URL`, el launcher utilizará por defecto `${VITE_CDN_URL}/modpack.json` y `${VITE_CDN_URL}/news.json`.

---

## 3. Gestión de Noticias (`news.json`)

El feed de noticias en la pantalla principal se alimenta de un archivo JSON que puedes actualizar en cualquier momento en tu CDN sin necesidad de recompilar el launcher.

### Formato del archivo `news.json`:
Puedes consultar la plantilla lista para usar en [cdn-templates/news.example.json](../cdn-templates/news.example.json).

```json
[
  {
    "id": "1",
    "title": "¡Apertura Oficial del Servidor!",
    "content": "Bienvenidos a **Dominio Craft** en la versión **1.21.1 NeoForge**.\n\n### Novedades:\n- Modpack completo sincronizado.\n- Revisa nuestro canal de Discord para eventos semanales.\n- Recuerda asignar 4GB de RAM en los ajustes.",
    "author": {
      "username": "Admin"
    },
    "createdAt": "2026-09-04T12:00:00.000Z",
    "tags": [
      { "name": "Servidor", "color": "#2ca845" },
      { "name": "Evento", "color": "#3498db" }
    ],
    "image": "https://cdn.tudominio.com/images/banner1.webp"
  }
]
```

### Propiedades de cada noticia:
- `title` *(obligatorio)*: Título del artículo.
- `content` *(obligatorio)*: Texto de la noticia. Soporta sintaxis **Markdown** (negritas, cursivas, listas, enlaces, títulos).
- `author` *(opcional)*: Objeto `{ "username": "Nombre" }` o un string directo `"Nombre"`. El launcher obtendrá automáticamente el avatar del jugador vía Minotar.
- `createdAt` *(opcional)*: Fecha en formato ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`). Se muestra formateada en español.
- `tags` *(opcional)*: Lista de etiquetas con nombre y color hexadecimal (ej: `#2ca845`).
- `image` *(opcional)*: URL de una imagen de portada para la noticia.

---

## 4. Estructura del Modpack (Mods, Shaders, Texturas)

El lanzador organiza todos los archivos del juego dentro del directorio de la instancia (`.Dominio Craft/dominio/`).

### Cómo organizar las carpetas en tu CDN:

```text
https://cdn.tudominio.com/
├── modpack.json                     <-- Manifiesto principal
├── news.json                        <-- Noticias
├── mods/                            <-- Mods (.jar)
│   ├── jei-1.21.1-neoforge.jar
│   └── iris-neoforge-1.8.0.jar
├── shaderpacks/                     <-- Shaders (.zip)
│   └── ComplementaryReimagined.zip
├── resourcepacks/                   <-- Paquetes de texturas (.zip)
│   └── DominioCraft_Textures.zip
└── config/                          <-- Configuraciones de mods
    ├── iris.properties
    └── paxi/
        └── datapacks/...
```

---

## 5. Uso del Generador Automático de Manifiesto

Para evitar tener que escribir a mano los nombres, tamaños y hashes **SHA-1** de cada archivo, el proyecto incluye una herramienta CLI automatizada.

### Paso a paso:

1. Crea una carpeta local con los archivos que deseas distribuir, por ejemplo `./modpack-files/`:
   ```text
   modpack-files/
   ├── mods/
   │   ├── jei-1.21.1.jar
   │   └── iris-neoforge.jar
   ├── shaderpacks/
   │   └── ComplementaryReimagined.zip
   ├── resourcepacks/
   │   └── Texturas.zip
   └── config/
       └── iris.properties
   ```

2. Ejecuta el comando generador indicando tu carpeta y la URL de tu CDN:
   ```bash
   node scripts/generate-modpack.js ./modpack-files https://cdn.tudominio.com ./modpack.json
   ```

3. El script creará un archivo `modpack.json` con todos los hashes SHA-1 calculados:
   ```json
   {
     "files": [
       {
         "name": "jei-1.21.1.jar",
         "path": "mods/",
         "url": "https://cdn.tudominio.com/mods/jei-1.21.1.jar",
         "sha1": "da39a3ee5e6b4b0d3255bfef95601890afd80709",
         "size": 1542000,
         "type": "MOD"
       },
       {
         "name": "ComplementaryReimagined.zip",
         "path": "shaderpacks/",
         "url": "https://cdn.tudominio.com/shaderpacks/ComplementaryReimagined.zip",
         "sha1": "e2fc714c4727ee9395f324cd2e7f331f9d9acc96",
         "size": 4512000,
         "type": "SHADERPACK"
       }
     ]
   }
   ```

4. Sube la carpeta de archivos y el `modpack.json` a tu CDN. Cuando los jugadores abran el launcher y pulsen **JUGAR**, el launcher descargará automáticamente solo los archivos que les falten o hayan cambiado.

---

## 6. Activación Automática de Shaders y Texturas

Para que los jugadores no tengan que activar los shaders o texturas manualmente en los menús de Minecraft, puedes distribuir archivos de configuración predefinidos:

### Activar Shaders por defecto (con Iris / Oculus):
Incluye en tu modpack el archivo `config/iris.properties` con el siguiente contenido:
```properties
# Nombre exacto del archivo .zip en shaderpacks/
shaderPack=ComplementaryReimagined.zip
enabled=true
```

### Activar Resourcepacks por defecto:
Incluye en la raíz del modpack (con `path: ""`) el archivo `options.txt` configurado con tu paquete de texturas:
```text
resourcePacks:["vanilla","file/DominioCraft_Textures.zip"]
```
