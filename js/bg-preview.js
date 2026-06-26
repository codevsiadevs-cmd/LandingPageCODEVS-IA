/**
 * Herramienta de previsualización de fondo (solo localhost o ?bgpreview=1).
 * Permite probar colores de fondo y ver el hex para copiar al CSS.
 */
const isPreviewHost =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1" ||
  location.search.includes("bgpreview=1");

const DEFAULT_BG = "#0A0F1E";

const PRESETS = [
  { label: "Actual", hex: "#0A0F1E" },
  { label: "Negro", hex: "#000000" },
  { label: "Azul noche", hex: "#0B0E14" },
  { label: "Tech", hex: "#0D1528" },
  { label: "GitHub", hex: "#0D1117" },
  { label: "Slate", hex: "#0F172A" },
  { label: "Gray 900", hex: "#111827" },
  { label: "Índigo", hex: "#1A1A2E" },
  { label: "Marino", hex: "#0C1445" },
  { label: "Carbón", hex: "#121212" },
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

function applyPageBackground(hex) {
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

function buildPanel() {
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "bg-preview-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "bg-preview-panel");
  toggle.title = "Probar color de fondo";
  toggle.innerHTML = `<span class="bg-preview-toggle__icon" aria-hidden="true"></span><span class="bg-preview-toggle__label">Fondo</span>`;

  const panel = document.createElement("div");
  panel.id = "bg-preview-panel";
  panel.className = "bg-preview-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <p class="bg-preview-panel__title">Color de fondo</p>
    <p class="bg-preview-panel__hint">Prueba tonos y copia el hex que prefieras.</p>
    <div class="bg-preview-panel__current">
      <span class="bg-preview-panel__swatch" id="bg-preview-current-swatch" aria-hidden="true"></span>
      <code id="bg-preview-current-hex">${DEFAULT_BG}</code>
    </div>
    <div class="bg-preview-panel__presets" role="list" aria-label="Colores predefinidos"></div>
    <label class="bg-preview-panel__picker">
      <span>Personalizado</span>
      <input type="color" id="bg-preview-color" value="${DEFAULT_BG}" />
    </label>
    <label class="bg-preview-panel__hex">
      <span>Hex</span>
      <input type="text" id="bg-preview-hex" value="${DEFAULT_BG}" spellcheck="false" autocomplete="off" />
    </label>
    <button type="button" class="bg-preview-panel__reset" id="bg-preview-reset">Restaurar original</button>
  `;

  document.body.append(toggle, panel);

  const presetsEl = panel.querySelector(".bg-preview-panel__presets");
  const colorInput = panel.querySelector("#bg-preview-color");
  const hexInput = panel.querySelector("#bg-preview-hex");
  const currentHex = panel.querySelector("#bg-preview-current-hex");
  const currentSwatch = panel.querySelector("#bg-preview-current-swatch");
  const resetBtn = panel.querySelector("#bg-preview-reset");

  function syncUI(hex) {
    currentHex.textContent = hex;
    currentSwatch.style.background = hex;
    colorInput.value = hex;
    hexInput.value = hex;
    presetsEl.querySelectorAll(".bg-preview-preset").forEach((btn) => {
      btn.classList.toggle("bg-preview-preset--active", btn.dataset.hex?.toUpperCase() === hex.toUpperCase());
    });
  }

  function setBackground(hex) {
    const applied = applyPageBackground(hex);
    if (applied) syncUI(applied);
  }

  PRESETS.forEach(({ label, hex }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bg-preview-preset";
    btn.dataset.hex = hex;
    btn.setAttribute("role", "listitem");
    btn.title = hex;
    btn.innerHTML = `<span class="bg-preview-preset__chip" style="background:${hex}"></span><span>${label}</span>`;
    btn.addEventListener("click", () => setBackground(hex));
    presetsEl.appendChild(btn);
  });

  colorInput.addEventListener("input", () => setBackground(colorInput.value));
  hexInput.addEventListener("change", () => {
    const applied = applyPageBackground(hexInput.value);
    if (applied) syncUI(applied);
    else hexInput.value = currentHex.textContent;
  });
  resetBtn.addEventListener("click", () => setBackground(DEFAULT_BG));

  toggle.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.classList.toggle("bg-preview-toggle--open", open);
  });

  syncUI(DEFAULT_BG);
}

if (isPreviewHost) {
  buildPanel();
}
