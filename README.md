# CODEVS IA — Landing Page

Sitio estático con cerebro 3D (Spline), fondos en canvas, secciones con scroll e Intersection Observers.

Dominio canónico: [https://www.codevsia.com](https://www.codevsia.com)

## Stack

- HTML5 + CSS3 (variables, animaciones, `prefers-reduced-motion`)
- JavaScript (módulos ES, sin bundler)
- [Spline Runtime](https://spline.design/) (CDN) para `assets/3d/particle-ai-brain.splinecode`
- Canvas 2D para grid, partículas y efectos de marca

## Estructura

```text
/
├── index.html
├── robots.txt
├── sitemap.xml
├── vercel.json
├── start-dev.bat
├── assets/
│   ├── 3d/particle-ai-brain.splinecode
│   ├── images/          (logos, flags, posters, OG)
│   ├── videos/soluciones/
│   └── ...
├── css/
│   ├── base.css
│   ├── preloader.css
│   ├── layout.css
│   ├── proceso.css
│   ├── components.css
│   ├── animations.css
│   └── responsive.css
├── js/
│   ├── main.js          (entrada)
│   ├── three-scene.js   (Spline + loop visual)
│   ├── scroll.js
│   ├── i18n.js
│   └── ...
└── scripts/
    ├── dev-server.py    (servidor local)
    └── legacy/          (migraciones one-off; no ejecutar)
```

## Cómo correr localmente

Hay que servir por HTTP (no abrir `index.html` como `file://`).

**En Windows**, no uses `python -m http.server` (rompe módulos `.js`). Usa:

```bash
python scripts/dev-server.py
```

O doble clic en `start-dev.bat`. Abre `http://localhost:8080`.

## Deploy

- Hosting estático en la raíz del dominio (Vercel, Netlify, etc.).
- Las rutas absolutas (`/favicon.ico`, `/assets/...`) asumen el sitio en el dominio raíz, no en subruta.
- `robots.txt` y `sitemap.xml` deben quedar en la raíz pública.

## Créditos

Diseño y contenido: **CODEVS IA**. Fuente: Google Fonts (Syne). Spline Runtime según licencia del proveedor.
