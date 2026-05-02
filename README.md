# CODEVS IA — Landing Page

Sitio estático con animación 3D (Three.js), fondo con canvas, secciones con scroll e Intersection Observers.

## Stack

- HTML5
- CSS3 (variables, animaciones, `prefers-reduced-motion`, capas de fondo)
- JavaScript (módulos ES, sin bundler)
- [Three.js](https://threejs.org/) (vía import map y CDN)
- `GLTFLoader` para `assets/3d/logo.glb`

## Estructura de carpetas

```text
/codevs-ia/
├── index.html
├── robots.txt
├── sitemap.xml
├── README.md
├── assets/
│   ├── 3d/logo.glb
│   ├── images/og-cover.png   ← coloca aquí la imagen Open Graph
│   └── fonts/                ← reservado para fuentes autohospedadas
├── css/
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── animations.css
│   └── responsive.css
└── js/
    ├── main.js
    ├── console-easter.js
    ├── scroll.js
    ├── background.js
    ├── three-scene.js
    ├── interactions.js
    └── sections.js
```

## Cómo correr localmente

Al usar módulos ES y rutas relativas, hay que servir el proyecto por HTTP (no abrir `index.html` como `file://`).

Ejemplo con Python:

```bash
cd codevs-ia
python -m http.server 8080
```

Abre `http://localhost:8080`. El modelo GLB y los CSS/JS deben cargar sin CORS.

## Cómo hacer deploy

- Sube la carpeta completa (manteniendo rutas `./css/`, `./js/`, `./assets/`) a cualquier hosting estático (GitHub Pages, Netlify, Vercel, S3, etc.).
- Asegúrate de que `robots.txt` y `sitemap.xml` estén en la raíz del sitio si quieres que se sirvan en `https://tudominio/robots.txt`.
- Coloca `assets/images/og-cover.png` para las meta `og:image` y redes sociales.

## Créditos

Diseño y contenido: **CODEVS IA**. Fuentes: Google Fonts (Syne, IBM Plex Sans). Three.js y addons según licencias del proyecto three.js.
