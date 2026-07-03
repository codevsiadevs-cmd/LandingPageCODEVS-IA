/**
 * PROVISIONAL — explorador de tipografía para slides / títulos de sección (/adm).
 * Quitar import en adm-main.js + CSS + este archivo al elegir estilo final.
 */
const STORAGE_KEY = "codevs-adm-slide-font-preview";
const FAB_COMPACT_KEY = "codevs-adm-slide-font-fab-compact";

const CATEGORIES = [
  { id: "all", label: "Todas" },
  { id: "default", label: "Base" },
  { id: "sans", label: "Sans" },
  { id: "serif", label: "Serif" },
  { id: "display", label: "Display" },
  { id: "script", label: "Cursiva" },
  { id: "exotic", label: "Exótico" },
  { id: "mono", label: "Mono" },
];

const PRESETS = [
  { id: "syne", label: "Syne", category: "default", detail: "Actual del sitio", family: '"Syne", system-ui, sans-serif', google: null },
  { id: "space-grotesk", label: "Space Grotesk", category: "sans", detail: "Geométrica tech", family: '"Space Grotesk", system-ui, sans-serif', google: "Space+Grotesk:wght@400;500;600;700" },
  { id: "outfit", label: "Outfit", category: "sans", detail: "Redondeada moderna", family: '"Outfit", system-ui, sans-serif', google: "Outfit:wght@400;500;600;700" },
  { id: "manrope", label: "Manrope", category: "sans", detail: "Humanista limpia", family: '"Manrope", system-ui, sans-serif', google: "Manrope:wght@400;500;600;700;800" },
  { id: "sora", label: "Sora", category: "sans", detail: "Futurista suave", family: '"Sora", system-ui, sans-serif', google: "Sora:wght@400;500;600;700;800" },
  { id: "dm-sans", label: "DM Sans", category: "sans", detail: "UI corporativa", family: '"DM Sans", system-ui, sans-serif', google: "DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400" },
  { id: "playfair", label: "Playfair Display", category: "serif", detail: "Editorial clásica", family: '"Playfair Display", Georgia, serif', google: "Playfair+Display:wght@400;500;600;700;800;900" },
  { id: "playfair-italic", label: "Playfair Italic", category: "serif", detail: "Serif en cursiva", family: '"Playfair Display", Georgia, serif', google: "Playfair+Display:ital,wght@1,400;1,500;1,600;1,700", style: "italic", weight: "500" },
  { id: "cormorant", label: "Cormorant", category: "serif", detail: "Serif elegante", family: '"Cormorant Garamond", Georgia, serif', google: "Cormorant+Garamond:wght@400;500;600;700" },
  { id: "cormorant-italic", label: "Cormorant Italic", category: "serif", detail: "Elegante cursiva", family: '"Cormorant Garamond", Georgia, serif', google: "Cormorant+Garamond:ital,wght@1,400;1,500;1,600", style: "italic", weight: "500" },
  { id: "lora", label: "Lora", category: "serif", detail: "Serif contemporánea", family: '"Lora", Georgia, serif', google: "Lora:wght@400;500;600;700" },
  { id: "lora-italic", label: "Lora Italic", category: "serif", detail: "Serif fluida cursiva", family: '"Lora", Georgia, serif', google: "Lora:ital,wght@1,400;1,500;1,600;1,700", style: "italic", weight: "500" },
  { id: "libre-baskerville", label: "Libre Baskerville", category: "serif", detail: "Transicional", family: '"Libre Baskerville", Georgia, serif', google: "Libre+Baskerville:ital,wght@0,400;0,700;1,400" },
  { id: "fraunces", label: "Fraunces Black", category: "serif", detail: "Contraste experimental", family: '"Fraunces", Georgia, serif', google: "Fraunces:opsz,wght@9..144,700;900", weight: "900", tracking: "-0.03em" },
  { id: "rozha", label: "Rozha One", category: "display", detail: "Display serif afilada", family: '"Rozha One", Georgia, serif', google: "Rozha+One", weight: "400", tracking: "-0.02em" },
  { id: "cinzel-decor", label: "Cinzel Decorative", category: "display", detail: "Romana decorativa", family: '"Cinzel Decorative", Georgia, serif', google: "Cinzel+Decorative", weight: "400", tracking: "-0.02em" },
  { id: "cinzel", label: "Cinzel", category: "display", detail: "Romana negra", family: '"Cinzel", Georgia, serif', google: "Cinzel:wght@700;900", weight: "700", tracking: "-0.025em" },
  { id: "anton", label: "Anton", category: "display", detail: "Poster condensado", family: '"Anton", Impact, sans-serif', google: "Anton", weight: "400", tracking: "0.03em" },
  { id: "bebas", label: "Bebas Neue", category: "display", detail: "Cartel alto impacto", family: '"Bebas Neue", Impact, sans-serif', google: "Bebas+Neue", weight: "400", tracking: "0.05em" },
  { id: "bungee", label: "Bungee", category: "display", detail: "Bloque urbano", family: '"Bungee", Impact, sans-serif', google: "Bungee", weight: "400" },
  { id: "dancing-script", label: "Dancing Script", category: "script", detail: "Script manuscrita", family: '"Dancing Script", cursive', google: "Dancing+Script:wght@400;500;600;700", weight: "600" },
  { id: "pacifico", label: "Pacifico", category: "script", detail: "Retro surf script", family: '"Pacifico", cursive', google: "Pacifico", weight: "400" },
  { id: "great-vibes", label: "Great Vibes", category: "script", detail: "Caligrafía fina", family: '"Great Vibes", cursive', google: "Great+Vibes", weight: "400" },
  { id: "sacramento", label: "Sacramento", category: "script", detail: "Pluma suave", family: '"Sacramento", cursive', google: "Sacramento", weight: "400" },
  { id: "allura", label: "Allura", category: "script", detail: "Cursiva ornamental", family: '"Allura", cursive', google: "Allura", weight: "400" },
  { id: "parisienne", label: "Parisienne", category: "script", detail: "París vintage", family: '"Parisienne", cursive', google: "Parisienne", weight: "400" },
  { id: "tangerine", label: "Tangerine", category: "script", detail: "Itálica ligera", family: '"Tangerine", cursive', google: "Tangerine:wght@400;700", weight: "700", style: "italic" },
  { id: "italianno", label: "Italianno", category: "script", detail: "Script elegante", family: '"Italianno", cursive', google: "Italianno", weight: "400" },
  { id: "kaushan", label: "Kaushan Script", category: "script", detail: "Brush casual", family: '"Kaushan Script", cursive', google: "Kaushan+Script", weight: "400" },
  { id: "satisfy", label: "Satisfy", category: "script", detail: "Firma manuscrita", family: '"Satisfy", cursive', google: "Satisfy", weight: "400" },
  { id: "prata", label: "Prata", category: "serif", detail: "Didone display", family: '"Prata", Georgia, serif', google: "Prata", weight: "400" },
  { id: "unifraktur", label: "Unifraktur", category: "exotic", detail: "Blackletter gótica", family: '"UnifrakturMaguntia", Georgia, serif', google: "UnifrakturMaguntia", weight: "400" },
  { id: "pricedown", label: "GTA Pricedown", category: "exotic", detail: "San Andreas vibe", family: '"Pricedown Bl", Impact, sans-serif', cdn: "https://fonts.cdnfonts.com/css/pricedown", weight: "400" },
  { id: "permanent-marker", label: "Graffiti Marker", category: "exotic", detail: "Marcador callejero", family: '"Permanent Marker", cursive', google: "Permanent+Marker", weight: "400" },
  { id: "press-start", label: "Press Start 2P", category: "exotic", detail: "Pixel retro 8-bit", family: '"Press Start 2P", monospace', google: "Press+Start+2P", weight: "400", tracking: "0.04em" },
  { id: "russo", label: "Russo One", category: "exotic", detail: "Bloque ruso", family: '"Russo One", Impact, sans-serif', google: "Russo+One", weight: "400" },
  { id: "black-ops", label: "Black Ops One", category: "exotic", detail: "Stencil militar", family: '"Black Ops One", Impact, sans-serif', google: "Black+Ops+One", weight: "400" },
  { id: "wet-paint", label: "Rubik Wet Paint", category: "exotic", detail: "Pintura chorreando", family: '"Rubik Wet Paint", cursive', google: "Rubik+Wet+Paint", weight: "400" },
  { id: "monoton", label: "Monoton", category: "exotic", detail: "Chrome ochentero", family: '"Monoton", sans-serif', google: "Monoton", weight: "400" },
  { id: "teko", label: "Teko Gang", category: "exotic", detail: "Condensada callejera", family: '"Teko", sans-serif', google: "Teko:wght@500;600;700", weight: "600", tracking: "0.04em" },
  { id: "fascinate", label: "Fascinate", category: "exotic", detail: "Retro decorativo", family: '"Fascinate", sans-serif', google: "Fascinate", weight: "400" },
  { id: "ewert", label: "Ewert", category: "exotic", detail: "Western ornamental", family: '"Ewert", serif', google: "Ewert", weight: "400" },
  { id: "rye", label: "Rye", category: "exotic", detail: "Wood type western", family: '"Rye", serif', google: "Rye", weight: "400" },
  { id: "pirata", label: "Pirata One", category: "exotic", detail: "Pirata gótica", family: '"Pirata One", serif', google: "Pirata+One", weight: "400" },
  { id: "new-rocker", label: "New Rocker", category: "exotic", detail: "Metal gótico", family: '"New Rocker", serif', google: "New+Rocker", weight: "400" },
  { id: "creepster", label: "Creepster", category: "exotic", detail: "Horror drip", family: '"Creepster", display', google: "Creepster", weight: "400" },
  { id: "metal-mania", label: "Metal Mania", category: "exotic", detail: "Heavy metal", family: '"Metal Mania", display', google: "Metal+Mania", weight: "400" },
  { id: "rubik-glitch", label: "Rubik Glitch", category: "exotic", detail: "Glitch digital", family: '"Rubik Glitch", sans-serif', google: "Rubik+Glitch", weight: "400" },
  { id: "rubik-moonrocks", label: "Rubik Moonrocks", category: "exotic", detail: "Roca espacial", family: '"Rubik Moonrocks", sans-serif', google: "Rubik+Moonrocks", weight: "400" },
  { id: "bungee-inline", label: "Bungee Inline", category: "exotic", detail: "Inline urbano", family: '"Bungee Inline", sans-serif', google: "Bungee+Inline", weight: "400" },
  { id: "bungee-shade", label: "Bungee Shade", category: "exotic", detail: "Sombra 3D", family: '"Bungee Shade", sans-serif', google: "Bungee+Shade", weight: "400" },
  { id: "londrina", label: "Londrina Solid", category: "exotic", detail: "Cartel sólido", family: '"Londrina Solid", sans-serif', google: "Londrina+Solid", weight: "400" },
  { id: "alfa-slab", label: "Alfa Slab One", category: "exotic", detail: "Slab poster", family: '"Alfa Slab One", serif', google: "Alfa+Slab+One", weight: "400" },
  { id: "shrikhand", label: "Shrikhand", category: "exotic", detail: "India display", family: '"Shrikhand", display', google: "Shrikhand", weight: "400" },
  { id: "righteous", label: "Righteous", category: "exotic", detail: "Retro futurista", family: '"Righteous", display', google: "Righteous", weight: "400" },
  { id: "orbitron", label: "Orbitron", category: "exotic", detail: "Sci-fi geométrica", family: '"Orbitron", sans-serif', google: "Orbitron:wght@400;500;600;700;800;900", weight: "700", tracking: "0.06em" },
  { id: "audiowide", label: "Audiowide", category: "exotic", detail: "Tech racing", family: '"Audiowide", display', google: "Audiowide", weight: "400", tracking: "0.04em" },
  { id: "nosifer", label: "Nosifer", category: "exotic", detail: "Horror sangre", family: '"Nosifer", display', google: "Nosifer", weight: "400" },
  { id: "rampart", label: "Rampart One", category: "exotic", detail: "3D block japonés", family: '"Rampart One", display', google: "Rampart+One", weight: "400" },
  { id: "train-one", label: "Train One", category: "exotic", detail: "Display redonda", family: '"Train One", display', google: "Train+One", weight: "400" },
  { id: "yatra-one", label: "Yatra One", category: "exotic", detail: "India vintage", family: '"Yatra One", display', google: "Yatra+One", weight: "400" },
  { id: "ultra", label: "Ultra", category: "exotic", detail: "Serif gorda retro", family: '"Ultra", serif', google: "Ultra", weight: "400" },
  { id: "freckle", label: "Freckle Face", category: "exotic", detail: "Cartoon punk", family: '"Freckle Face", display', google: "Freckle+Face", weight: "400" },
  { id: "rock-salt", label: "Rock Salt", category: "exotic", detail: "Graffiti crayón", family: '"Rock Salt", cursive', google: "Rock+Salt", weight: "400" },
  { id: "special-elite", label: "Special Elite", category: "exotic", detail: "Máquina escribir", family: '"Special Elite", display', google: "Special+Elite", weight: "400" },
  { id: "rubik-distressed", label: "Rubik Distressed", category: "exotic", detail: "Desgastada", family: '"Rubik Distressed", sans-serif', google: "Rubik+Distressed", weight: "400" },
  { id: "staatliches", label: "Staatliches", category: "exotic", detail: "Grotesk alemana", family: '"Staatliches", display', google: "Staatliches", weight: "400", tracking: "0.05em" },
  { id: "jetbrains", label: "JetBrains Mono", category: "mono", detail: "Mono técnica", family: '"JetBrains Mono", monospace', google: "JetBrains+Mono:wght@400;500;600;700", weight: "500", tracking: "-0.02em" },
  { id: "space-mono", label: "Space Mono", category: "mono", detail: "Mono retro", family: '"Space Mono", monospace', google: "Space+Mono:ital,wght@0,400;0,700;1,400", weight: "400" },
  { id: "ibm-plex-mono", label: "IBM Plex Mono", category: "mono", detail: "Mono corporativa", family: '"IBM Plex Mono", monospace', google: "IBM+Plex+Mono:wght@400;500;600;700", weight: "500" },
];

