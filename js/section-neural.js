import { initBrandNeuralHover } from "./brand-neural-hover.js";

const sectionNeuralTargets = [
  {
    panel: document.querySelector(".proceso__slider"),
    canvas: document.getElementById("proceso-neural-canvas"),
    hoverClass: "proceso__slider--neural-hover",
    gridDiv: 16,
    colorRgb: "0,0,0",
  },
  {
    panel: document.querySelector(".why__slider"),
    canvas: document.getElementById("why-neural-canvas"),
    hoverClass: "why__slider--neural-hover",
    gridDiv: 16,
    colorRgb: "255,255,255",
  },
];

function initSectionNeural() {
  for (const { panel, canvas, hoverClass, colorRgb } of sectionNeuralTargets) {
    if (!panel || !canvas) continue;

    initBrandNeuralHover(panel, canvas, {
      hoverClass,
      enableTouch: true,
      gridDiv: 12,
      linkCount: 4,
      wander: 0,
      colorRgb,
      reachScale: 0.18,
      nodeRadiusMin: 0.8,
      nodeRadiusMax: 1.4,
      meshLinks: true,
      baseLinkAlpha: 0.18,
      baseNodeAlpha: 0.2,
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSectionNeural);
} else {
  initSectionNeural();
}
