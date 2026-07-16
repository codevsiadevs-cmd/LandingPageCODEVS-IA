/**
 * Título hero + logo final: red neuronal recortada dentro de cada letra.
 * En móvil, los logos finales usan el mismo efecto táctil que el título principal.
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

/** Opciones idénticas al título principal CODEVS IA (móvil / desktop). */
function getHeroNeuralOptions(glyph) {
  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  return {
    hoverClass: "hero__brand-letter--neural",
    clipGlyph: glyph,
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
  };
}

function initLetterNeural(root) {
  if (!root) return;

  const isEndLogo = root.classList?.contains("nav__brand-panel--end");
  const letters = [...root.querySelectorAll("[data-hero-letter]")];
  for (const letter of letters) {
    if (letter.__brandNeural) continue;
    const canvas = letter.querySelector("canvas.hero__brand-letter-neural");
    const face = letter.querySelector(".hero__brand-letter-face");
    const glyph = letter.dataset.heroLetter || "";
    if (!canvas || !glyph) continue;

    const opts = getHeroNeuralOptions(glyph);
    opts.clipFontEl = face;
    /* End-logo móvil: proxy táctil en .end-logo (hit-test más fiable en touch) */
    if (isEndLogo && window.matchMedia("(max-width: 768px)").matches) {
      opts.enableTouch = false;
      opts.externalControl = true;
    }
    initBrandNeuralHover(letter, canvas, opts);
  }
}

function rebuildEndLogoNeural() {
  document.querySelectorAll(".nav__brand-panel--end [data-hero-letter]").forEach((letter) => {
    letter.__brandNeural?.rebuild?.();
  });
}

/**
 * Proxy táctil del logo final (móvil): hit-test fiable con elementsFromPoint.
 */
function bindEndLogoTouchProxy() {
  /* Desktop: hover normal en letras, sin proxy */
  if (!window.matchMedia("(max-width: 768px)").matches) return;

  const section = document.querySelector(".end-logo");
  if (!section || section.dataset.neuralProxyBound === "1") return;
  section.dataset.neuralProxyBound = "1";

  let activeLetter = null;

  function letterFromPoint(clientX, clientY) {
    const stack = document.elementsFromPoint(clientX, clientY);
    for (const el of stack) {
      const letter = el.closest?.("[data-hero-letter]");
      if (
        letter?.closest(".nav__brand-panel--end-natural") &&
        letter.__brandNeural
      ) {
        return letter;
      }
    }
    return null;
  }

  function onDown(event) {
    if (event.pointerType === "mouse" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    const letter = letterFromPoint(event.clientX, event.clientY);
    if (!letter?.__brandNeural) return;
    activeLetter = letter;
    letter.__brandNeural.activateAt(event.clientX, event.clientY);
    try {
      section.setPointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onMove(event) {
    if (!activeLetter?.__brandNeural) return;
    const letter = letterFromPoint(event.clientX, event.clientY);
    if (letter && letter !== activeLetter) {
      activeLetter.__brandNeural.deactivate();
      activeLetter = letter;
      letter.__brandNeural.activateAt(event.clientX, event.clientY);
      return;
    }
    activeLetter.__brandNeural.moveAt(event.clientX, event.clientY);
  }

  function onUp(event) {
    if (!activeLetter?.__brandNeural) return;
    activeLetter.__brandNeural.deactivate();
    activeLetter = null;
    try {
      section.releasePointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }
  }

  section.addEventListener("pointerdown", onDown, { passive: true, capture: true });
  section.addEventListener("pointermove", onMove, { passive: true, capture: true });
  section.addEventListener("pointerup", onUp, { passive: true, capture: true });
  section.addEventListener("pointercancel", onUp, { passive: true, capture: true });
}

function initHeroBrandNeural() {
  const heroRoot = document.getElementById("hero-heading");
  const endRoots = [...document.querySelectorAll(".nav__brand-panel--end-natural")];

  if (heroRoot) {
    wrapBrandLetters(heroRoot, ".hero__brand-accent, .hero__brand-plain");
  }
  endRoots.forEach((endRoot) => {
    wrapBrandLetters(
      endRoot,
      ".nav__brand-segment.nav__brand-accent, .nav__brand-segment.nav__brand-plain"
    );
  });

  const start = () => {
    initLetterNeural(heroRoot);
    endRoots.forEach((endRoot) => {
      initLetterNeural(endRoot);
    });
    if (window.matchMedia("(max-width: 768px)").matches) {
      bindEndLogoTouchProxy();
      rebuildEndLogoNeural();
      requestAnimationFrame(() => {
        rebuildEndLogoNeural();
        bindEndLogoTouchProxy();
      });
    }
    /* El fit del end-logo debe correr DESPUÉS del wrap de letras (primer load). */
    window.dispatchEvent(new CustomEvent("end-logo-needs-fit"));
  };

  if (document.fonts?.ready) {
    document.fonts.ready.then(start).catch(start);
  } else {
    start();
  }

  window.addEventListener("end-logo-fitted", () => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      rebuildEndLogoNeural();
    }
  });

  window.addEventListener("load", () => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      rebuildEndLogoNeural();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeroBrandNeural);
} else {
  initHeroBrandNeural();
}
