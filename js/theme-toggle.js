/**
 * Toggle de contraste: invierte negro ↔ blanco en toda la página.
 */
const STORAGE_KEY = "codevs-theme-invert";
const btn = document.getElementById("theme-toggle");
const root = document.documentElement;

function isInverted() {
  return root.classList.contains("theme-invert");
}

function applyInvert(on) {
  root.classList.toggle("theme-invert", on);
  root.style.colorScheme = on ? "light" : "dark";

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", on ? "#ffffff" : "#000000");

  if (btn) {
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.classList.toggle("theme-toggle--active", on);
    const label = on ? "Cambiar a fondo negro" : "Cambiar a fondo blanco";
    btn.setAttribute("aria-label", label);
    btn.title = label;
  }

  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function readSaved() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

applyInvert(readSaved());

if (btn) {
  btn.addEventListener("click", () => {
    applyInvert(!isInverted());
  });
}
