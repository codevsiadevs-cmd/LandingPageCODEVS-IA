import { initBrandNeuralHover } from "./brand-neural-hover.js";

const sectionNeuralTargets = [
  {
    panel: document.querySelector(".proceso__slider"),
    canvas: document.getElementById("proceso-neural-canvas"),
    hoverClass: "proceso__slider--neural-hover",
    gridDiv: 10,
    colorRgb: "0,0,0",
  },
  {
    panel: document.querySelector(".why__slider"),
    canvas: document.getElementById("why-neural-canvas"),
    hoverClass: "why__slider--neural-hover",
    gridDiv: 10,
    colorRgb: "255,255,255",
  },
];

function initSectionNeural() {
  for (const { panel, canvas, hoverClass, gridDiv, colorRgb } of sectionNeuralTargets) {
    if (!panel || !canvas) continue;

    initBrandNeuralHover(panel, canvas, {
      hoverClass,
      gridDiv,
      linkCount: 4,
      wander: 12,
      colorRgb,
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSectionNeural);
} else {
  initSectionNeural();
}