function loadPresetFont(preset) {
  if (preset.google) {
    const linkId = `slide-font-gf-${preset.id}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${preset.google}&display=swap`;
      document.head.appendChild(link);
    }
    return;
  }
  if (preset.cdn) {
    const linkId = `slide-font-cdn-${preset.id}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = preset.cdn;
      document.head.appendChild(link);
    }
  }
}

function applyPreset(preset, { persist = true } = {}) {
  const root = document.documentElement;

  if (preset.id === "syne") {
    root.removeAttribute("data-slide-font");
    root.removeAttribute("data-slide-font-category");
    root.style.removeProperty("--slide-font-family");
    root.style.removeProperty("--slide-font-style");
    root.style.removeProperty("--slide-font-weight");
    root.style.removeProperty("--slide-font-tracking");
    if (persist) localStorage.setItem(STORAGE_KEY, preset.id);
    return;
  }

  loadPresetFont(preset);
  root.dataset.slideFont = preset.id;
  root.dataset.slideFontCategory = preset.category;
  root.style.setProperty("--slide-font-family", preset.family);
  root.style.setProperty("--slide-font-style", preset.style || "normal");
  root.style.setProperty("--slide-font-weight", preset.weight || "");
  root.style.setProperty("--slide-font-tracking", preset.tracking || "");
  if (persist) localStorage.setItem(STORAGE_KEY, preset.id);
}

function getSavedIndex() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return 0;
  const idx = PRESETS.findIndex((p) => p.id === saved);
  return idx >= 0 ? idx : 0;
}

function buildUI() {
  let activeIndex = getSavedIndex();
  let activeCategory = "all";
  let query = "";
  let panelOpen = false;
  let fabCompact = localStorage.getItem(FAB_COMPACT_KEY) === "1";

  const root = document.createElement("div");
  root.className = "slide-font-preview";
  root.setAttribute("aria-live", "polite");

  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "slide-font-preview__fab";
  fab.setAttribute("aria-expanded", "false");
  fab.setAttribute("aria-controls", "slide-font-preview-panel");
  fab.title = "Abrir explorador de tipografías";
  fab.innerHTML = `
    <span class="slide-font-preview__fab-icon" aria-hidden="true">Aa</span>
    <span class="slide-font-preview__fab-copy">
      <span class="slide-font-preview__fab-kicker">Tipografía</span>
      <span class="slide-font-preview__fab-label">Syne</span>
    </span>
    <span class="slide-font-preview__fab-chevron" aria-hidden="true">▲</span>
  `;

  const fabCompactBtn = document.createElement("button");
  fabCompactBtn.type = "button";
  fabCompactBtn.className = "slide-font-preview__fab-compact-toggle";
  fabCompactBtn.setAttribute("aria-label", "Contraer botón flotante");
  fabCompactBtn.title = "Contraer / expandir botón";
  fabCompactBtn.textContent = "›";
  fab.appendChild(fabCompactBtn);

  const panel = document.createElement("aside");
  panel.id = "slide-font-preview-panel";
  panel.className = "slide-font-preview__panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-label", "Explorador de tipografías");

  panel.innerHTML = `
    <header class="slide-font-preview__header">
      <div>
        <p class="slide-font-preview__eyebrow">Provisional</p>
        <h2 class="slide-font-preview__title">Tipografía slides</h2>
      </div>
      <div class="slide-font-preview__header-actions">
        <button type="button" class="slide-font-preview__minimize" aria-label="Minimizar y ver contenido" title="Minimizar">−</button>
        <button type="button" class="slide-font-preview__close" aria-label="Minimizar panel" title="Minimizar">×</button>
      </div>
    </header>
    <div class="slide-font-preview__toolbar">
      <label class="slide-font-preview__search-wrap">
        <span class="visually-hidden">Buscar fuente</span>
        <input type="search" class="slide-font-preview__search" placeholder="Buscar fuente…" autocomplete="off" />
      </label>
      <div class="slide-font-preview__categories" role="tablist" aria-label="Categorías"></div>
    </div>
    <div class="slide-font-preview__meta">
      <p class="slide-font-preview__current"></p>
      <p class="slide-font-preview__hint">Minimizar para ver la página · Shift+F abrir · ↑↓ cambiar fuente</p>
    </div>
    <div class="slide-font-preview__list" role="listbox" aria-label="Fuentes disponibles"></div>
    <footer class="slide-font-preview__footer">
      <button type="button" class="slide-font-preview__nav-btn" data-nav="prev" aria-label="Fuente anterior">←</button>
      <span class="slide-font-preview__counter"></span>
      <button type="button" class="slide-font-preview__nav-btn" data-nav="next" aria-label="Fuente siguiente">→</button>
      <button type="button" class="slide-font-preview__minimize-footer">Minimizar y ver página</button>
      <button type="button" class="slide-font-preview__reset">Restaurar Syne</button>
    </footer>
  `;

  const closeBtn = panel.querySelector(".slide-font-preview__close");
  const minimizeBtn = panel.querySelector(".slide-font-preview__minimize");
  const minimizeFooterBtn = panel.querySelector(".slide-font-preview__minimize-footer");
  const searchInput = panel.querySelector(".slide-font-preview__search");
  const categoriesEl = panel.querySelector(".slide-font-preview__categories");
  const listEl = panel.querySelector(".slide-font-preview__list");
  const currentEl = panel.querySelector(".slide-font-preview__current");
  const counterEl = panel.querySelector(".slide-font-preview__counter");
  const resetBtn = panel.querySelector(".slide-font-preview__reset");
  const fabLabel = fab.querySelector(".slide-font-preview__fab-label");
  const fabChevron = fab.querySelector(".slide-font-preview__fab-chevron");

  CATEGORIES.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slide-font-preview__chip";
    btn.dataset.category = cat.id;
    btn.textContent = cat.label;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", cat.id === "all" ? "true" : "false");
    categoriesEl.appendChild(btn);
  });

  function getFilteredPresets() {
    return PRESETS.filter((preset) => {
      const matchesCategory =
        activeCategory === "all" || preset.category === activeCategory;
      const haystack = `${preset.label} ${preset.detail} ${preset.category}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }

  function updateMeta() {
    const preset = PRESETS[activeIndex];
    const filtered = getFilteredPresets();
    const filteredIndex = filtered.findIndex((p) => p.id === preset.id);
    currentEl.textContent = `${preset.label} — ${preset.detail}`;
    counterEl.textContent =
      filteredIndex >= 0
        ? `${filteredIndex + 1} / ${filtered.length}`
        : `${activeIndex + 1} / ${PRESETS.length}`;
    fabLabel.textContent = preset.label;
    fab.title = panelOpen
      ? "Minimizar explorador"
      : `Abrir tipografías · activa: ${preset.label}`;
  }

  function setFabCompact(compact, { persist = true } = {}) {
    fabCompact = compact;
    fab.classList.toggle("is-compact", compact);
    fabCompactBtn.textContent = compact ? "‹" : "›";
    fabCompactBtn.setAttribute(
      "aria-label",
      compact ? "Expandir botón flotante" : "Contraer botón flotante"
    );
    if (persist) localStorage.setItem(FAB_COMPACT_KEY, compact ? "1" : "0");
  }

  function pulseFab() {
    fab.classList.remove("is-pulse");
    void fab.offsetWidth;
    fab.classList.add("is-pulse");
    window.setTimeout(() => fab.classList.remove("is-pulse"), 900);
  }

  function renderList() {
    const filtered = getFilteredPresets();
    listEl.innerHTML = "";

    filtered.forEach((preset) => {
      const globalIndex = PRESETS.findIndex((p) => p.id === preset.id);
      const item = document.createElement("button");
      item.type = "button";
      item.className = "slide-font-preview__item";
      item.dataset.index = String(globalIndex);
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", globalIndex === activeIndex ? "true" : "false");
      if (globalIndex === activeIndex) item.classList.add("is-active");

      item.innerHTML = `
        <span class="slide-font-preview__item-top">
          <span class="slide-font-preview__item-name">${preset.label}</span>
          <span class="slide-font-preview__item-badge">${preset.category}</span>
        </span>
        <span class="slide-font-preview__item-sample" style="font-family:${preset.family};font-style:${preset.style || "normal"};font-weight:${preset.weight || "400"}">CODEVS IA</span>
        <span class="slide-font-preview__item-detail">${preset.detail}</span>
      `;

      item.addEventListener("click", () => selectIndex(globalIndex));
      listEl.appendChild(item);
    });

    const activeItem = listEl.querySelector(".is-active");
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    updateMeta();
  }

  function selectIndex(index, { scrollList = true } = {}) {
    activeIndex = (index + PRESETS.length) % PRESETS.length;
    applyPreset(PRESETS[activeIndex]);
    if (scrollList) renderList();
    else updateMeta();
  }

  function minimizePanel({ pulse = true } = {}) {
    panelOpen = false;
    panel.hidden = true;
    fab.setAttribute("aria-expanded", "false");
    root.classList.remove("is-open");
    fabChevron.textContent = "▲";
    updateMeta();
    if (pulse) pulseFab();
  }

  function setPanelOpen(open) {
    if (!open) {
      minimizePanel({ pulse: true });
      return;
    }

    panelOpen = true;
    panel.hidden = false;
    fab.setAttribute("aria-expanded", "true");
    root.classList.add("is-open");
    fabChevron.textContent = "▼";
    renderList();
    searchInput.focus();
    updateMeta();
  }

  fab.addEventListener("click", (event) => {
    if (event.target.closest(".slide-font-preview__fab-compact-toggle")) return;
    setPanelOpen(!panelOpen);
  });

  fabCompactBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    setFabCompact(!fabCompact);
  });

  minimizeBtn.addEventListener("click", () => minimizePanel());
  minimizeFooterBtn.addEventListener("click", () => minimizePanel());
  closeBtn.addEventListener("click", () => minimizePanel());

  document.addEventListener("pointerdown", (event) => {
    if (!panelOpen) return;
    const target = event.target;
    if (panel.contains(target) || fab.contains(target)) return;
    minimizePanel({ pulse: false });
  });

  searchInput.addEventListener("input", () => {
    query = searchInput.value.trim();
    renderList();
  });

  categoriesEl.addEventListener("click", (event) => {
    const chip = event.target.closest(".slide-font-preview__chip");
    if (!chip) return;
    activeCategory = chip.dataset.category;
    categoriesEl.querySelectorAll(".slide-font-preview__chip").forEach((el) => {
      el.setAttribute("aria-selected", el === chip ? "true" : "false");
      el.classList.toggle("is-active", el === chip);
    });
    renderList();
  });

  panel.querySelector('[data-nav="prev"]').addEventListener("click", () => {
    selectIndex(activeIndex - 1);
  });

  panel.querySelector('[data-nav="next"]').addEventListener("click", () => {
    selectIndex(activeIndex + 1);
  });

  resetBtn.addEventListener("click", () => {
    selectIndex(0);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panelOpen) {
      event.preventDefault();
      minimizePanel();
      return;
    }

    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || event.target.isContentEditable) {
      if (panelOpen && event.key === "ArrowDown") {
        event.preventDefault();
        selectIndex(activeIndex + 1);
      } else if (panelOpen && event.key === "ArrowUp") {
        event.preventDefault();
        selectIndex(activeIndex - 1);
      }
      return;
    }

    if (!panelOpen && (event.key === "f" || event.key === "F") && event.shiftKey) {
      event.preventDefault();
      setPanelOpen(true);
      return;
    }

    if (panelOpen && (event.key === "ArrowRight" || event.key === "ArrowDown")) {
      event.preventDefault();
      selectIndex(activeIndex + 1);
    } else if (panelOpen && (event.key === "ArrowLeft" || event.key === "ArrowUp")) {
      event.preventDefault();
      selectIndex(activeIndex - 1);
    }
  });

  categoriesEl.querySelector('[data-category="all"]').classList.add("is-active");

  root.append(panel, fab);
  document.body.appendChild(root);

  setFabCompact(fabCompact, { persist: false });
  applyPreset(PRESETS[activeIndex], { persist: false });
  updateMeta();
}

buildUI();
