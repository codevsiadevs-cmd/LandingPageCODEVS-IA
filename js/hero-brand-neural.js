/**
 * Título hero + logo final: red neuronal recortada dentro de cada letra.
 */
import { initBrandNeuralHover } from "./brand-neural-hover.js";

/** Ajuste vertical por glifo (+ baja el efecto, − lo sube), en fracción del font-size. */
const GLYPH_NUDGE_Y = {
  C: 0.27,
  o: 0.43,
  d: 0.23,
  e: 0.43,
  v: 0.43,
  s: 0.43,
  I: 0.27,
  A: 0.27,
};

function wrapBrandLetters(root, segmentSelector) {
  const segments = [...root.querySelectorAll(segmentSelector)];

  for (const segment of segments) {
    if (segment.classList.contains("hero__brand-letter")) continue;

    const text = segment.textContent ?? "";
    if (!text) continue;

    const isAccent =
      segment.classList.contains("hero__brand-accent") ||
      segment.classList.contains("nav__brand-accent");
    const isPlain =
      segment.classList.contains("hero__brand-plain") ||
      segment.classList.contains("nav__brand-plain");
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

function initLetterNeural(root) {
  if (!root) return;

  const isMobile = window.matchMedia("(max-width: 900px)").matches;
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
      enableTouch: true,
      gridDiv: isMobile ? 9 : 10,
      linkCount: isMobile ? 4 : 5,
      wander: isMobile ? 10 : 14,
      colorRgb: "255,255,255",
      reachScale: isMobile ? 0.38 : 0.42,
      nodeRadiusMin: isMobile ? 0.7 : 1.6,
      nodeRadiusMax: isMobile ? 1.35 : 3.4,
      spotlightLineWidth: isMobile ? 0.7 : 1.65,
      lineWidth: isMobile ? 0.55 : 1,
      glyphBaseAlpha: 0,
      mouseSpotlight: true,
      spotlightRadius: isMobile ? 0.5 : 0.58,
      lingerMs: 5000,
      fadeOutSpeed: 0.012,
      glyphNudgeY: GLYPH_NUDGE_Y[glyph] ?? 0.27,
    });
  }
}

function initHeroBrandNeural() {
  const heroRoot = document.getElementById("hero-heading");
  const endRoots = [...document.querySelectorAll(".nav__brand-panel--end")];

  if (heroRoot) {
    wrapBrandLetters(heroRoot, ".hero__brand-accent, .hero__brand-plain");
  }
  endRoots.forEach((endRoot) => {
    wrapBrandLetters(
      endRoot,
      ".nav__brand-segment.nav__brand-accent, .nav__brand-segment.nav__brand-plain"
    );
  });

  /* Esperar tipografía para que la máscara del glifo coincida con la letra visible */
  const start = () => {
    initLetterNeural(heroRoot);
    endRoots.forEach((endRoot) => initLetterNeural(endRoot));
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
