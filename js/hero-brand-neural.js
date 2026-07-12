/**
 * Título hero (CODEVS IA): red neuronal del navbar, recortada dentro de cada letra.
 */
import { initBrandNeuralHover } from "./brand-neural-hover.js";

function wrapHeroBrandLetters(root) {
  const segments = [...root.querySelectorAll(".hero__brand-accent, .hero__brand-plain")];

  for (const segment of segments) {
    if (segment.classList.contains("hero__brand-letter")) continue;

    const text = segment.textContent ?? "";
    if (!text) continue;

    const isAccent = segment.classList.contains("hero__brand-accent");
    const isPlain = segment.classList.contains("hero__brand-plain");
    const frag = document.createDocumentFragment();
    let plainIndex = 0;

    for (const char of text) {
      if (char === "\n" || char === "\r") continue;

      const letter = document.createElement("span");
      letter.className = "hero__brand-letter";
      if (isAccent) letter.classList.add("hero__brand-accent");
      if (isPlain) {
        letter.classList.add("hero__brand-plain");
        if (plainIndex === 0) letter.classList.add("hero__brand-letter--lead");
        plainIndex += 1;
      }
      letter.dataset.heroLetter = char;

      const canvas = document.createElement("canvas");
      canvas.className = "hero__brand-letter-neural";
      canvas.setAttribute("aria-hidden", "true");

      const face = document.createElement("span");
      face.className = "hero__brand-letter-face";
      face.textContent = char;
      face.setAttribute("aria-hidden", "true");

      letter.append(canvas, face);
      frag.append(letter);
    }

    segment.replaceWith(frag);
  }
}

function initHeroBrandNeural() {
  const root = document.getElementById("hero-heading");
  if (!root) return;

  wrapHeroBrandLetters(root);

  /* Esperar tipografía para que el máscara del glifo coincida con la letra visible */
  const start = () => {
    const letters = [...root.querySelectorAll("[data-hero-letter]")];
    for (const letter of letters) {
      const canvas = letter.querySelector("canvas.hero__brand-letter-neural");
      const face = letter.querySelector(".hero__brand-letter-face");
      const glyph = letter.dataset.heroLetter || "";
      if (!canvas || !glyph) continue;

      initBrandNeuralHover(letter, canvas, {
        hoverClass: "hero__brand-letter--neural",
        clipGlyph: glyph,
        clipFontEl: face,
        gridDiv: 10,
        linkCount: 5,
        wander: 14,
        colorRgb: "255,255,255",
        reachScale: 0.28,
        nodeRadiusMin: 1.2,
        nodeRadiusMax: 2.6,
        glyphBaseAlpha: 0,
        mouseSpotlight: true,
        spotlightRadius: 0.38,
      });
    }
  };

  if (document.fonts?.ready) {
    document.fonts.ready.then(start).catch(start);
  } else {
    start();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeroBrandNeural);
} else {
  initHeroBrandNeural();
}
