/**
 * PROVISIONAL — explorador de marcos / diseño del logo navbar (/adm).
 * Quitar import en adm-main.js + CSS + este archivo al elegir diseño final.
 */
const STORAGE_KEY = "codevs-adm-brand-frame-preview";
const FAB_COMPACT_KEY = "codevs-adm-brand-frame-fab-compact";

const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "classic", label: "Clásico" },
  { id: "border", label: "Marco" },
  { id: "shape", label: "Forma" },
  { id: "accent", label: "Acento" },
  { id: "luxury", label: "Premium" },
  { id: "tech", label: "Tech" },
  { id: "bold", label: "Atrevido" },
  { id: "dark", label: "Oscuro" },
];

const PRESETS = [
  { id: "plain", label: "Producción", category: "classic", detail: "layout.css neon cyan (sin marco preview)" },
  { id: "thin-black", label: "Borde fino", category: "border", detail: "Línea negra 1px" },
  { id: "double-black", label: "Doble marco", category: "border", detail: "Doble línea negra" },
  { id: "heavy-black", label: "Marco grueso", category: "border", detail: "Borde 3px sólido" },
  { id: "inset-plaque", label: "Placa inset", category: "border", detail: "Hundido con sombra interior" },
  { id: "stamp-dashed", label: "Sello dashed", category: "border", detail: "Borde punteado tipo sello" },
  { id: "outline-hollow", label: "Solo contorno", category: "border", detail: "Fondo claro + borde fuerte" },
  { id: "rounded-soft", label: "Esquinas suaves", category: "shape", detail: "Radio 0.55rem flotante" },
  { id: "rounded-pill", label: "Píldora", category: "shape", detail: "Capsule completa" },
  { id: "float-card", label: "Tarjeta flotante", category: "shape", detail: "Separada con sombra" },
  { id: "cut-corners", label: "Esquinas cortadas", category: "shape", detail: "Clip chamfer tech" },
  { id: "ticket-notch", label: "Ticket notch", category: "shape", detail: "Muescas laterales" },
  { id: "bracket-corners", label: "Brackets", category: "shape", detail: "Esquinas en ángulo" },
  { id: "label-skew", label: "Etiqueta skew", category: "shape", detail: "Pegatina inclinada" },
  { id: "cyan-stripe", label: "Franja cyan", category: "accent", detail: "Barra izquierda IA" },
  { id: "purple-stripe", label: "Franja violeta", category: "accent", detail: "Acento secundario" },
  { id: "top-accent", label: "Barra superior", category: "accent", detail: "Línea cyan arriba" },
  { id: "underline-heavy", label: "Subrayado grueso", category: "accent", detail: "Bloque inferior negro" },
  { id: "split-vertical", label: "Split vertical", category: "accent", detail: "División blanco/gris" },
  { id: "double-cyan", label: "Doble cyan", category: "accent", detail: "Marco + glow IA" },
  { id: "gold-luxury", label: "Oro luxury", category: "luxury", detail: "Doble borde dorado" },
  { id: "plaque-metal", label: "Placa metal", category: "luxury", detail: "Gradiente plateado" },
  { id: "glass-frost", label: "Cristal frost", category: "luxury", detail: "Vidrio claro blur" },
  { id: "subtle-gray", label: "Gris editorial", category: "luxury", detail: "Off-white sofisticado" },
  { id: "neon-cyan", label: "Neon cyan", category: "tech", detail: "Glow IA sobre oscuro" },
  { id: "neon-purple", label: "Neon violeta", category: "tech", detail: "Glow púrpura tech" },
  { id: "glass-dark", label: "Glass oscuro", category: "tech", detail: "Panel glass negro" },
  { id: "tech-grid", label: "Grid tech", category: "tech", detail: "Rejilla + borde fino" },
  { id: "corner-ticks", label: "Ticks corner", category: "tech", detail: "Marcas de esquina HUD" },
  { id: "inverted-mono", label: "Invertido B/N", category: "bold", detail: "Fondo negro letras blancas" },
  { id: "retro-offset", label: "Retro offset", category: "bold", detail: "Sombra dura 80s" },
  { id: "shadow-deep", label: "Sombra profunda", category: "bold", detail: "Elevación dramática" },
  { id: "gradient-ring", label: "Anillo gradiente", category: "bold", detail: "Borde cyan-violeta" },
  { id: "tape-badge", label: "Tape badge", category: "bold", detail: "Cinta adhesiva amarilla" },
  { id: "dark-void", label: "Void negro", category: "dark", detail: "Negro absoluto puro" },
  { id: "dark-charcoal", label: "Carbón", category: "dark", detail: "Gris carbón mate" },
  { id: "dark-obsidian", label: "Obsidiana", category: "dark", detail: "Negro volcánico profundo" },
  { id: "dark-carbon", label: "Carbon fiber", category: "dark", detail: "Textura fibra de carbono" },
  { id: "dark-cyan-glow", label: "Cyan glow suave", category: "dark", detail: "Glow IA tenue sobre oscuro" },
  { id: "dark-cyan-strong", label: "Cyan glow fuerte", category: "dark", detail: "Neon cyan intenso" },
  { id: "dark-purple-glow", label: "Purple glow", category: "dark", detail: "Brillo violeta tech" },
  { id: "dark-dual-glow", label: "Dual glow", category: "dark", detail: "Cyan + violeta dual" },
  { id: "dark-glass", label: "Glass dark", category: "dark", detail: "Vidrio oscuro blur" },
  { id: "dark-frost", label: "Frost oscuro", category: "dark", detail: "Escarcha glass negro" },
  { id: "dark-slate", label: "Slate", category: "dark", detail: "Pizarra azul gris" },
  { id: "dark-midnight", label: "Midnight", category: "dark", detail: "Azul medianoche" },
  { id: "dark-matrix-edge", label: "Matrix edge", category: "dark", detail: "Borde verde matrix HUD" },
  { id: "dark-neon-underline", label: "Neon underline", category: "dark", detail: "Subrayado cyan glow" },
  { id: "dark-border-white", label: "Borde blanco", category: "dark", detail: "Marco fino blanco" },
  { id: "dark-plaque", label: "Placa dark", category: "dark", detail: "Placa elevada oscura" },
  { id: "dark-ember", label: "Ember", category: "dark", detail: "Resplandor ámbar cálido" },
];

