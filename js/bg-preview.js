/**
 * Selector de color de fondo — paleta + color personalizado.
 * Persiste la elección en localStorage.
 */
const STORAGE_KEY = "codevs-bg-theme";
const DEFAULT_BG = "#0A0F1E";

const PRESETS = [
  { label: "CODEVS", hex: "#0A0F1E" },
  { label: "Negro", hex: "#000000" },
  { label: "Azul noche", hex: "#0B0E14" },
  { label: "Tech", hex: "#0D1528" },
  { label: "Marino", hex: "#0C1445" },
  { label: "Índigo", hex: "#1A1A2E" },
  { label: "Púrpura", hex: "#1E1035" },
  { label: "Verde oscuro", hex: "#0A1F1A" },
  { label: "Slate", hex: "#0F172A" },
  { label: "Carbón", hex: "#121212" },
  { label: "Medianoche", hex: "#050810" },
  { label: "Cian profundo", hex: "#061A1F" },
];

function hexToRgb(hex) {
  const raw = hex.replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function mixRgb(base, target, amount) {
  return base.map((c, i) => c + (target[i] - c) * amount);
}

function normalizeHex(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(withHash)) return null;
  const rgb = hexToRgb(withHash);
  return rgb ? rgbToHex(...rgb).toUpperCase() : null;
}

export function applyPageBackground(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;

  const rgb = hexToRgb(normalized);
  if (!rgb) return null;

  const [r, g, b] = rgb;
  const root = document.documentElement;
  const techRgb = mixRgb(rgb, [255, 255, 255], 0.06);
  const elevatedRgb = mixRgb(rgb, [255, 255, 255], 0.02);
  const techDarkRgb = mixRgb(rgb, [0, 0, 0], 0.12);

  root.style.setProperty("--page-bg", normalized);
  root.style.setProperty("--page-bg-tech", rgbToHex(...techRgb));
  root.style.setProperty("--bg-primary", normalized);
  root.style.setProperty("--bg-elevated", rgbToHex(...elevatedRgb));
  root.style.setProperty("--bg-tech", rgbToHex(...techDarkRgb));
  root.style.setProperty(
    "--bg-tech-over-neural",
    `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.82) 0%, rgba(${r}, ${g}, ${b}, 0.58) 48%, rgba(${r}, ${g}, ${b}, 0.82) 100%)`
  );

  return normalized;
}

function saveTheme(hex) {
  try {
    localStorage.setItem(STORAGE_KEY, hex);
  } catch {
    /* quota / private mode */
  }
}

function loadSavedTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function buildThemePicker() {
  const floatWrap = document.createElement("div");
  floatWrap.className = "bg-preview-float";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "bg-preview-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "bg-preview-panel");
  toggle.setAttribute("aria-label", "Abrir paleta de colores de fondo");
  toggle.title = "Cambiar color de fondo";
  toggle.innerHTML = `<span class="bg-preview-toggle__icon" aria-hidden="true"></span>`;

  const panel = document.createElement("div");
  panel.id = "bg-preview-panel";
  panel.className = "bg-preview-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="bg-preview-panel__head">
      <p class="bg-preview-panel__title">Paleta de fondo</p>
      <button type="button" class="bg-preview-panel__close" aria-label="Cerrar paleta">×</button>
    </div>
    <p class="bg-preview-panel__hint">Elige un tono para personalizar el fondo de la página.</p>
    <div class="bg-preview-panel__palette" role="list" aria-label="Colores de fondo"></div>
    <label class="bg-preview-panel__picker">
      <span>Color personalizado</span>
      <input type="color" id="bg-preview-color" value="${DEFAULT_BG}" />
    </label>
    <button type="button" class="bg-preview-panel__reset" id="bg-preview-reset">Restaurar original</button>
  `;

  floatWrap.append(toggle, panel);
  document.body.append(floatWrap);

  const paletteEl = panel.querySelector(".bg-preview-panel__palette");
  const colorInput = panel.querySelector("#bg-preview-color");
  const resetBtn = panel.querySelector("#bg-preview-reset");
  const closeBtn = panel.querySelector(".bg-preview-panel__close");
  const toggleIcon = toggle.querySelector(".bg-preview-toggle__icon");

  let activeHex = DEFAULT_BG;

  function syncUI(hex) {
    activeHex = hex;
    toggleIcon.style.setProperty("--bg-preview-active", hex);
    colorInput.value = hex;
    paletteEl.querySelectorAll(".bg-preview-swatch").forEach((btn) => {
      const match = btn.dataset.hex?.toUpperCase() === hex.toUpperCase();
      btn.classList.toggle("bg-preview-swatch--active", match);
      btn.setAttribute("aria-pressed", match ? "true" : "false");
    });
  }

  function setBackground(hex, persist = true) {
    const applied = applyPageBackground(hex);
    if (!applied) return;
    syncUI(applied);
    if (persist) saveTheme(applied);
  }

  function openPanel() {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    toggle.classList.add("bg-preview-toggle--open");
  }

  function closePanel() {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.classList.remove("bg-preview-toggle--open");
  }

  PRESETS.forEach(({ label, hex }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bg-preview-swatch";
    btn.dataset.hex = hex;
    btn.setAttribute("role", "listitem");
    btn.setAttribute("aria-label", label);
    btn.setAttribute("aria-pressed", "false");
    btn.title = label;
    btn.style.setProperty("--swatch-color", hex);
    btn.addEventListener("click", () => setBackground(hex));
    paletteEl.appendChild(btn);
  });

  colorInput.addEventListener("input", () => setBackground(colorInput.value));
  resetBtn.addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setBackground(DEFAULT_BG, false);
  });

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    if (panel.hidden) openPanel();
    else closePanel();
  });

  closeBtn.addEventListener("click", () => closePanel());

  document.addEventListener("click", (event) => {
    if (panel.hidden) return;
    if (floatWrap.contains(event.target)) return;
    closePanel();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) closePanel();
  });

  const saved = loadSavedTheme();
  setBackground(saved || DEFAULT_BG, false);
}

buildThemePicker();