const panel = document.querySelector(".nav__brand-panel");

function applyFrame(preset, { persist = true } = {}) {
  if (!panel) return;

  if (preset.id === "plain") {
    panel.removeAttribute("data-brand-frame");
  } else {
    panel.dataset.brandFrame = preset.id;
  }

  if (persist) localStorage.setItem(STORAGE_KEY, preset.id);
}

function getSavedIndex() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return 0;
  const idx = PRESETS.findIndex((p) => p.id === saved);
  return idx >= 0 ? idx : 0;
}

function buildUI() {
  if (!panel) return;

  let activeIndex = getSavedIndex();
  let activeCategory = "all";
  let query = "";
  let panelOpen = false;
  let fabCompact = localStorage.getItem(FAB_COMPACT_KEY) === "1";

  const root = document.createElement("div");
  root.className = "brand-frame-preview";
  root.setAttribute("aria-live", "polite");

  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "brand-frame-preview__fab";
  fab.setAttribute("aria-expanded", "false");
  fab.setAttribute("aria-controls", "brand-frame-preview-panel");
  fab.title = "Abrir marcos del logo";
  fab.innerHTML = `
    <span class="brand-frame-preview__fab-icon" aria-hidden="true">◻</span>
    <span class="brand-frame-preview__fab-copy">
      <span class="brand-frame-preview__fab-kicker">Logo</span>
      <span class="brand-frame-preview__fab-label">Producción</span>
    </span>
    <span class="brand-frame-preview__fab-chevron" aria-hidden="true">▲</span>
  `;

  const fabCompactBtn = document.createElement("button");
  fabCompactBtn.type = "button";
  fabCompactBtn.className = "brand-frame-preview__fab-compact-toggle";
  fabCompactBtn.setAttribute("aria-label", "Contraer botón flotante");
  fabCompactBtn.title = "Contraer / expandir botón";
  fabCompactBtn.textContent = "›";
  fab.appendChild(fabCompactBtn);

  const dialog = document.createElement("aside");
  dialog.id = "brand-frame-preview-panel";
  dialog.className = "brand-frame-preview__panel";
  dialog.hidden = true;
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "false");
  dialog.setAttribute("aria-label", "Explorador de marcos del logo");

  dialog.innerHTML = `
    <header class="brand-frame-preview__header">
      <div>
        <p class="brand-frame-preview__eyebrow">Provisional</p>
        <h2 class="brand-frame-preview__title">Marcos del logo</h2>
      </div>
      <div class="brand-frame-preview__header-actions">
        <button type="button" class="brand-frame-preview__minimize" aria-label="Minimizar" title="Minimizar">−</button>
        <button type="button" class="brand-frame-preview__close" aria-label="Minimizar panel" title="Minimizar">×</button>
      </div>
    </header>
    <div class="brand-frame-preview__toolbar">
      <label class="brand-frame-preview__search-wrap">
        <span class="visually-hidden">Buscar marco</span>
        <input type="search" class="brand-frame-preview__search" placeholder="Buscar marco…" autocomplete="off" />
      </label>
      <div class="brand-frame-preview__categories" role="tablist" aria-label="Categorías"></div>
    </div>
    <div class="brand-frame-preview__meta">
      <p class="brand-frame-preview__current"></p>
      <p class="brand-frame-preview__hint">Minimizar para ver el logo · Shift+B abrir · ↑↓ cambiar</p>
    </div>
    <div class="brand-frame-preview__list" role="listbox" aria-label="Marcos disponibles"></div>
    <footer class="brand-frame-preview__footer">
      <button type="button" class="brand-frame-preview__nav-btn" data-nav="prev" aria-label="Marco anterior">←</button>
      <span class="brand-frame-preview__counter"></span>
      <button type="button" class="brand-frame-preview__nav-btn" data-nav="next" aria-label="Marco siguiente">→</button>
      <button type="button" class="brand-frame-preview__minimize-footer">Minimizar y ver página</button>
      <button type="button" class="brand-frame-preview__reset">Restaurar producción</button>
    </footer>
  `;

  const closeBtn = dialog.querySelector(".brand-frame-preview__close");
  const minimizeBtn = dialog.querySelector(".brand-frame-preview__minimize");
  const minimizeFooterBtn = dialog.querySelector(".brand-frame-preview__minimize-footer");
  const searchInput = dialog.querySelector(".brand-frame-preview__search");
  const categoriesEl = dialog.querySelector(".brand-frame-preview__categories");
  const listEl = dialog.querySelector(".brand-frame-preview__list");
  const currentEl = dialog.querySelector(".brand-frame-preview__current");
  const counterEl = dialog.querySelector(".brand-frame-preview__counter");
  const resetBtn = dialog.querySelector(".brand-frame-preview__reset");
  const fabLabel = fab.querySelector(".brand-frame-preview__fab-label");
  const fabChevron = fab.querySelector(".brand-frame-preview__fab-chevron");

  CATEGORIES.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "brand-frame-preview__chip";
    btn.dataset.category = cat.id;
    btn.textContent = cat.label;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", cat.id === "all" ? "true" : "false");
    categoriesEl.appendChild(btn);
  });

  function getFilteredPresets() {
    return PRESETS.filter((preset) => {
      const matchesCategory = activeCategory === "all" || preset.category === activeCategory;
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
    fab.title = panelOpen ? "Minimizar marcos del logo" : `Abrir marcos · activo: ${preset.label}`;
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
      item.className = "brand-frame-preview__item";
      item.dataset.index = String(globalIndex);
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", globalIndex === activeIndex ? "true" : "false");
      if (globalIndex === activeIndex) item.classList.add("is-active");

      item.innerHTML = `
        <span class="brand-frame-preview__item-top">
          <span class="brand-frame-preview__item-name">${preset.label}</span>
          <span class="brand-frame-preview__item-badge">${preset.category}</span>
        </span>
        <span class="brand-frame-preview__item-swatch-wrap" aria-hidden="true">
          <span class="brand-frame-preview__item-swatch" data-brand-frame="${preset.id === "plain" ? "" : preset.id}"></span>
        </span>
        <span class="brand-frame-preview__item-detail">${preset.detail}</span>
      `;

      item.addEventListener("click", () => selectIndex(globalIndex));
      listEl.appendChild(item);
    });

    const activeItem = listEl.querySelector(".is-active");
    if (activeItem) activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
    updateMeta();
  }

  function selectIndex(index, { scrollList = true } = {}) {
    activeIndex = (index + PRESETS.length) % PRESETS.length;
    applyFrame(PRESETS[activeIndex]);
    if (scrollList) renderList();
    else updateMeta();
  }

  function minimizePanel({ pulse = true } = {}) {
    panelOpen = false;
    dialog.hidden = true;
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
    dialog.hidden = false;
    fab.setAttribute("aria-expanded", "true");
    root.classList.add("is-open");
    fabChevron.textContent = "▼";
    renderList();
    searchInput.focus();
    updateMeta();
  }

  fab.addEventListener("click", (event) => {
    if (event.target.closest(".brand-frame-preview__fab-compact-toggle")) return;
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
    if (dialog.contains(target) || fab.contains(target)) return;
    minimizePanel({ pulse: false });
  });

  searchInput.addEventListener("input", () => {
    query = searchInput.value.trim();
    renderList();
  });

  categoriesEl.addEventListener("click", (event) => {
    const chip = event.target.closest(".brand-frame-preview__chip");
    if (!chip) return;
    activeCategory = chip.dataset.category;
    categoriesEl.querySelectorAll(".brand-frame-preview__chip").forEach((el) => {
      el.setAttribute("aria-selected", el === chip ? "true" : "false");
      el.classList.toggle("is-active", el === chip);
    });
    renderList();
  });

  dialog.querySelector('[data-nav="prev"]').addEventListener("click", () => selectIndex(activeIndex - 1));
  dialog.querySelector('[data-nav="next"]').addEventListener("click", () => selectIndex(activeIndex + 1));
  resetBtn.addEventListener("click", () => selectIndex(0));

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

    if (!panelOpen && (event.key === "b" || event.key === "B") && event.shiftKey) {
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

  root.append(dialog, fab);
  document.body.appendChild(root);

  setFabCompact(fabCompact, { persist: false });
  applyFrame(PRESETS[activeIndex], { persist: false });
  updateMeta();
}

buildUI();
